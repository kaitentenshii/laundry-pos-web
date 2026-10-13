import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from './TestApp'
import { AuthProvider } from './AuthProvider'
import { SESSION_KEY } from './session'

const fetchMock = vi.fn()
beforeEach(() => { sessionStorage.clear(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('clears local authentication even if server logout fails and rejects subsequent protected navigation', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'logout-token', token_type: 'Bearer', expires_in: 3600, user: { id: 1, name: 'Admin', username: 'admin', email: 'admin@test.example', role: 'admin' } }), { status: 200 }))
    .mockRejectedValueOnce(new TypeError('Offline'))
  const app = () => <MemoryRouter initialEntries={['/customers']}><AuthProvider><App /></AuthProvider></MemoryRouter>
  const first = render(app())
  fireEvent.change(await screen.findByLabelText('Username atau email'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Kata sandi'), { target: { value: 'password123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Masuk ke ruang kerja' }))
  await screen.findByRole('heading', { name: 'Customers' })
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  first.unmount()
  render(app())
  await screen.findByRole('heading', { name: 'Selamat datang kembali' })
  expect(screen.queryByRole('heading', { name: 'Customers' })).toBeNull()
})
