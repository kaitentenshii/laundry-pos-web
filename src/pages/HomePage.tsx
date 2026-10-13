import { Link } from 'react-router'
import { useResource } from '../hooks/useResource'
import { Button } from '../components/ui/Button'
import { money, dateTime, statusLabels } from '../services/orders'
import type { Order } from '../services/orders'
type Dashboard = { as_of: string; active: number; washing: number; waiting: number; ready: number; overdue: number; receipts: number; payment_count: number; monitored: Order[] }
export function HomePage() {
  const { data, loading, error, reload } = useResource<Dashboard>('/dashboard')
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Hari yang rapi dimulai di sini.</h1><p>Ringkasan operasional laundry untuk hari ini.</p></div><Link className="workspace-button" to="/orders/new">+ Pesanan baru</Link></header>
    {loading ? <p role="status" className="collection-loading">Memuat dashboard…</p> : error ? <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : data && <div className="dashboard-content">
      <section className="metric-grid" aria-label="Ringkasan operasional">{[
        ['Pesanan aktif', data.active, `${data.washing} dicuci · ${data.waiting} menunggu`],
        ['Siap diambil', data.ready, 'Selesai dan belum diambil'],
        ['Perlu perhatian', data.overdue, 'Melewati estimasi selesai'],
        ['Penerimaan hari ini', money(data.receipts), `${data.payment_count} pembayaran tercatat`],
      ].map(([label, value, hint]) => <article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><small>{hint}</small></article>)}</section>
      <section className="dashboard-ready"><div><h2>{data.ready} pesanan sudah siap diambil</h2><p>Cek status pembayaran sebelum menyerahkan laundry ke pelanggan.</p></div><Link className="workspace-button button-secondary" to="/orders">Lihat pesanan</Link></section>
      <section aria-labelledby="monitor-heading"><header className="dashboard-section-heading"><h2 id="monitor-heading">Pesanan yang perlu dipantau</h2><Link to="/orders" className="table-action">Semua pesanan</Link></header>
        {!data.monitored.length ? <div className="feedback-panel"><h3>Semua pesanan sudah tertangani</h3><p>Pesanan aktif dan siap diambil akan muncul di sini.</p></div> : <div className="table-wrap"><table className="workspace-table"><thead><tr><th>PESANAN</th><th>PELANGGAN</th><th>LAYANAN</th><th>ESTIMASI</th><th>STATUS</th><th>TAGIHAN</th></tr></thead><tbody>{data.monitored.map(order => <tr key={order.id}>
          <td><Link className="table-action cell-medium" to={`/orders/${order.id}`}>{order.order_number}</Link></td><td>{order.customer_name}</td><td>{order.items.map(item => `${item.service_name} · ${new Intl.NumberFormat('id-ID').format(item.quantity_milli / 1000)} ${item.unit === 'KG' ? 'kg' : 'pcs'}`).join(' + ')}</td><td className={['RECEIVED', 'WASHING'].includes(order.status) && new Date(order.due_at).getTime() < new Date(data.as_of).getTime() ? 'dashboard-overdue' : ''}>{dateTime(order.due_at)}</td><td><span className={`laundry-status status-${order.status.toLowerCase()}`}>● {statusLabels[order.status]}</span></td><td className={order.balance === 0 ? 'text-active' : ''}>{order.balance === 0 ? 'Lunas' : money(order.balance)}</td>
        </tr>)}</tbody></table></div>}
      </section>
      <footer className="dashboard-footer"><div><h3>Setiap perubahan status tercatat.</h3><p>Penerimaan berdasarkan tanggal pembayaran (WIB), setelah dikurangi kembalian.</p></div><Link className="workspace-button button-secondary" to="/notifications">Pantau notifikasi</Link></footer>
    </div>}
  </>
}
