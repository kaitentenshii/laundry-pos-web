import { useState } from 'react'
import { Link } from 'react-router'
import { useResource } from '../hooks/useResource'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { money, dateTime, statusLabels } from '../services/orders'
import type { Order } from '../services/orders'
import { reportPeriod } from '../services/reports'
type Report = { orders: Order[]; total: number; order_value: number; receipts: number; balance: number; page: number; page_size: number; from: string; to: string }
export function ReportsPage() {
  const [period, setPeriod] = useState(reportPeriod)
  const [draft, setDraft] = useState(period)
  const [page, setPage] = useState(1)
  const [validation, setValidation] = useState('')
  const params = new URLSearchParams({ ...period, page: String(page), page_size: '20' })
  const { data, loading, error, reload } = useResource<Report>(`/reports/transactions?${params}`)
  return <>
    <header className="page-heading"><h1>Laporan transaksi</h1><p>Ringkasan pesanan dan penerimaan pembayaran per periode.</p></header>
    <form className="report-filters" onSubmit={event => { event.preventDefault(); if (!draft.from || !draft.to || draft.to < draft.from) { setValidation('Tanggal akhir tidak boleh sebelum tanggal mulai. Isi kedua tanggal.'); return } setValidation(''); setPeriod(draft); setPage(1); if (draft.from === period.from && draft.to === period.to && page === 1) reload() }}>
      <TextField id="report-from" label="Tanggal mulai" type="date" required value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })} />
      <TextField id="report-to" label="Tanggal akhir" type="date" required value={draft.to} onChange={event => setDraft({ ...draft, to: event.target.value })} />
      <Button type="submit">Terapkan</Button><Button className="button-secondary" onClick={() => { const next = reportPeriod(); setDraft(next); setPeriod(next); setPage(1); setValidation(''); reload() }}>Reset periode</Button>
    </form>
    {validation && <p className="field-error" role="alert">{validation}</p>}
    {loading ? <p className="collection-loading" role="status">Memuat laporan…</p> : error ? <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : data && <div className="dashboard-content">
      <section className="metric-grid" aria-label="Ringkasan transaksi">{[
        ['Jumlah transaksi', data.total, 'Tanggal masuk dalam periode'], ['Nilai pesanan', money(data.order_value), 'Harga saat transaksi'], ['Penerimaan', money(data.receipts), 'Tanggal pembayaran dalam periode'], ['Sisa tagihan', money(data.balance), 'Sisa terkini dari pesanan periode'],
      ].map(([label, value, hint]) => <article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><small>{hint}</small></article>)}</section>
      <p className="report-basis">Periode {data.from} sampai {data.to} (WIB). Nilai pesanan memakai tanggal masuk. Penerimaan memakai tanggal pembayaran, termasuk pembayaran pesanan dari periode lain; kembalian tunai tidak dihitung. Sisa tagihan mengikuti pembayaran terkini.</p>
      {!data.orders.length ? <section className="feedback-panel"><h2>Belum ada transaksi dalam periode ini</h2><p>Ubah periode untuk melihat pesanan lainnya. Penerimaan tetap mengikuti tanggal pembayaran.</p></section> : <div className="table-wrap"><table className="workspace-table"><thead><tr><th>PESANAN</th><th>PELANGGAN</th><th>TANGGAL MASUK</th><th>TOTAL TAGIHAN</th><th>STATUS CUCI</th><th>PEMBAYARAN</th></tr></thead><tbody>{data.orders.map(order => <tr key={order.id}><td><Link className="table-action cell-medium" to={`/orders/${order.id}`}>{order.order_number}</Link></td><td>{order.customer_name}</td><td>{dateTime(order.created_at)}</td><td>{money(order.total)}</td><td><span className={`laundry-status status-${order.status.toLowerCase()}`}>● {statusLabels[order.status]}</span></td><td className={order.payment_status === 'PAID' ? 'text-active' : 'payment-unpaid'}>{order.payment_status === 'PAID' ? 'Lunas' : 'Belum lunas'}</td></tr>)}</tbody></table></div>}
      <nav className="collection-pagination" aria-label="Halaman laporan"><p>{data.total} transaksi · Halaman {page} dari {Math.max(1, Math.ceil(data.total / 20))} · Akses khusus admin</p><Button className="button-secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</Button><Button className="button-secondary" disabled={page * 20 >= data.total} onClick={() => setPage(value => value + 1)}>Berikutnya</Button></nav>
    </div>}
  </>
}
