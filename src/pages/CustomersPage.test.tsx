import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'

const user = { id: 2, name: 'Kasir', username: 'cashier', email: '', role: 'cashier' }
let posted: Record<string, unknown>[]
beforeEach(() => {
  sessionStorage.clear(); posted = []
  saveSession(parseLoginResponse({ access_token: 'customer-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (options.method === 'POST') {
      const body = JSON.parse(options.body as string); posted.push(body)
      if (body.whatsapp === 'invalid') return new Response(JSON.stringify({ error: { code: 'validation_error', message: 'Nomor tidak valid.', fields: { whatsapp: 'Nomor tidak valid.' } } }), { status: 400 })
      return new Response(JSON.stringify({ data: { id: 1, ...body } }), { status: 201 })
    }
    return new Response(JSON.stringify({ data: posted.map((body, index) => ({ id: index + 1, ...body })) }))
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function open() { render(<MemoryRouter initialEntries={['/customers']}><AuthProvider><App /></AuthProvider></MemoryRouter>); await screen.findByText('Belum ada pelanggan'); fireEvent.click(screen.getByRole('button', { name: '+ Pelanggan baru' })) }
it('creates a customer as cashier with consent disabled by default', async () => {
  await open()
  expect((screen.getByLabelText('Persetujuan notifikasi WhatsApp') as HTMLSelectElement).value).toBe('false')
  fireEvent.change(screen.getByLabelText('Nama pelanggan *'), { target: { value: 'Sari' } })
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp *'), { target: { value: '081234567890' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pelanggan' }))
  await screen.findByText('Pelanggan berhasil ditambahkan.')
  expect(posted[0]).toMatchObject({ name: 'Sari', whatsapp_opt_in: false })
  expect((await screen.findByRole('table')).textContent).toContain('Sari')
})
it('keeps the editor open for missing fields and server phone validation', async () => {
  await open(); fireEvent.click(screen.getByRole('button', { name: 'Simpan pelanggan' }))
  expect(screen.getByText('Nama pelanggan wajib diisi.')).toBeTruthy(); expect(posted).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('Nama pelanggan *'), { target: { value: 'Sari' } })
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp *'), { target: { value: 'invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pelanggan' }))
  await screen.findByRole('alert'); expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByLabelText('Nomor WhatsApp *').getAttribute('aria-invalid')).toBe('true')
})
