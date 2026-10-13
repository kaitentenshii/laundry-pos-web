import { Link, useParams } from 'react-router'
import { useResource } from '../hooks/useResource'
import { money, statusLabels } from '../services/orders'
import type { Order } from '../services/orders'
import { Button } from '../components/ui/Button'
export function OrderDetailPage() {
  const { id } = useParams()
  const { data: order, loading, error, reload } = useResource<Order>(`/orders/${id}`)
  if (loading) return <p role="status">Memuat pesanan…</p>
  if (error || !order) return <section className="feedback-panel feedback-error" role="alert"><p>{error || 'Pesanan tidak ditemukan.'}</p><Button onClick={reload}>Coba lagi</Button><Link to="/orders">Kembali ke pesanan</Link></section>
  return <><header className="page-heading"><h1>{order.order_number}</h1><p>{order.customer_name}</p></header><section className="order-panel"><p>{statusLabels[order.status]} · {order.payment_status === 'PAID' ? 'Lunas' : 'Belum lunas'}</p><strong className="order-total">{money(order.total)}</strong></section><Link to="/orders">Kembali ke pesanan</Link></>
}
