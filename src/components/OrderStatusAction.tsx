import { useState } from 'react'
import { useAuth } from '../auth/context'
import { statusLabels, canTransition } from '../services/orders'
import type { Order } from '../services/orders'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Icon } from './Icon'
export function OrderStatusAction({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { authorizedRequest } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [key, setKey] = useState(() => crypto.randomUUID())
  const next = order.status === 'RECEIVED' ? 'WASHING' : order.status === 'WASHING' ? 'COMPLETED' : null
  if (!next || !canTransition(order, next)) return null
  const washing = next === 'WASHING'
  const labels = Object.keys(statusLabels)
  async function confirm() {
    if (busy) return
    setBusy(true); setError('')
    try { await authorizedRequest(`/orders/${order.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_status: order.status, status: next, request_key: key }) }); setOpen(false); onChanged() }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Status belum dapat diperbarui.') } finally { setBusy(false) }
  }
  return <><Button onClick={() => { setOpen(true); setError(''); setKey(crypto.randomUUID()) }}>{washing ? 'Mulai dicuci' : 'Tandai selesai'}</Button>{open && <Modal title={washing ? 'Mulai proses pencucian?' : 'Tandai pesanan selesai?'} description={`${order.order_number} · ${order.customer_name}`} onClose={() => setOpen(false)} busy={busy}><div className="workspace-form"><ol className="order-progress">{labels.map((status, index) => <li key={status} className={index <= labels.indexOf(next) ? 'reached' : ''}>{statusLabels[status]}</li>)}</ol><p>{washing ? `${order.order_number} akan dicatat mulai dicuci.` : 'Pastikan seluruh cucian sudah diperiksa dan siap diambil pelanggan.'}</p><div className="workspace-notice"><Icon name="check" /><p>Perubahan status dan pencatat akan disimpan dalam riwayat.</p></div>{error && <><p role="alert" className="form-error">{error}</p><Button className="button-secondary" disabled={busy} onClick={() => { setOpen(false); onChanged() }}>Muat ulang pesanan</Button></>}<div className="dialog-actions"><Button className="button-secondary" disabled={busy} onClick={() => setOpen(false)}>Batal</Button><Button disabled={busy} onClick={() => void confirm()}>{busy ? 'Menyimpan…' : washing ? 'Ya, mulai dicuci' : 'Ya, tandai selesai'}</Button></div></div></Modal>}</>
}
