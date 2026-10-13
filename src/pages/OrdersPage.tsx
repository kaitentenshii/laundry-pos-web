import { useState } from 'react'
import { Link } from 'react-router'
import { useCollection } from '../hooks/useCollection'
import { statusLabels, dateTime } from '../services/orders'
import type { Order } from '../services/orders'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
export function OrdersPage() {
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams({ status, payment_status: payment, page: String(page), page_size: '20' })
  if (date) { params.set('from', date); params.set('to', date) }
  const { data, total, loading, error, reload } = useCollection<Order>(`/orders?${params}`)
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Pesanan laundry</h1><p>Pantau setiap cucian, dari diterima hingga diambil.</p></div><Link className="workspace-button" to="/orders/new">+ Pesanan baru</Link></header>
    <div className="order-tabs" role="group" aria-label="Filter status cucian">{[['', 'Semua'], ...Object.entries(statusLabels)].map(([value, label]) => <Button key={value} className={status === value ? '' : 'button-secondary'} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1) }}>{label}</Button>)}</div>
    <div className="order-filters"><TextField id="orders-date" label="Tanggal masuk" type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1) }} /><SelectField id="orders-payment" label="Pembayaran" value={payment} onChange={e => { setPayment(e.target.value); setPage(1) }}><option value="">Semua pembayaran</option><option value="UNPAID">Belum lunas</option><option value="PAID">Lunas</option></SelectField><Button className="button-secondary" onClick={() => { setDate(''); setPayment(''); setStatus(''); setPage(1) }}>Reset filter</Button></div>
    {loading ? <p className="collection-loading" role="status">Memuat pesanan…</p> : error ? <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : !data.length ? <section className="feedback-panel"><h2>Belum ada pesanan yang sesuai</h2><p>Ubah filter atau catat pesanan baru.</p></section> : <div className="table-wrap"><table className="workspace-table"><colgroup><col style={{ width: '13.39%' }} /><col style={{ width: '18.75%' }} /><col style={{ width: '21.43%' }} /><col style={{ width: '16.07%' }} /><col style={{ width: '16.07%' }} /><col style={{ width: '14.29%' }} /></colgroup><thead><tr><th>PESANAN</th><th>PELANGGAN</th><th>LAYANAN</th><th>ESTIMASI</th><th>STATUS CUCI</th><th>PEMBAYARAN</th></tr></thead><tbody>{data.map(order => <tr key={order.id}><td><Link className="table-action cell-medium" to={`/orders/${order.id}`}>{order.order_number}</Link></td><td>{order.customer_name}</td><td>{order.items.map(item => `${item.service_name} · ${new Intl.NumberFormat('id-ID').format(item.quantity_milli / 1000)} ${item.unit === 'KG' ? 'kg' : 'pcs'}`).join(' + ')}</td><td>{dateTime(order.due_at)}</td><td><span className={`laundry-status status-${order.status.toLowerCase()}`}>● {statusLabels[order.status]}</span></td><td className={order.payment_status === 'PAID' ? 'text-active' : 'payment-unpaid'}>{order.payment_status === 'PAID' ? 'Lunas' : 'Belum lunas'}</td></tr>)}</tbody></table></div>}
    {!loading && !error && <nav className="collection-pagination" aria-label="Halaman pesanan"><p>{total} pesanan · Halaman {page} dari {Math.max(1, Math.ceil(total / 20))}</p><Button className="button-secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</Button><Button className="button-secondary" disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>Berikutnya</Button></nav>}
  </>
}
