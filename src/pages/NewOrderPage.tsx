import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { useCollection } from '../hooks/useCollection'
import { useResource } from '../hooks/useResource'
import { ApiError } from '../services/api'
import { money, quoteLine, maxOrderTotal } from '../services/orders'
import type { Order } from '../services/orders'
import type { Customer } from './CustomersPage'
import type { LaundryService } from './ServicesPage'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Icon } from '../components/Icon'
import { CustomerPicker } from '../components/CustomerPicker'

export function NewOrderPage() {
  const { authorizedRequest } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = useId()
  const [customerId, setCustomerId] = useState(params.get('customer_id') ?? '')
  const [pickedCustomer, setPickedCustomer] = useState<Customer | null>(null)
  const selectedContact = useResource<Customer>(customerId ? `/customers/${customerId}` : null)
  const services = useCollection<LaundryService>('/services?active=true')
  const [lines, setLines] = useState(() => [{ key: crypto.randomUUID(), serviceId: '', quantity: '1' }])
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('16:00')
  const [notes, setNotes] = useState('')
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<Order | null>(null)
  const customer = selectedContact.data ?? (pickedCustomer?.id === Number(customerId) ? pickedCustomer : undefined)
  const calculations = lines.map(line => {
    const service = services.data.find(s => s.id === Number(line.serviceId))
    const quote = service ? quoteLine(service.price, line.quantity, service.unit) : null
    const normalized = quote?.normalized ?? line.quantity.replace(',', '.')
    const valid = Boolean(quote)
    const subtotal = quote?.subtotal ?? 0
    return { ...line, service, normalized, valid, subtotal }
  })
  const total = calculations.reduce((sum, line) => sum + line.subtotal, 0)
  const change = () => { setRequestKey(crypto.randomUUID()); setError('') }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    const fields: Record<string, string> = {}
    if (!customer) fields.customer_id = 'Pilih pelanggan terdaftar.'
    if (calculations.some(line => !line.valid) || total > maxOrderTotal) fields.items = 'Pilih layanan dan isi berat/jumlah yang valid.'
    if (!dueDate || !dueTime || Number.isNaN(new Date(`${dueDate}T${dueTime}:00+07:00`).getTime())) fields.due_at = 'Isi tanggal dan jam estimasi selesai yang belum lewat.'
    setErrors(fields); setError(''); if (Object.keys(fields).length) return
    setBusy(true)
    try {
      const response = await authorizedRequest('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: Number(customerId), due_at: `${dueDate}T${dueTime}:00+07:00`, notes, expected_total: total, items: calculations.map(line => ({ service_id: Number(line.serviceId), quantity: line.normalized })), request_key: requestKey }) })
      const body = await response.json() as { data: Order }; setCreated(body.data)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Pesanan belum dapat disimpan.'); if (failure instanceof ApiError) { setErrors(failure.fields); if (failure.fields.expected_total) services.reload() } } finally { setBusy(false) }
  }
  if (created) return <section className="feedback-panel"><h1>Pesanan berhasil disimpan</h1><strong className="order-number" aria-label="Nomor pesanan">{created.order_number}</strong><p>{created.customer_name}</p><p>{money(created.total)} · Diterima · Belum lunas</p><Button onClick={() => navigate('/orders')}>Kembali ke pesanan</Button></section>
  return <>
    <header className="page-heading"><h1>Catat pesanan baru</h1><p>Masukkan pelanggan, layanan, dan rincian cucian.</p></header>
    {(services.error || selectedContact.error) && <section className="feedback-panel feedback-error" role="alert"><p>{services.error || selectedContact.error}</p><Button onClick={() => { services.reload(); selectedContact.reload() }}>Coba lagi</Button></section>}
    <form onSubmit={submit} noValidate className="order-grid"><div className="order-stack">
      <section className="order-panel workspace-form"><h2>Pelanggan</h2><CustomerPicker selected={customer ?? null} loadingSelected={selectedContact.loading} disabled={busy} error={errors.customer_id} onSelect={contact => { setPickedCustomer(contact); setCustomerId(String(contact.id)); change() }} onClear={() => { setPickedCustomer(null); setCustomerId(''); change() }} /></section>
      <section className="order-panel workspace-form"><h2>Rincian layanan</h2>{calculations.map((line, index) => <div className="order-line" key={line.key}><div className="order-item-fields"><SelectField id={`${id}-service-${line.key}`} label={index === 0 ? 'Layanan *' : `Layanan ${index + 1} *`} value={line.serviceId} onChange={e => { setLines(value => value.map(item => item.key === line.key ? { ...item, serviceId: e.target.value, quantity: '1' } : item)); change() }} disabled={busy || services.loading}><option value="">{services.loading ? 'Memuat layanan…' : 'Pilih layanan aktif'}</option>{services.data.map(s => <option key={s.id} value={s.id}>{s.name} · {s.unit === 'KG' ? 'kg' : 'pcs'}</option>)}</SelectField><TextField id={`${id}-quantity-${line.key}`} label={`${line.service?.unit === 'ITEM' ? 'Jumlah (pcs)' : 'Berat (kg)'}${index ? ' ' + (index + 1) : ''} *`} inputMode="decimal" value={line.quantity} onChange={e => { setLines(value => value.map(item => item.key === line.key ? { ...item, quantity: e.target.value } : item)); change() }} disabled={busy} /></div><p className="item-subtotal"><span>{money(line.service?.price ?? 0)} / {line.service?.unit === 'ITEM' ? 'pcs' : 'kg'}</span><strong>Subtotal {money(line.subtotal)}</strong></p>{lines.length > 1 && <Button type="button" className="button-secondary" disabled={busy} onClick={() => { setLines(value => value.filter(item => item.key !== line.key)); change() }}>Hapus layanan {index + 1}</Button>}</div>)}{errors.items && <p className="field-error">{errors.items}</p>}<Button type="button" className="button-secondary" disabled={busy || lines.length >= 30} onClick={() => { setLines(value => [...value, { key: crypto.randomUUID(), serviceId: '', quantity: '1' }]); change() }}>+ Tambah layanan</Button></section>
      <section className="order-panel workspace-form"><h2>Estimasi &amp; catatan</h2><div className="form-row"><TextField id={`${id}-date`} label="Tanggal selesai *" type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); change() }} disabled={busy} error={errors.due_at} /><TextField id={`${id}-time`} label="Jam selesai *" type="time" value={dueTime} onChange={e => { setDueTime(e.target.value); change() }} disabled={busy} /></div><TextField id={`${id}-notes`} label="Catatan cucian" value={notes} onChange={e => { setNotes(e.target.value); change() }} maxLength={2000} disabled={busy} error={errors.notes} /></section>
    </div><aside className="order-stack"><section className="order-panel order-summary"><h2>Ringkasan pesanan</h2><span className="order-badge">Pesanan baru</span><h3>{customer?.name || '–'}</h3>{!customer && <p>Pilih pelanggan terlebih dahulu.</p>}{customer && calculations.map(line => <div key={line.key}><p>{line.service?.name || 'Pilih layanan'} · {line.quantity} {line.service?.unit === 'ITEM' ? 'pcs' : 'kg'}</p><p className="summary-line"><span>{line.quantity} × {money(line.service?.price ?? 0)}</span><strong>{money(line.subtotal)}</strong></p></div>)}<hr />{!customer && <><p className="summary-line"><span>Subtotal</span><strong>{money(0)}</strong></p><hr /></>}<p>Total tagihan</p><strong className="order-total">{money(customer ? total : 0)}</strong><span className="order-badge badge-warning">Belum lunas</span>{error && <p role="alert" className="form-error">{error}</p>}<Button type="submit" disabled={busy || !customer || services.loading}>{busy ? 'Menyimpan…' : 'Simpan pesanan'}</Button><Link className="order-secondary-link" to="/orders">Batal</Link></section><div className="workspace-notice"><Icon name="check" /><p>Status awal pesanan: Diterima. Pembayaran dapat dicatat dari detail pesanan.</p></div></aside></form>
  </>
}
