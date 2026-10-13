import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/context'
import { useCollection } from '../hooks/useCollection'
import { ApiError } from '../services/api'
import { money } from '../services/orders'
import type { Order } from '../services/orders'
import type { Customer } from './CustomersPage'
import type { LaundryService } from './ServicesPage'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Icon } from '../components/Icon'

export function NewOrderPage() {
  const { authorizedRequest } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = useId()
  const [customerId, setCustomerId] = useState(params.get('customer_id') ?? '')
  const [search, setSearch] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const customers = useCollection<Customer>(`/customers?q=${encodeURIComponent(customerQuery)}&page_size=100`)
  const services = useCollection<LaundryService>('/services?active=true')
  const [serviceId, setServiceId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('16:00')
  const [notes, setNotes] = useState('')
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<Order | null>(null)
  const customer = customers.data.find(c => c.id === Number(customerId))
  const service = services.data.find(s => s.id === Number(serviceId))
  const normalized = quantity.replace(',', '.')
  const numeric = Number(normalized)
  const subtotal = service && /^\d+(\.\d{1,3})?$/.test(normalized) && numeric > 0 ? Math.floor((service.price * Math.round(numeric * 1000) + 500) / 1000) : 0
  const change = () => { setRequestKey(crypto.randomUUID()); setError('') }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    const fields: Record<string, string> = {}
    if (!customer) fields.customer_id = 'Pilih pelanggan terdaftar.'
    if (!service || !/^\d+(\.\d{1,3})?$/.test(normalized) || numeric <= 0 || service.unit === 'ITEM' && !Number.isInteger(numeric)) fields.items = 'Pilih layanan dan isi berat/jumlah yang valid.'
    if (!dueDate || !dueTime || new Date(`${dueDate}T${dueTime}:00+07:00`).getTime() < Date.now()) fields.due_at = 'Isi tanggal dan jam estimasi selesai yang belum lewat.'
    setErrors(fields); setError(''); if (Object.keys(fields).length) return
    setBusy(true)
    try {
      const response = await authorizedRequest('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: Number(customerId), due_at: `${dueDate}T${dueTime}:00+07:00`, notes, items: [{ service_id: Number(serviceId), quantity: normalized }], request_key: requestKey }) })
      const body = await response.json() as { data: Order }; setCreated(body.data)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Pesanan belum dapat disimpan.'); if (failure instanceof ApiError) setErrors(failure.fields) } finally { setBusy(false) }
  }
  if (created) return <section className="feedback-panel"><h1>Pesanan berhasil disimpan</h1><p>{created.order_number} · {created.customer_name}</p><p>{money(created.total)} · Diterima · Belum lunas</p><Button onClick={() => navigate('/orders')}>Kembali ke pesanan</Button></section>
  return <>
    <header className="page-heading"><h1>Catat pesanan baru</h1><p>Masukkan pelanggan, layanan, dan rincian cucian.</p></header>
    {(customers.error || services.error) && <section className="feedback-panel feedback-error" role="alert"><p>{customers.error || services.error}</p><Button onClick={() => { customers.reload(); services.reload() }}>Coba lagi</Button></section>}
    <form onSubmit={submit} noValidate className="order-grid"><div className="order-stack">
      <section className="order-panel workspace-form"><h2>Pelanggan</h2><div className="customer-search"><TextField id={`${id}-search`} label="Cari pelanggan" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama atau nomor WhatsApp" /><Button type="button" className="button-secondary" onClick={() => { setCustomerQuery(search); setCustomerId(''); change() }}>Cari</Button></div><div className="form-row"><SelectField id={`${id}-customer`} label="Nama pelanggan *" value={customerId} onChange={e => { setCustomerId(e.target.value); change() }} disabled={busy || customers.loading} error={errors.customer_id}><option value="">{customers.loading ? 'Memuat pelanggan…' : 'Pilih pelanggan'}</option>{customers.data.map(c => <option value={c.id} key={c.id}>{c.name} · {c.whatsapp}</option>)}</SelectField><TextField id={`${id}-phone`} label="Nomor WhatsApp" value={customer?.whatsapp ?? ''} readOnly /></div><p className="field-hint">{customer ? customer.whatsapp_opt_in ? 'Pelanggan menyetujui notifikasi status pesanan.' : 'Pelanggan belum menyetujui notifikasi.' : 'Kontak diambil dari data pelanggan terdaftar.'}</p></section>
      <section className="order-panel workspace-form"><h2>Rincian layanan</h2><div className="order-item-fields"><SelectField id={`${id}-service`} label="Layanan *" value={serviceId} onChange={e => { setServiceId(e.target.value); setQuantity('1'); change() }} disabled={busy || services.loading}><option value="">{services.loading ? 'Memuat layanan…' : 'Pilih layanan aktif'}</option>{services.data.map(s => <option key={s.id} value={s.id}>{s.name} · {s.unit === 'KG' ? 'kg' : 'pcs'}</option>)}</SelectField><TextField id={`${id}-quantity`} label={service?.unit === 'ITEM' ? 'Jumlah (pcs) *' : 'Berat (kg) *'} inputMode="decimal" value={quantity} onChange={e => { setQuantity(e.target.value); change() }} disabled={busy} /></div>{errors.items && <p className="field-error">{errors.items}</p>}<p className="item-subtotal"><span>{money(service?.price ?? 0)} / {service?.unit === 'ITEM' ? 'pcs' : 'kg'}</span><strong>Subtotal {money(subtotal)}</strong></p></section>
      <section className="order-panel workspace-form"><h2>Estimasi &amp; catatan</h2><div className="form-row"><TextField id={`${id}-date`} label="Tanggal selesai *" type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); change() }} disabled={busy} error={errors.due_at} /><TextField id={`${id}-time`} label="Jam selesai *" type="time" value={dueTime} onChange={e => { setDueTime(e.target.value); change() }} disabled={busy} /></div><TextField id={`${id}-notes`} label="Catatan cucian" value={notes} onChange={e => { setNotes(e.target.value); change() }} maxLength={2000} disabled={busy} error={errors.notes} /></section>
    </div><aside className="order-stack"><section className="order-panel order-summary"><h2>Ringkasan pesanan</h2><span className="order-badge">Pesanan baru</span><h3>{customer?.name || 'Pilih pelanggan'}</h3><p>{service?.name || 'Pilih layanan'} · {quantity} {service?.unit === 'ITEM' ? 'pcs' : 'kg'}</p><hr /><p className="summary-line"><span>{quantity} × {money(service?.price ?? 0)}</span><strong>{money(subtotal)}</strong></p><hr /><p>Total tagihan</p><strong className="order-total">{money(subtotal)}</strong><span className="order-badge badge-warning">Belum lunas</span>{error && <p role="alert" className="form-error">{error}</p>}<Button type="submit" disabled={busy || customers.loading || services.loading}>{busy ? 'Menyimpan…' : 'Simpan pesanan'}</Button><Link className="order-secondary-link" to="/orders">Batal</Link></section><div className="workspace-notice"><Icon name="check" /><p>Status awal pesanan: Diterima. Pembayaran dapat dicatat dari detail pesanan.</p></div></aside></form>
  </>
}
