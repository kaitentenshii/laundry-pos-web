import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './AuthProvider'
import { RequireAuth } from './RequireAuth'
import { RequireRole } from './RequireRole'
import { AppLayout } from '../layouts/WorkspaceLayout'
import { parseLoginResponse, saveSession } from './session'

beforeEach(() => sessionStorage.clear())
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function openAdminRoute(role: 'admin' | 'cashier') {
  const user = { id: 1, name: 'User Laundry', username: 'user', email: 'user@test.example', role }
  saveSession(parseLoginResponse({ access_token: 'role-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ user }), { status: 200 })))
  render(<MemoryRouter initialEntries={['/users']}><AuthProvider><Routes><Route element={<RequireAuth />}><Route element={<AppLayout />}><Route element={<RequireRole roles={['admin']} />}><Route path="users" element={<h1>Administrasi pengguna</h1>} /></Route></Route></Route></Routes></AuthProvider></MemoryRouter>)
}

it('denies cashier access through a direct admin URL and hides admin menus', async () => {
  openAdminRoute('cashier')
  await screen.findByRole('heading', { name: 'Akses dibatasi' })
  expect(screen.queryByRole('link', { name: 'Pengguna' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Layanan' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Pengaturan' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Laporan' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Pelanggan' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Notifikasi WA' })).toBeTruthy()
})

it('allows admin routes and shows admin menus', async () => {
  openAdminRoute('admin')
  await screen.findByRole('heading', { name: 'Administrasi pengguna' })
  expect(screen.getByRole('link', { name: 'Pengguna' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Layanan' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Laporan' })).toBeTruthy()
})
