import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'

const user = { id: 1, name: 'Admin Laundry', username: 'admin', email: 'admin@test.example', role: 'admin' }
const initial = { ...user, is_active: true, last_active_at: null }
let accounts: typeof initial[]
let requests: { url: string; body: Record<string, unknown>; method: string }[]
beforeEach(() => {
  sessionStorage.clear(); accounts = [initial]; requests = []
  saveSession(parseLoginResponse({ access_token: 'users-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (!options.method || options.method === 'GET') return new Response(JSON.stringify({ data: accounts }))
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    requests.push({ url, body, method: options.method })
    if (body.identifier === 'duplicate') return new Response(JSON.stringify({ error: { code: 'conflict', message: 'Username atau email sudah digunakan.' } }), { status: 409 })
    if (options.method === 'POST') accounts = [...accounts, { id: 2, name: body.name as string, username: body.identifier as string, email: '', role: body.role as string, is_active: body.is_active as boolean, last_active_at: null }]
    else accounts = accounts.map(account => account.id === Number(url.split('/').at(-1)) ? { ...account, name: body.name as string, is_active: body.is_active as boolean } : account)
    return new Response(JSON.stringify({ data: accounts.at(-1) }), { status: options.method === 'POST' ? 201 : 200 })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function open() { render(<MemoryRouter initialEntries={['/users']}><AuthProvider><App /></AuthProvider></MemoryRouter>) }

it('lists accounts and creates an active cashier through the modal', async () => {
  open(); await screen.findByRole('table')
  fireEvent.click(screen.getByRole('button', { name: '+ Tambah pengguna' }))
  const dialog = screen.getByRole('dialog')
  expect(document.activeElement).toBe(within(dialog).getByLabelText('Nama *'))
  fireEvent.change(within(dialog).getByLabelText('Nama *'), { target: { value: 'Kasir Baru' } })
  fireEvent.change(within(dialog).getByLabelText('Username atau email *'), { target: { value: 'cashier-new' } })
  fireEvent.change(within(dialog).getByLabelText('Kata sandi awal *'), { target: { value: 'password1234' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan pengguna' }))
  await screen.findByText('Pengguna berhasil ditambahkan.')
  expect((await screen.findByRole('table')).textContent).toContain('Kasir Baru')
  expect(requests[0].body).toMatchObject({ name: 'Kasir Baru', identifier: 'cashier-new', role: 'cashier', is_active: true })
  expect(sessionStorage.getItem('laundry-pos-session')).not.toContain('password1234')
})

it('validates required fields before submitting and preserves the dialog on a server conflict', async () => {
  open(); await screen.findByRole('table')
  fireEvent.click(screen.getByRole('button', { name: '+ Tambah pengguna' }))
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pengguna' }))
  expect(screen.getByText('Masukkan username atau email.')).toBeTruthy()
  expect(requests).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('Nama *'), { target: { value: 'Kasir' } })
  fireEvent.change(screen.getByLabelText('Username atau email *'), { target: { value: 'duplicate' } })
  fireEvent.change(screen.getByLabelText('Kata sandi awal *'), { target: { value: 'password1234' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pengguna' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Username atau email sudah digunakan.')
  expect(screen.getByRole('dialog')).toBeTruthy()
})

it('blocks changing the current admin role/status and closes the modal on Escape', async () => {
  open(); await screen.findByRole('table')
  fireEvent.click(screen.getByRole('button', { name: 'Edit akun Admin Laundry' }))
  expect((screen.getByLabelText('Peran *') as HTMLSelectElement).disabled).toBe(true)
  expect((screen.getByLabelText('Status akun') as HTMLSelectElement).disabled).toBe(true)
  expect(screen.queryByLabelText('Kata sandi awal *')).toBeNull()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
})
