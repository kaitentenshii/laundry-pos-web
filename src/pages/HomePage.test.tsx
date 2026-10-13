import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { HomePage } from './HomePage'
const resource = vi.hoisted(() => ({ data: undefined as unknown, loading: false, error: '', reload: vi.fn() }))
vi.mock('../hooks/useResource', () => ({ useResource: () => resource }))
afterEach(() => { cleanup(); resource.data = undefined; resource.loading = false; resource.error = ''; resource.reload.mockClear() })
it('renders real metrics, zero receipts and the empty monitoring state', () => {
 resource.data = { active: 0, washing: 0, waiting: 0, ready: 0, overdue: 0, receipts: 0, payment_count: 0, monitored: [] }
 render(<MemoryRouter><HomePage /></MemoryRouter>)
 expect(screen.getByText('0 pembayaran tercatat')).toBeTruthy()
 expect(screen.getByText('Semua pesanan sudah tertangani')).toBeTruthy()
 expect(screen.getByRole('link', { name: '+ Pesanan baru' }).getAttribute('href')).toBe('/orders/new')
})
it('lets users retry a failed dashboard request', () => {
 resource.error = 'Koneksi gagal.'
 render(<MemoryRouter><HomePage /></MemoryRouter>)
 fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
 expect(resource.reload).toHaveBeenCalledOnce()
})
