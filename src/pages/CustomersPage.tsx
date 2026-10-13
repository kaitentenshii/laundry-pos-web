import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { useCollection } from '../hooks/useCollection'
import { ApiError } from '../services/api'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Modal } from '../components/ui/Modal'

export type Customer = { id: number; name: string; whatsapp: string; address: string; notes: string; whatsapp_opt_in: boolean; created_at: string; updated_at: string }

function CustomerEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { authorizedRequest } = useAuth()
  const id = useId()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const fields: Record<string, string> = {}
    if (!name.trim()) fields.name = 'Nama pelanggan wajib diisi.'
    if (!phone.trim()) fields.whatsapp = 'Nomor WhatsApp wajib diisi.'
    setErrors(fields); setError('')
    if (Object.keys(fields).length) { document.getElementById(`${id}-${Object.keys(fields)[0]}`)?.focus(); return }
    setBusy(true)
    try {
      await authorizedRequest('/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, whatsapp: phone, address, notes, whatsapp_opt_in: consent }) })
      onSaved()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Pelanggan belum dapat disimpan.')
      if (failure instanceof ApiError) setErrors(failure.fields)
    } finally { setBusy(false) }
  }
  return <Modal title="Tambah pelanggan" description="Data kontak digunakan untuk transaksi dan notifikasi status." onClose={onClose} busy={busy}>
    <form onSubmit={submit} noValidate className="workspace-form">
      <TextField id={`${id}-name`} label="Nama pelanggan *" value={name} onChange={e => setName(e.target.value)} error={errors.name} disabled={busy} required maxLength={120} placeholder="Nama lengkap" />
      <TextField id={`${id}-whatsapp`} label="Nomor WhatsApp *" type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.whatsapp} disabled={busy} required maxLength={40} placeholder="+62 8xx-xxxx-xxxx" />
      <p className="field-hint">Gunakan nomor aktif yang dapat menerima WhatsApp.</p>
      <TextField id={`${id}-address`} label="Alamat (opsional)" value={address} onChange={e => setAddress(e.target.value)} error={errors.address} disabled={busy} maxLength={1000} placeholder="Alamat pelanggan" />
      <div className="login-field"><label htmlFor={`${id}-notes`}>Catatan (opsional)</label><textarea id={`${id}-notes`} value={notes} onChange={e => setNotes(e.target.value)} disabled={busy} maxLength={2000} aria-invalid={Boolean(errors.notes)} />{errors.notes && <p className="field-error">{errors.notes}</p>}</div>
      <SelectField id={`${id}-consent`} label="Persetujuan notifikasi WhatsApp" value={String(consent)} onChange={e => setConsent(e.target.value === 'true')} disabled={busy}><option value="false">Belum disetujui</option><option value="true">Disetujui pelanggan</option></SelectField>
      <p className="field-hint">Konfirmasi persetujuan pelanggan sebelum mengaktifkan notifikasi.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions"><Button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Batal</Button><Button disabled={busy} type="submit">{busy ? 'Menyimpan…' : 'Simpan pelanggan'}</Button></div>
    </form>
  </Modal>
}

export function CustomersPage() {
  const { data, loading, error, reload } = useCollection<Customer>('/customers')
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Pelanggan</h1><p>Kontak yang rapi untuk pesanan dan notifikasi.</p></div><Button onClick={() => setCreating(true)}>+ Pelanggan baru</Button></header>
    {notice && <p className="workspace-notice" role="status">{notice}</p>}
    {loading ? <p role="status" className="collection-loading">Memuat pelanggan…</p> : error ? <section role="alert" className="feedback-panel feedback-error"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : !data.length ? <section className="feedback-panel"><h2>Belum ada pelanggan</h2><p>Tambahkan pelanggan untuk mencatat kontaknya.</p></section> : <div className="table-wrap"><table className="workspace-table"><thead><tr><th>NAMA</th><th>WHATSAPP</th><th>PERSETUJUAN WA</th></tr></thead><tbody>{data.map(customer => <tr key={customer.id}><td className="cell-medium">{customer.name}</td><td>{customer.whatsapp}</td><td><span className={customer.whatsapp_opt_in ? 'text-active' : 'text-muted'}>{customer.whatsapp_opt_in ? 'Disetujui' : 'Belum disetujui'}</span></td></tr>)}</tbody></table></div>}
    {creating && <CustomerEditor onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setNotice('Pelanggan berhasil ditambahkan.'); reload() }} />}
  </>
}
