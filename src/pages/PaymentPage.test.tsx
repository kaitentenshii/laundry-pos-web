import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'
const user = { id: 1, name: 'Kasir', username: 'cashier', email: '', role: 'cashier' }
let posted: Record<string, unknown>[]
let paid: boolean
beforeEach(() => {
  posted = []; paid = false; sessionStorage.clear(); saveSession(parseLoginResponse({ access_token: 'payment-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (options.method === 'POST') { const body = JSON.parse(options.body as string); posted.push(body); return new Response(JSON.stringify({ data: { id: 1, order_id: 1, order_number: 'LD-1', method: body.method, amount_received: body.amount_received, amount_settled: 32000, change_amount: body.method === 'CASH' ? Number(body.amount_received) - 32000 : 0 } })) }
    return new Response(JSON.stringify({ data: { id: 1, order_number: 'LD-1', customer_name: 'Nadia', items: [{ service_name: 'Cuci' }], total: 32000, paid_amount: paid ? 32000 : 0, balance: paid ? 0 : 32000, payment_status: paid ? 'PAID' : 'UNPAID', status: 'WASHING' } }))
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function open() { render(<MemoryRouter initialEntries={['/orders/1/payment']}><AuthProvider><App /></AuthProvider></MemoryRouter>) }
it('rejects partial amounts and records cash change without changing laundry status', async () => {
  open(); const amount = await screen.findByLabelText('Nominal diterima (Rp) *')
  fireEvent.change(amount, { target: { value: '31000' } }); fireEvent.click(screen.getByRole('button', { name: 'Simpan pembayaran' })); expect(posted).toHaveLength(0)
  fireEvent.change(amount, { target: { value: '50000' } }); fireEvent.click(screen.getByRole('button', { name: 'Simpan pembayaran' }))
  await screen.findByRole('dialog'); expect(screen.getByRole('dialog').textContent).toContain('18.000'); expect(screen.getByRole('dialog').textContent).toContain('tetap Dicuci')
  expect(posted[0]).toMatchObject({ method: 'CASH', amount_received: 50000 }); expect(posted[0].request_key).toBeTruthy()
})
it('requires confirmation for transfer and records no cash change', async () => {
  open(); await screen.findByLabelText('Nominal diterima (Rp) *'); fireEvent.click(screen.getByRole('button', { name: 'Transfer bank' }))
  fireEvent.change(screen.getByLabelText('Nominal diterima (Rp) *'), { target: { value: '32000' } }); fireEvent.click(screen.getByRole('button', { name: 'Simpan pembayaran' }))
  expect(screen.getByText('Konfirmasi dana telah diterima.')).toBeTruthy(); expect(posted).toHaveLength(0)
  fireEvent.click(screen.getByLabelText('Saya sudah memastikan dana diterima.')); fireEvent.click(screen.getByRole('button', { name: 'Simpan pembayaran' }))
  await screen.findByRole('dialog'); expect(posted[0]).toMatchObject({ method: 'TRANSFER', confirmed: true })
})
it('prevents a second payment on a paid order', async () => {
  paid = true; open(); await screen.findByRole('heading', { name: 'Pesanan sudah lunas' }); expect(screen.queryByRole('button', { name: 'Simpan pembayaran' })).toBeNull()
})
