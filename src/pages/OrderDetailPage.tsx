import { Link, useParams } from 'react-router'
import { useResource } from '../hooks/useResource'
import { money, statusLabels, dateTime } from '../services/orders'
import type { Order } from '../services/orders'
import { Button } from '../components/ui/Button'
import { PaymentReceipt } from '../components/PaymentReceipt'
import { OrderStatusAction } from '../components/OrderStatusAction'
export function OrderDetailPage() {
  const { id } = useParams()
  const { data: order, loading, error, reload } = useResource<Order>(`/orders/${id}`)
  if (loading) return <p role="status">Memuat pesanan…</p>
  if (error || !order) return <section className="feedback-panel feedback-error" role="alert"><p>{error || 'Pesanan tidak ditemukan.'}</p><Button onClick={reload}>Coba lagi</Button><Link to="/orders">Kembali ke pesanan</Link></section>
  const statuses = Object.keys(statusLabels)
  const position = statuses.indexOf(order.status)
  const paid = order.paid_amount ?? (order.payment_status === 'PAID' ? order.total : 0)
  const balance = order.balance ?? order.total - paid
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Pesanan {order.order_number}</h1><p>Diterima {dateTime(order.created_at)} · {order.creator_name}</p></div><Link className="order-secondary-link" to="/orders">Kembali ke pesanan</Link></header>
    <div className="order-detail-badges"><span className={`order-badge status-${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span><span className={`order-badge ${order.payment_status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status === 'PAID' ? 'Lunas' : 'Belum lunas'}</span><span className="order-badge">Estimasi {dateTime(order.due_at)}</span></div>
    <div className="order-grid"><div className="order-stack">
      <section className="order-panel workspace-form"><h2>Status pesanan</h2><ol className="order-progress" aria-label="Tahap pencucian">{statuses.map((status, index) => <li className={index <= position ? 'reached' : ''} key={status} aria-current={status === order.status ? 'step' : undefined}>{statusLabels[status]}</li>)}</ol><p>{order.status === 'RECEIVED' ? 'Cucian diterima dan menunggu proses pencucian.' : order.status === 'WASHING' ? 'Cucian sedang diproses.' : order.status === 'COMPLETED' ? 'Seluruh layanan sudah selesai dikerjakan.' : 'Cucian sudah diserahkan kepada pelanggan.'}</p><OrderStatusAction key={order.status} order={order} onChanged={reload} /></section>
      <section className="order-panel workspace-form"><h2>Rincian pesanan</h2><div className="form-row"><div><h3>{order.customer_name}</h3><p className="text-muted">{order.customer_whatsapp}</p></div><div><p className="field-hint">Estimasi selesai</p><strong>{dateTime(order.due_at)}</strong></div></div><hr />{order.items.map(item => <p key={item.id} className="summary-line"><span>{item.service_name} · {new Intl.NumberFormat('id-ID').format(item.quantity_milli / 1000)} {item.unit === 'KG' ? 'kg' : 'pcs'} × {money(item.unit_price)}</span><strong>{money(item.subtotal)}</strong></p>)}<p className="field-hint detail-notes">Catatan: {order.notes || 'Tidak ada catatan'}</p></section>
      <section className="order-panel workspace-form"><h2>Riwayat status</h2><div className="summary-line"><div><strong>Diterima</strong><p className="field-hint">{dateTime(order.created_at)}</p></div><span className="field-hint">{order.creator_name}</span></div></section>
    </div><aside className="order-stack"><section className="order-panel order-summary"><h2>Pembayaran</h2><p>Sisa tagihan</p><strong className="order-total">{money(balance)}</strong><hr /><p className="summary-line"><span>Total pesanan</span><strong>{money(order.total)}</strong></p><p className="summary-line"><span>Sudah dibayar</span><strong>{money(paid)}</strong></p>{order.payment && <PaymentReceipt payment={order.payment} />}{order.payment_status === 'UNPAID' && <Link className="workspace-button" to={`/orders/${order.id}/payment`}>Catat pembayaran</Link>}</section><section className="order-panel workspace-form"><h2>Notifikasi WhatsApp</h2><span className="order-badge">Belum ada pesan tercatat</span><p className="field-hint">{order.customer_opt_in ? 'Pelanggan menyetujui notifikasi saat pesanan dibuat.' : 'Pelanggan belum menyetujui notifikasi saat pesanan dibuat.'}</p><Link className="order-secondary-link" to={`/notifications?order_id=${order.id}`}>Lihat riwayat pesan</Link></section></aside></div>
  </>
}
