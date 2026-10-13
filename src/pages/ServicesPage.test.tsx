import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'
import { parseLoginResponse, saveSession } from '../auth/session'
const user = { id: 1, name: 'Admin', username: 'admin', email: '', role: 'admin' }
let records: Record<string, unknown>[]
beforeEach(() => {
  sessionStorage.clear(); records = []
  saveSession(parseLoginResponse({ access_token: 'service-token', token_type: 'Bearer', expires_in: 3600, user }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }))
    if (url.endsWith('/prices')) return new Response(JSON.stringify({ data: [{ id: 1, name: 'Cuci', unit: 'KG', price: 8000, estimated_hours: 48, created_at: '2026-10-13T00:00:00Z' }] }))
    if (options.method) { const body = JSON.parse(options.body as string); if (options.method === 'POST') records.push({ id: 1, ...body }); else records[0] = { id: 1, ...body }; return new Response(JSON.stringify({ data: records[0] })) }
    return new Response(JSON.stringify({ data: records }))
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function open() { render(<MemoryRouter initialEntries={['/services']}><AuthProvider><App /></AuthProvider></MemoryRouter>) }
it('creates an ITEM service using the pcs label and formats estimates', async () => {
  open(); await screen.findByText('Belum ada layanan'); fireEvent.click(screen.getByRole('button', { name: '+ Tambah layanan' }))
  fireEvent.change(screen.getByLabelText('Nama layanan *'), { target: { value: 'Selimut' } })
  fireEvent.change(screen.getByLabelText('Satuan *'), { target: { value: 'ITEM' } })
  fireEvent.change(screen.getByLabelText('Harga per satuan (Rp) *'), { target: { value: '25000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan layanan' }))
  await screen.findByText('Layanan berhasil ditambahkan.'); expect(records[0]).toMatchObject({ unit: 'ITEM', price: 25000, estimated_hours: 48, is_active: true })
  await screen.findByText('pcs'); await screen.findByText('2 hari')
})
it('rejects negative pricing and edits the existing service', async () => {
  records = [{ id: 1, name: 'Cuci', unit: 'KG', price: 8000, estimated_hours: 48, is_active: true }]
  open(); fireEvent.click(await screen.findByRole('button', { name: 'Edit layanan Cuci' }))
  fireEvent.change(screen.getByLabelText('Harga per satuan (Rp) *'), { target: { value: '-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan layanan' })); expect(screen.getByText('Harga wajib berupa rupiah bulat antara 0 dan 999.999.999.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Harga per satuan (Rp) *'), { target: { value: '9000' } })
  fireEvent.change(screen.getByLabelText('Estimasi pengerjaan (jam) *'), { target: { value: '6' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan layanan' })); await screen.findByText('Layanan berhasil diperbarui.'); await screen.findByText('6 jam'); expect(records).toHaveLength(1)
})
it('shows preserved pricing versions from the API', async () => {
  records = [{ id: 1, name: 'Cuci', unit: 'KG', price: 9000, estimated_hours: 48, is_active: true }]
  open(); fireEvent.click(await screen.findByRole('button', { name: 'Riwayat harga Cuci' }))
  await screen.findByText(/8\.000.*kg/)
  expect(screen.getByRole('dialog').textContent).toContain('Versi sebelumnya tetap tersimpan')
  fireEvent.click(screen.getByRole('button', { name: 'Tutup' })); expect(screen.queryByRole('dialog')).toBeNull()
})
