import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ReportsPage } from './ReportsPage'
import { reportPeriod } from '../services/reports'
const paths = vi.hoisted(() => [] as string[])
vi.mock('../hooks/useResource', () => ({ useResource: (path: string) => { paths.push(path); return { data: { orders: [], total: 0, order_value: 0, receipts: 32000, balance: 0, from: '2026-10-01', to: '2026-10-14' }, loading: false, error: '', reload: vi.fn() } } }))
afterEach(() => { cleanup(); paths.length = 0 })
it('uses the Jakarta month and day across UTC midnight', () => { expect(reportPeriod(new Date('2026-10-31T18:00:00Z'))).toEqual({ from: '2026-11-01', to: '2026-11-01' }) })
it('rejects reversed dates without requesting a different report', () => {
 render(<MemoryRouter><ReportsPage /></MemoryRouter>)
 fireEvent.change(screen.getByLabelText('Tanggal mulai'), { target: { value: '2026-10-20' } })
 fireEvent.change(screen.getByLabelText('Tanggal akhir'), { target: { value: '2026-10-04' } })
 const before = paths.at(-1)
 fireEvent.click(screen.getByRole('button', { name: 'Terapkan' }))
 expect(screen.getByRole('alert').textContent).toContain('Tanggal akhir tidak boleh')
 expect(paths.at(-1)).toBe(before)
})
it('applies dates only on submit and keeps receipts visible with no new orders', () => {
 render(<MemoryRouter><ReportsPage /></MemoryRouter>)
 const before = paths.at(-1)
 fireEvent.change(screen.getByLabelText('Tanggal mulai'), { target: { value: '2026-01-01' } })
 fireEvent.change(screen.getByLabelText('Tanggal akhir'), { target: { value: '2026-01-02' } })
 expect(paths.at(-1)).toBe(before)
 fireEvent.click(screen.getByRole('button', { name: 'Terapkan' }))
 expect(paths.at(-1)).toContain('from=2026-01-01&to=2026-01-02')
 expect(screen.getByText('Belum ada transaksi dalam periode ini')).toBeTruthy()
 expect(screen.getByText(/Rp.*32\.000/)).toBeTruthy()
})
