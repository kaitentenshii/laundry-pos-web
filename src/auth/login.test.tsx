import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from './AuthProvider'
import { parseLoginResponse, saveSession, SESSION_KEY } from './session'

const user = { id: 1, name: 'Admin Laundry', username: 'admin', email: 'admin@example.com', role: 'admin' }
const success = { access_token: 'test-token', token_type: 'Bearer', expires_in: 3600, user }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const fetchMock = vi.fn()

beforeEach(() => {
  sessionStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

function openApp(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}
function fillCredentials() {
  fireEvent.change(screen.getByLabelText('Username atau email'), { target: { value: ' admin@example.com ' } })
  fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'valid-password-123' } })
}

it('redirects protected routes to login and validates required fields without an API call', async () => {
  openApp('/customers')
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  expect(screen.getByText('Masukkan username atau email Anda.')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('submits credentials once, displays loading, and returns to the requested route with the role', async () => {
  let resolve!: (value: Response) => void
  fetchMock.mockReturnValue(new Promise<Response>(done => { resolve = done }))
  openApp('/customers')
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  expect((screen.getByRole('button', { name: 'Sedang masuk…' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('button', { name: 'Sedang masuk…' }).closest('form')!)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [, options] = fetchMock.mock.calls[0]
  expect(JSON.parse(options.body)).toEqual({ identifier: 'admin@example.com', password: 'valid-password-123' })
  await act(async () => resolve(json(success)))
  await screen.findByRole('heading', { name: 'Customers' })
  expect(screen.getByLabelText('Akun aktif').textContent).toContain('Admin Laundry')
  expect(sessionStorage.getItem(SESSION_KEY)).not.toContain('password')
})

it.each([
  [401, 'invalid_credentials', 'Username, email, atau kata sandi tidak sesuai.'],
  [403, 'account_inactive', 'Akun Anda tidak aktif. Hubungi administrator laundry.'],
  [500, 'internal_error', 'Server belum dapat memproses permintaan. Silakan coba lagi.'],
])('shows login failures without persisting credentials', async (status, code, message) => {
  fetchMock.mockResolvedValue(json({ error: { code } }, status))
  openApp('/login')
  fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  expect((await screen.findByRole('alert')).textContent).toBe(message)
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  expect((screen.getByLabelText('Kata sandi') as HTMLInputElement).value).toBe('')
})

it('shows a recoverable network error', async () => {
  fetchMock.mockRejectedValue(new TypeError('Network unavailable'))
  openApp('/login')
  fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Tidak dapat terhubung ke server')
  expect((screen.getByRole('button', { name: 'Masuk ke ruang kerja' }) as HTMLButtonElement).disabled).toBe(false)
})

it('checks a restored token on the backend before exposing protected content', async () => {
  saveSession(parseLoginResponse(success))
  let resolve!: (value: Response) => void
  fetchMock.mockReturnValue(new Promise<Response>(done => { resolve = done }))
  openApp('/customers')
  expect(screen.getByRole('status').textContent).toBe('Memeriksa sesi…')
  expect(screen.queryByRole('heading', { name: 'Customers' })).toBeNull()
  await act(async () => resolve(json({ user })))
  await screen.findByRole('heading', { name: 'Customers' })
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toContain('/auth/me')
  expect(new Headers(options.headers).get('Authorization')).toBe('Bearer test-token')
})

it('rejects a revoked restored token and clears storage', async () => {
  saveSession(parseLoginResponse(success))
  fetchMock.mockResolvedValue(json({ error: { code: 'unauthorized' } }, 401))
  openApp('/customers')
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  expect((await screen.findByRole('alert')).textContent).toContain('Sesi Anda telah berakhir')
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
})

it('revokes the token on logout and redirects to login', async () => {
  fetchMock.mockResolvedValueOnce(json(success)).mockResolvedValueOnce(new Response(null, { status: 204 }))
  openApp('/login')
  fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  await screen.findByRole('heading', { name: 'Welcome to Laundry POS' })
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  expect(fetchMock.mock.calls[1][0]).toContain('/auth/logout')
  expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer test-token')
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
})

it('expires an authenticated session automatically', async () => {
  fetchMock.mockResolvedValue(json({ ...success, expires_in: 1 }))
  openApp('/login')
  fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  await screen.findByRole('heading', { name: 'Welcome to Laundry POS' })
  vi.useFakeTimers()
  await act(async () => { vi.setSystemTime(Date.now() + 2000); window.dispatchEvent(new Event('focus')) })
  expect(screen.getByRole('heading', { name: 'Selamat datang kembali' })).toBeTruthy()
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
})
