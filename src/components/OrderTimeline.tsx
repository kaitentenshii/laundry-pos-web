import { dateTime, statusLabels } from '../services/orders'
import type { OrderStatusHistory } from '../services/orders'
export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  if (!history.length) return <p className="field-hint">Belum ada riwayat status tercatat.</p>
  return <ol className="order-timeline" aria-label="Histori status pesanan">{history.map((event, index) => <li key={event.id}><div><strong>{statusLabels[event.to_status]}{index === 0 && <span className="history-latest">Terbaru</span>}</strong>{event.from_status && <p className="field-hint">{statusLabels[event.from_status]} → {statusLabels[event.to_status]}</p>}<time dateTime={event.changed_at}>{dateTime(event.changed_at)}</time></div><span className="field-hint">{event.actor_name}</span></li>)}</ol>
}
