import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'
const user = { id: 1, name: 'Kasir', username: 'cashier', email: '', role: 'cashier' }
export const sampleOrder = { id: 1, order_number: 'LD-1', customer_name: 'Nadia', customer_whatsapp: '+6281234567890', customer_opt_in: true, due_at: '2026-10-20T16:00:00+07:00', status: 'RECEIVED', payment_status: 'UNPAID', total: 32000, creator_name: 'Kasir', created_at: '2026-10-14T10:00:00+07:00', notes: 'Tanpa pewangi', items: [{ id: 1, service_name: 'Cuci', unit: 'KG', quantity_milli: 4000, unit_price: 8000, subtotal: 32000 }] }
let currentOrder: typeof sampleOrder
let changes: Record<string, unknown>[]
let transitionFailure: 'network' | 'conflict' | undefined
beforeEach(() => {
  currentOrder = { ...sampleOrder }; changes = []
  transitionFailure = undefined
  sessionStorage.clear(); saveSession(parseLoginResponse({ access_token: 'list-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (options.method === 'PATCH') { const body = JSON.parse(options.body as string); changes.push(body); if (transitionFailure === 'network') throw new TypeError('Network offline'); if (transitionFailure === 'conflict') return new Response(JSON.stringify({ error: { code: 'conflict', message: 'Status pesanan sudah berubah.' } }), { status: 409 }); currentOrder.status = body.status; return new Response(JSON.stringify({ data: currentOrder })) }
    if (url.endsWith('/orders/1')) return new Response(JSON.stringify({ data: currentOrder }))
    const params = new URL(url, 'http://localhost').searchParams
    const empty = params.get('status') === 'COMPLETED'
    return new Response(JSON.stringify({ data: empty ? [] : [sampleOrder], total: empty ? 0 : 21, page: Number(params.get('page')), page_size: 20 }))
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function open() { render(<MemoryRouter initialEntries={['/orders']}><AuthProvider><App /></AuthProvider></MemoryRouter>) }
it('lists persisted order data, paginates, and opens order detail', async () => {
  open(); const link = await screen.findByRole('link', { name: 'LD-1' }); expect(link.getAttribute('href')).toBe('/orders/1')
  expect(screen.getByRole('table').textContent).toContain('Cuci · 4 kg')
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByText('21 pesanan · Halaman 2 dari 2')
  fireEvent.click(screen.getByRole('link', { name: 'LD-1' })); await screen.findByRole('heading', { name: 'Pesanan LD-1' })
  expect(screen.getByText('Catatan: Tanpa pewangi')).toBeTruthy()
  expect(screen.getByLabelText('Tahap pencucian').textContent).toContain('Diambil')
})
it('combines date/payment/status filters and resets pagination', async () => {
  open(); await screen.findByRole('table')
  fireEvent.change(screen.getByLabelText('Cari pesanan'), { target: { value: 'Nadia' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cari' }))
  fireEvent.change(screen.getByLabelText('Tanggal masuk'), { target: { value: '2026-10-14' } })
  fireEvent.change(screen.getByLabelText('Pembayaran'), { target: { value: 'PAID' } })
  fireEvent.click(screen.getByRole('button', { name: 'Selesai' }))
  await screen.findByText('Belum ada pesanan yang sesuai')
  const calls = vi.mocked(fetch).mock.calls.map(call => String(call[0]))
  expect(calls.some(url => url.includes('q=Nadia') && url.includes('status=COMPLETED') && url.includes('payment_status=PAID') && url.includes('from=2026-10-14'))).toBe(true)
})
it('does not change status on cancel and advances only after confirmation', async () => {
  render(<MemoryRouter initialEntries={['/orders/1']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Mulai dicuci' }))
  fireEvent.click(screen.getByRole('button', { name: 'Batal' })); expect(changes).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Mulai dicuci' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ya, mulai dicuci' }))
  await screen.findByRole('button', { name: 'Tandai selesai' })
  expect(changes[0]).toMatchObject({ from_status: 'RECEIVED', status: 'WASHING' })
  expect(changes[0].request_key).toBeTruthy()
})
it('retains a transition request key on network retry and requires reload after conflict', async () => {
  render(<MemoryRouter initialEntries={['/orders/1']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Mulai dicuci' })); transitionFailure = 'network'
  fireEvent.click(screen.getByRole('button', { name: 'Ya, mulai dicuci' })); await screen.findByRole('alert')
  transitionFailure = 'conflict'; fireEvent.click(screen.getByRole('button', { name: 'Ya, mulai dicuci' }))
  await screen.findByText('Status pesanan sudah berubah.')
  expect(changes[0].request_key).toBe(changes[1].request_key)
  expect((screen.getByRole('button', { name: 'Ya, mulai dicuci' }) as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Muat ulang pesanan' })).toBeTruthy()
})
