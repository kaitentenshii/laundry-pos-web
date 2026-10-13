import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { useCollection } from '../hooks/useCollection'
import { ApiError } from '../services/api'
import { Icon } from '../components/Icon'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Modal } from '../components/ui/Modal'

export type LaundryService = { id: number; name: string; unit: 'KG' | 'ITEM'; price: number; estimated_hours: number; is_active: boolean }
const rupiah = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
const duration = (hours: number) => hours % 24 === 0 ? `${hours / 24} hari` : `${hours} jam`

type PriceVersion = { id: number; name: string; unit: 'KG' | 'ITEM'; price: number; estimated_hours: number; created_at: string }
function PriceHistory({ service, onClose }: { service: LaundryService; onClose: () => void }) {
  const { data, loading, error, reload } = useCollection<PriceVersion>(`/services/${service.id}/prices`)
  return <Modal title="Riwayat harga layanan" description={service.name} onClose={onClose}>
    {loading ? <p role="status">Memuat riwayat harga…</p> : error ? <div role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></div> : <ol className="price-history">{data.map(version => <li key={version.id}><strong>{rupiah(version.price)} / {version.unit === 'KG' ? 'kg' : 'pcs'}</strong><span>{version.name} · {duration(version.estimated_hours)}</span><time dateTime={version.created_at}>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(version.created_at))}</time></li>)}</ol>}
    <p className="field-hint">Versi sebelumnya tetap tersimpan setelah harga layanan diperbarui.</p><Button className="button-secondary" onClick={onClose}>Tutup</Button>
  </Modal>
}

function ServiceEditor({ service, onClose, onSaved }: { service: LaundryService | null; onClose: () => void; onSaved: () => void }) {
  const { authorizedRequest } = useAuth()
  const id = useId()
  const [name, setName] = useState(service?.name ?? '')
  const [unit, setUnit] = useState(service?.unit ?? 'KG')
  const [price, setPrice] = useState(String(service?.price ?? 0))
  const [hours, setHours] = useState(String(service?.estimated_hours ?? 48))
  const [active, setActive] = useState(service?.is_active ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    const fields: Record<string, string> = {}
    if (!name.trim()) fields.name = 'Nama layanan wajib diisi.'
    if (!/^\d+$/.test(price) || Number(price) > 999999999) fields.price = 'Harga wajib berupa rupiah bulat antara 0 dan 999.999.999.'
    if (!/^\d+$/.test(hours) || Number(hours) < 1 || Number(hours) > 8760) fields.estimated_hours = 'Estimasi wajib antara 1 dan 8760 jam.'
    setErrors(fields); setError('')
    if (Object.keys(fields).length) { document.getElementById(`${id}-${Object.keys(fields)[0]}`)?.focus(); return }
    setBusy(true)
    try {
      await authorizedRequest(service ? `/services/${service.id}` : '/services', { method: service ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), unit, price: Number(price), estimated_hours: Number(hours), is_active: active }) })
      onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Layanan belum dapat disimpan.'); if (failure instanceof ApiError) setErrors(failure.fields) } finally { setBusy(false) }
  }
  return <Modal title={service ? 'Edit layanan laundry' : 'Tambah layanan laundry'} description="Harga dan satuan menentukan perhitungan pesanan baru." onClose={onClose} busy={busy}><form className="workspace-form" onSubmit={submit} noValidate>
    <TextField id={`${id}-name`} label="Nama layanan *" value={name} onChange={e => setName(e.target.value)} disabled={busy} error={errors.name} maxLength={120} required placeholder="Nama layanan" />
    <div className="form-row"><SelectField id={`${id}-unit`} label="Satuan *" value={unit} onChange={e => setUnit(e.target.value as LaundryService['unit'])} disabled={busy} error={errors.unit}><option value="KG">kg</option><option value="ITEM">pcs</option></SelectField><TextField id={`${id}-price`} label="Harga per satuan (Rp) *" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} disabled={busy} error={errors.price} required /></div>
    <TextField id={`${id}-estimated_hours`} label="Estimasi pengerjaan (jam) *" inputMode="numeric" value={hours} onChange={e => setHours(e.target.value)} disabled={busy} error={errors.estimated_hours} required />
    <p className="field-hint">24 jam = 1 hari. Gunakan jam untuk layanan ekspres.</p>
    <SelectField id={`${id}-active`} label="Status layanan" value={String(active)} onChange={e => setActive(e.target.value === 'true')} disabled={busy} error={errors.is_active}><option value="true">Aktif</option><option value="false">Nonaktif</option></SelectField>
    <div className="workspace-notice"><Icon name="check" /><p>Perubahan harga disimpan sebagai versi baru. Riwayat harga sebelumnya tetap tersedia.</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions"><Button type="button" className="button-secondary" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan layanan'}</Button></div>
  </form></Modal>
}

export function ServicesPage() {
  const { data, loading, error, reload } = useCollection<LaundryService>('/services')
  const [editing, setEditing] = useState<LaundryService | null | undefined>(undefined)
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState<LaundryService | null>(null)
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Layanan &amp; harga</h1><p>Atur layanan yang tersedia di kasir.</p></div><Button onClick={() => setEditing(null)}>+ Tambah layanan</Button></header>
    {notice && <div className="workspace-notice" role="status"><Icon name="check" /><p>{notice}</p></div>}
    <div className="workspace-notice"><Icon name="check" /><p>Perubahan harga berlaku untuk pesanan baru. Riwayat harga sebelumnya tetap tersimpan.</p></div>
    {loading ? <p role="status" className="collection-loading">Memuat layanan…</p> : error ? <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : !data.length ? <section className="feedback-panel"><h2>Belum ada layanan</h2><p>Tambahkan layanan laundry pertama Anda.</p></section> : <div className="table-wrap"><table className="workspace-table services-table"><colgroup><col style={{ width: '27.68%' }} /><col style={{ width: '11.61%' }} /><col style={{ width: '17.86%' }} /><col style={{ width: '17.86%' }} /><col style={{ width: '12.5%' }} /><col style={{ width: '12.5%' }} /></colgroup><thead><tr><th>LAYANAN</th><th>SATUAN</th><th>HARGA</th><th>ESTIMASI</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{data.map(service => <tr key={service.id}><td className="cell-medium">{service.name}</td><td>{service.unit === 'KG' ? 'kg' : 'pcs'}</td><td>{rupiah(service.price)}</td><td>{duration(service.estimated_hours)}</td><td className={service.is_active ? 'text-active' : 'text-muted'}>{service.is_active ? 'Aktif' : 'Nonaktif'}</td><td><button className="table-action" aria-label={`Edit layanan ${service.name}`} onClick={() => setEditing(service)}>Edit layanan</button><button className="table-action" aria-label={`Riwayat harga ${service.name}`} onClick={() => setHistory(service)}>Riwayat harga</button></td></tr>)}</tbody></table></div>}
    <section className="role-cards"><article><h2>Satuan yang jelas</h2><p>Gunakan kilogram untuk cucian kiloan dan pcs untuk layanan satuan seperti selimut.</p></article><article><h2>Riwayat tetap terjaga</h2><p>Nonaktifkan layanan yang tidak digunakan tanpa menghapus data layanan.</p></article></section>
    {editing !== undefined && <ServiceEditor service={editing} onClose={() => setEditing(undefined)} onSaved={() => { setNotice(editing ? 'Layanan berhasil diperbarui.' : 'Layanan berhasil ditambahkan.'); setEditing(undefined); reload() }} />}
    {history && <PriceHistory service={history} onClose={() => setHistory(null)} />}
  </>
}
