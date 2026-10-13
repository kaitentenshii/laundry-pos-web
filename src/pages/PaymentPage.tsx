import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/context'
import { useResource } from '../hooks/useResource'
import { ApiError } from '../services/api'
import { money, maxOrderTotal, statusLabels } from '../services/orders'
import type { Order, Payment } from '../services/orders'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { Modal } from '../components/ui/Modal'
import { Icon } from '../components/Icon'

const methodLabels = { CASH: 'Tunai', TRANSFER: 'Transfer bank', QRIS: 'QRIS' }
function PaymentForm({ order }: { order: Order }) {
  const { authorizedRequest } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState<Payment['method']>('CASH')
  const [received, setReceived] = useState('')
  const [paidAt, setPaidAt] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 16))
  const [confirmed, setConfirmed] = useState(false)
  const [notes, setNotes] = useState('')
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Payment | null>(null)
  const balance = order.balance ?? order.total
  const amount = /^\d+$/.test(received) ? Number(received) : 0
  const changeAmount = method === 'CASH' ? Math.max(0, amount - balance) : 0
  const changed = () => { setKey(crypto.randomUUID()); setError('') }
  const back = () => navigate(`/orders/${order.id}`)
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    const fields: Record<string, string> = {}
    if (!/^\d+$/.test(received) || !Number.isSafeInteger(amount) || amount < balance || amount > maxOrderTotal) fields.amount_received = 'Nominal harus cukup melunasi sisa tagihan dan berupa rupiah bulat.'
    if (!paidAt) fields.paid_at = 'Isi tanggal pembayaran.'
    if (method !== 'CASH' && !confirmed) fields.confirmed = 'Konfirmasi dana telah diterima.'
    setErrors(fields); setError(''); if (Object.keys(fields).length) return
    setBusy(true)
    try {
      const response = await authorizedRequest(`/orders/${order.id}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, amount_received: amount, paid_at: `${paidAt}:00+07:00`, notes, confirmed, request_key: key }) })
      const body = await response.json() as { data: Payment }; setSaved(body.data)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Pembayaran belum dapat disimpan.'); if (failure instanceof ApiError) setErrors(failure.fields) } finally { setBusy(false) }
  }
  return <>
    <form onSubmit={submit} noValidate className="order-grid payment-grid"><section className="order-panel workspace-form"><h2>Detail pembayaran</h2><fieldset className="payment-methods"><legend>Pilih metode pembayaran</legend>{Object.entries(methodLabels).map(([value, label]) => <Button key={value} type="button" className={method === value ? '' : 'button-secondary'} aria-pressed={method === value} disabled={busy} onClick={() => { setMethod(value as Payment['method']); setConfirmed(false); changed() }}>{label}</Button>)}</fieldset><TextField id="payment-amount" label="Nominal diterima (Rp) *" inputMode="numeric" value={received} onChange={e => { setReceived(e.target.value); changed() }} disabled={busy} error={errors.amount_received} /><p className="field-hint">Harus cukup untuk melunasi sisa tagihan.</p><TextField id="payment-date" label="Tanggal pembayaran *" type="datetime-local" value={paidAt} onChange={e => { setPaidAt(e.target.value); changed() }} disabled={busy} error={errors.paid_at} /><TextField id="payment-notes" label="Catatan (opsional)" value={notes} onChange={e => { setNotes(e.target.value); changed() }} disabled={busy} maxLength={1000} error={errors.notes} />{method !== 'CASH' && <div><label className="payment-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => { setConfirmed(e.target.checked); changed() }} />Saya sudah memastikan dana diterima.</label>{errors.confirmed && <p className="field-error">{errors.confirmed}</p>}</div>}<div className="workspace-notice payment-warning"><Icon name="clock" /><p>Pencatatan pembayaran manual. Pastikan dana sudah diterima sebelum menyimpan.</p></div></section><aside className="order-panel order-summary"><h2>Ringkasan pembayaran</h2><p>Sisa tagihan saat ini</p><strong className="order-total">{money(balance)}</strong><hr /><p className="summary-line"><span>Total pesanan</span><strong>{money(order.total)}</strong></p><p className="summary-line"><span>Sudah dibayar</span><strong>{money(order.paid_amount ?? 0)}</strong></p><p className="summary-line"><span>Uang diterima</span><strong>{money(amount)}</strong></p><div className="payment-change"><p>Kembalian{method !== 'CASH' ? ' (hanya tunai)' : ''}</p><strong>{money(changeAmount)}</strong></div>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan pembayaran'}</Button><Link className="order-secondary-link" to={`/orders/${order.id}`}>Kembali ke pesanan</Link></aside></form>
    {saved && <Modal title="Pembayaran tercatat" description={`Pembayaran ${saved.order_number} berhasil disimpan.`} onClose={back}><div className="order-summary"><span className="order-badge badge-success">Lunas</span><strong className="order-total">{money(saved.amount_settled)}</strong><p>{methodLabels[saved.method]} diterima {money(saved.amount_received)} · Kembalian {money(saved.change_amount)}</p><div className="workspace-notice"><Icon name="check" /><p>Status pembayaran sudah diperbarui. Status cucian tetap {statusLabels[order.status]}.</p></div><Button onClick={back}>Kembali ke detail pesanan</Button></div></Modal>}
  </>
}
export function PaymentPage() {
  const { id } = useParams()
  const { data: order, loading, error, reload } = useResource<Order>(`/orders/${id}`)
  if (loading) return <p role="status">Memuat pembayaran…</p>
  if (error || !order) return <section role="alert" className="feedback-panel feedback-error"><p>{error || 'Pesanan tidak ditemukan.'}</p><Button onClick={reload}>Coba lagi</Button><Link to="/orders">Kembali ke pesanan</Link></section>
  if (order.payment_status === 'PAID') return <section className="feedback-panel"><h1>Pesanan sudah lunas</h1><p>{order.order_number} · {money(order.total)}</p><Link className="workspace-button" to={`/orders/${order.id}`}>Kembali ke detail pesanan</Link></section>
  return <><header className="page-heading"><h1>Catat pembayaran</h1><p>{order.order_number} · {order.customer_name} · {order.items.map(item => item.service_name).join(' + ')}</p></header><PaymentForm key={order.id} order={order} /></>
}
