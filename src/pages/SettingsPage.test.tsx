import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { SettingsPage } from './SettingsPage'
const request = vi.hoisted(() => vi.fn(async () => new Response(JSON.stringify({ data: { name: 'Laundry Baru', contact: '+6281234567890', operating_hours: '08.00–20.00', address: 'Jl. Melati', updated_at: 'updated' } }))))
vi.mock('../auth/context', () => ({ useAuth: () => ({ authorizedRequest: request }) }))
vi.mock('../hooks/useResource', () => ({ useResource: () => ({ data: { name: 'Laundry Mitra', contact: '+6281234567890', operating_hours: '08.00–20.00', address: 'Jl. Melati', updated_at: 'original' }, loading: false, error: '', reload: vi.fn() }) }))
afterEach(() => { cleanup(); request.mockClear() })
it('saves the edited profile and renders success without clearing other fields', async () => {
 render(<MemoryRouter><SettingsPage /></MemoryRouter>)
 fireEvent.change(screen.getByLabelText('Nama usaha *'), { target: { value: ' Laundry Baru ' } })
 fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
 await screen.findByText('Profil laundry berhasil disimpan.')
 const [, options] = request.mock.calls[0] as unknown as [string, RequestInit]
 expect(JSON.parse(options.body as string)).toEqual({ name: 'Laundry Baru', contact: '+6281234567890', operating_hours: '08.00–20.00', address: 'Jl. Melati' })
 expect((screen.getByLabelText('Nama usaha *') as HTMLInputElement).value).toBe('Laundry Baru')
})
it('does not save a missing required profile field', async () => {
 render(<MemoryRouter><SettingsPage /></MemoryRouter>)
 fireEvent.change(screen.getByLabelText('Alamat usaha *'), { target: { value: ' ' } })
 fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
 await waitFor(() => expect(screen.getByText('Wajib diisi.')).toBeTruthy())
 expect(request).not.toHaveBeenCalled()
})
