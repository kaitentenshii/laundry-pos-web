import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'
const user = { id: 1, name: 'Kasir', username: 'cashier', email: '', role: 'cashier' }
let posts: Record<string, unknown>[]
let fail: boolean
beforeEach(() => {
  sessionStorage.clear(); posts = []; fail = false
  saveSession(parseLoginResponse({ access_token: 'orders-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (url.includes('/customers?')) return new Response(JSON.stringify({ data: [{ id: 1, name: 'Nadia', whatsapp: '+6281234567890', whatsapp_opt_in: true }] }))
    if (/\/customers\/\d+$/.test(url)) { const id = Number(url.split('/').at(-1)); return new Response(JSON.stringify({ data: { id, name: id === 1000 ? 'Pelanggan lama' : 'Nadia', whatsapp: '+6281234567890', whatsapp_opt_in: true } })) }
    if (url.includes('/services?')) return new Response(JSON.stringify({ data: [{ id: 1, name: 'Cuci', unit: 'KG', price: 8000, is_active: true }, { id: 2, name: 'Selimut', unit: 'ITEM', price: 25000, is_active: true }] }))
    if (options.method === 'POST') { posts.push(JSON.parse(options.body as string)); if (fail) return new Response(JSON.stringify({ error: { code: 'validation_error', message: 'Layanan sudah nonaktif.', fields: { items: 'Muat ulang layanan.' } } }), { status: 400 }); return new Response(JSON.stringify({ data: { id: 1, order_number: 'LD-1', customer_name: 'Nadia', total: 32000 } }), { status: 201 }) }
    throw new Error('unexpected request ' + url)
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function open() {
  render(<MemoryRouter initialEntries={['/orders/new?customer_id=1']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
  await screen.findByLabelText('Pelanggan terpilih')
}
function fill() {
  fireEvent.change(screen.getByLabelText('Layanan *'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Berat (kg) *'), { target: { value: '4' } })
  fireEvent.change(screen.getByLabelText('Tanggal selesai *'), { target: { value: '2099-10-20' } })
}
it('creates an order from registered contact and a valid service', async () => {
  await open(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' }))
  await screen.findByRole('heading', { name: 'Pesanan berhasil disimpan' })
  expect(posts[0]).toMatchObject({ customer_id: 1, items: [{ service_id: 1, quantity: '4' }] })
  expect(posts[0]).not.toHaveProperty('customer_whatsapp'); expect(posts[0].request_key).toBeTruthy()
  expect(screen.getByLabelText('Nomor pesanan').textContent).toBe('LD-1')
})
it('validates pcs quantity and preserves the request key when retrying a failed save', async () => {
  await open(); fill(); fireEvent.change(screen.getByLabelText('Layanan *'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Jumlah (pcs) *'), { target: { value: '1.5' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' })); expect(posts).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('Jumlah (pcs) *'), { target: { value: '1' } }); fail = true
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' })); await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' })); await screen.findByRole('alert')
  expect(posts).toHaveLength(2); expect(posts[0].request_key).toBe(posts[1].request_key)
})
it('adds and removes service lines and submits both unit types', async () => {
  await open(); fill(); fireEvent.click(screen.getByRole('button', { name: '+ Tambah layanan' }))
  fireEvent.change(screen.getByLabelText('Layanan 2 *'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Jumlah (pcs) 2 *'), { target: { value: '2' } })
  expect(screen.getByText(/82\.000/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Hapus layanan 2' }))
  expect(screen.queryByLabelText('Layanan 2 *')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Hapus layanan 1' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '+ Tambah layanan' }))
  fireEvent.change(screen.getByLabelText('Layanan 2 *'), { target: { value: '2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' })); await screen.findByRole('heading', { name: 'Pesanan berhasil disimpan' })
  expect(posts[0].items).toEqual([{ service_id: 1, quantity: '4' }, { service_id: 2, quantity: '1' }])
})
it('loads a preselected customer outside the first customer page', async () => {
  render(<MemoryRouter initialEntries={['/orders/new?customer_id=1000']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
  await screen.findByLabelText('Pelanggan terpilih')
  expect(screen.getByLabelText('Pelanggan terpilih').textContent).toContain('+6281234567890')
  fill(); fireEvent.click(screen.getByRole('button', { name: 'Simpan pesanan' }))
  await screen.findByRole('heading', { name: 'Pesanan berhasil disimpan' }); expect(posts[0].customer_id).toBe(1000)
})
