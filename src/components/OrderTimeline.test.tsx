import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { OrderTimeline } from './OrderTimeline'
afterEach(cleanup)
it('renders persisted status actors and newest-first transition details', () => {
  render(<OrderTimeline history={[{ id: 2, from_status: 'RECEIVED', to_status: 'WASHING', changed_by: 2, actor_name: 'Kasir Dua', changed_at: '2026-10-14T10:30:00+07:00' }, { id: 1, from_status: '', to_status: 'RECEIVED', changed_by: 1, actor_name: 'Admin Satu', changed_at: '2026-10-14T09:30:00+07:00' }]} />)
  const rows = screen.getAllByRole('listitem')
  expect(rows[0].textContent).toContain('DicuciTerbaru'); expect(rows[0].textContent).toContain('Diterima → Dicuci'); expect(rows[0].textContent).toContain('Kasir Dua')
  expect(rows[1].textContent).toContain('Admin Satu'); expect(rows[1].querySelector('time')?.dateTime).toBe('2026-10-14T09:30:00+07:00')
})
