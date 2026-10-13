import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { ApiError } from '../services/api'
import type { Customer } from '../pages/CustomersPage'
import { Modal } from './ui/Modal'
import { TextField } from './ui/TextField'
import { Button } from './ui/Button'
import { Icon } from './Icon'

function phoneWithCountry(code: string, value: string) {
  const raw = value.trim()
  if (raw.startsWith('+')) return raw
  let local = raw.replace(/[\s()-]/g, '')
  if (code === '+62' && local.startsWith('628')) local = local.slice(2)
  else if (local.startsWith('0')) local = local.slice(1)
  return code + local
}

export function CreateCustomerModal({ query, onClose, onSaved }: { query: string; onClose: () => void; onSaved: (customer: Customer) => void }) {
  const { authorizedRequest } = useAuth()
  const id = useId()
  const phoneQuery = /^[+\d\s()-]+$/.test(query.trim())
  const [name, setName] = useState(phoneQuery ? '' : query.trim())
  const [phone, setPhone] = useState(phoneQuery ? query.trim() : '')
  const [country, setCountry] = useState('+62')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  async function submit(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (busy) return
    const fields: Record<string, string> = {}
    if (!name.trim() || Array.from(name.trim()).length > 120) fields.name = 'Nama wajib diisi, maksimal 120 karakter.'
    if (!phone.trim()) fields.whatsapp = 'Nomor WhatsApp wajib diisi.'
    setErrors(fields); setError('')
    if (Object.keys(fields).length) { document.getElementById(`${id}-${Object.keys(fields)[0]}`)?.focus(); return }
    setBusy(true)
    try {
      const response = await authorizedRequest('/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), whatsapp: phoneWithCountry(country, phone), whatsapp_opt_in: consent }) })
      const body = await response.json() as { data: Customer }
      if (!body.data || !Number.isSafeInteger(body.data.id) || body.data.id < 1) throw new Error('Respons pelanggan belum valid. Muat ulang daftar pelanggan.')
      onSaved(body.data)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Pelanggan belum dapat disimpan.'); if (failure instanceof ApiError) setErrors(failure.fields) } finally { setBusy(false) }
  }
  return <Modal title="Tambah pelanggan baru" onClose={onClose} busy={busy} headerAction={<button type="button" className="picker-icon-button" aria-label="Tutup dialog tambah pelanggan" onClick={onClose} disabled={busy}><Icon name="clear" /></button>}>
    <form className="workspace-form customer-create-form" onSubmit={submit} noValidate>
      <TextField id={`${id}-name`} data-autofocus label="Nama pelanggan *" value={name} onChange={event => setName(event.target.value)} error={errors.name} disabled={busy} maxLength={120} required autoComplete="name" />
      <div className="login-field"><label htmlFor={`${id}-whatsapp`}>Nomor WhatsApp *</label><div className="customer-phone-input"><select aria-label="Kode negara" value={country} onChange={event => setCountry(event.target.value)} disabled={busy}><option value="+62">+62</option><option value="+60">+60</option><option value="+65">+65</option><option value="+1">+1</option><option value="+44">+44</option><option value="+61">+61</option></select><input id={`${id}-whatsapp`} type="tel" autoComplete="tel-national" value={phone} onChange={event => setPhone(event.target.value)} disabled={busy} required maxLength={40} placeholder="812-0000-1024" aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? `${id}-whatsapp-error` : undefined} /></div>{errors.whatsapp && <p id={`${id}-whatsapp-error`} className="field-error">{errors.whatsapp}</p>}</div>
      <label className="customer-opt-in"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} /><span>Pelanggan menyetujui notifikasi status pesanan melalui WhatsApp.</span></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions customer-create-actions"><Button type="button" className="button-secondary" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan & pilih'}</Button></div>
    </form>
  </Modal>
}
