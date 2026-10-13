import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/context'
import { apiRequest } from '../services/api'
import type { Customer } from '../pages/CustomersPage'
import { CustomerPicker } from './CustomerPicker'

const first: Customer = { id: 1, name: 'Nadia Putri', whatsapp: '+6281200001024', whatsapp_opt_in: true, address: '', notes: '', order_count: 0, created_at: '', updated_at: '' }
const second = { ...first, id: 2, name: 'Nadia Rahma', whatsapp: '+6281212345678', whatsapp_opt_in: false }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const fetchMock = vi.fn()
let posts: Record<string, unknown>[]
beforeEach(() => {
  posts = []; fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, options: RequestInit = {}) => {
    if (options.method === 'POST') { const body = JSON.parse(options.body as string); posts.push(body); return json({ data: { ...first, ...body, id: 3 } }, 201) }
    const q = new URL(url).searchParams.get('q')
    return json({ data: q === 'Rina Baru' || q === 'Tidak ada' ? [] : [first, second], total: 2 })
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function Harness() {
  const [selected, setSelected] = useState<Customer | null>(null)
  return <AuthContext.Provider value={{ session: null, checking: false, notice: '', login: async () => {}, logout: async () => {}, refreshUser: async () => {}, authorizedRequest: (path, options) => apiRequest(path, options, 'test-token') }}><CustomerPicker selected={selected} onSelect={setSelected} onClear={() => setSelected(null)} /></AuthContext.Provider>
}
function open() { render(<Harness />); const input = screen.getByRole('combobox'); fireEvent.focus(input); return input }
it('searches directly and selects with the keyboard, then supports changing the customer', async () => {
  const input = open(); fireEvent.change(input, { target: { value: 'Nadia' } })
  await screen.findByRole('option', { name: /Nadia Putri/ })
  expect(fetchMock.mock.calls.some(call => String(call[0]).includes('q=Nadia'))).toBe(true)
  fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' })
  expect(screen.getByLabelText('Pelanggan terpilih').textContent).toContain('Nadia Rahma')
  expect(screen.getByLabelText('Pelanggan terpilih').textContent).toContain('Belum disetujui')
  fireEvent.click(screen.getByRole('button', { name: 'Ganti' }))
  expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true')
})
it('ignores a late response from an older search', async () => {
  let resolveOld!: (value: Response) => void
  fetchMock.mockImplementation(async (url: string) => {
    const q = new URL(url).searchParams.get('q')
    if (q === 'old') return new Promise<Response>(resolve => { resolveOld = resolve })
    return json({ data: q === 'new' ? [{ ...second, name: 'Pelanggan baru' }] : [], total: 1 })
  })
  const input = open(); fireEvent.change(input, { target: { value: 'old' } })
  await waitFor(() => expect(resolveOld).toBeTypeOf('function'))
  fireEvent.change(input, { target: { value: 'new' } }); await screen.findByRole('option', { name: /Pelanggan baru/ })
  await act(async () => resolveOld(json({ data: [{ ...first, name: 'Hasil lama' }], total: 1 })))
  expect(screen.queryByRole('option', { name: /Hasil lama/ })).toBeNull()
})
it('creates and selects a customer inline with default-off consent and normalized country code', async () => {
  const input = open(); fireEvent.change(input, { target: { value: 'Rina Baru' } })
  await screen.findByText('Pelanggan tidak ditemukan.')
  fireEvent.click(screen.getByRole('button', { name: /Tambah pelanggan baru/ }))
  const dialog = screen.getByRole('dialog')
  expect((within(dialog).getByLabelText('Nama pelanggan *') as HTMLInputElement).value).toBe('Rina Baru')
  expect(document.activeElement).toBe(within(dialog).getByLabelText('Nama pelanggan *'))
  expect((within(dialog).getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan & pilih' })); expect(posts).toHaveLength(0)
  fireEvent.change(within(dialog).getByLabelText('Nomor WhatsApp *'), { target: { value: '081234567890' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan & pilih' }))
  await screen.findByLabelText('Pelanggan terpilih')
  expect(posts[0]).toMatchObject({ name: 'Rina Baru', whatsapp: '+6281234567890', whatsapp_opt_in: false })
  expect(screen.getByLabelText('Pelanggan terpilih').textContent).toContain('Rina Baru')
})
it('keeps validation failures in the modal and prevents duplicate submissions while saving', async () => {
  let finish!: (value: Response) => void
  fetchMock.mockImplementation(async (_url: string, options: RequestInit = {}) => {
    if (options.method === 'POST') { posts.push(JSON.parse(options.body as string)); return new Promise<Response>(resolve => { finish = resolve }) }
    return json({ data: [], total: 0 })
  })
  open(); await screen.findByText('Pelanggan tidak ditemukan.'); fireEvent.click(screen.getByRole('button', { name: /Tambah pelanggan baru/ }))
  fireEvent.change(screen.getByLabelText('Nama pelanggan *'), { target: { value: 'Rina' } }); fireEvent.change(screen.getByLabelText('Nomor WhatsApp *'), { target: { value: 'bad-number' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & pilih' })); const button = screen.getByRole('button', { name: 'Menyimpan…' })
  expect((button as HTMLButtonElement).disabled).toBe(true); fireEvent.click(button); expect(posts).toHaveLength(1)
  await act(async () => finish(json({ error: { code: 'validation_error', message: 'Nomor tidak valid.', fields: { whatsapp: 'Nomor tidak valid.' } } }, 400)))
  await screen.findByRole('alert'); expect(screen.getByRole('dialog')).toBeTruthy(); expect(screen.getByLabelText('Nomor WhatsApp *').getAttribute('aria-invalid')).toBe('true')
})
it('cancels inline creation without selecting or submitting a customer', async () => {
  open(); await screen.findByRole('option', { name: /Nadia Putri/ }); fireEvent.click(screen.getByRole('button', { name: /Tambah pelanggan baru/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
  expect(screen.queryByRole('dialog')).toBeNull(); expect(posts).toHaveLength(0); expect(screen.getByRole('combobox')).toBeTruthy()
})
