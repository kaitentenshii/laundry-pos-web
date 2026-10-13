import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useOutletContext } from 'react-router'
import { useAuth } from '../auth/context'
import { useResource } from '../hooks/useResource'
import { ApiError } from '../services/api'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
type Profile = { name: string; contact: string; operating_hours: string; address: string; updated_at: string }
function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const { authorizedRequest } = useAuth()
  const [values, setValues] = useState(profile)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const set = (name: keyof Profile, value: string) => { setValues(current => ({ ...current, [name]: value })); setSaved(false) }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    const fields: Record<string, string> = {}
    for (const field of ['name', 'contact', 'operating_hours', 'address'] as const) if (!values[field].trim()) fields[field] = 'Wajib diisi.'
    setErrors(fields); setError(''); setSaved(false)
    if (Object.keys(fields).length) { document.getElementById(`profile-${Object.keys(fields)[0]}`)?.focus(); return }
    setBusy(true)
    try {
      const response = await authorizedRequest('/settings/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: values.name.trim(), contact: values.contact.trim(), operating_hours: values.operating_hours.trim(), address: values.address.trim() }) })
      const body = await response.json() as { data: Profile }
      setValues(body.data); setSaved(true); onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Profil belum dapat disimpan.'); if (failure instanceof ApiError) setErrors(failure.fields) } finally { setBusy(false) }
  }
  return <form onSubmit={submit} noValidate>
    <header className="page-heading page-heading-actions"><div><h1>Pengaturan laundry</h1><p>Identitas usaha dan informasi kontak laundry.</p></div><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</Button></header>
    {error && <p className="feedback-error" role="alert">{error}</p>}{saved && <p className="profile-saved" role="status">Profil laundry berhasil disimpan.</p>}
    <div className="settings-grid"><section className="order-panel workspace-form"><h2>Profil laundry</h2>
      <TextField id="profile-name" label="Nama usaha *" required maxLength={120} value={values.name} disabled={busy} error={errors.name} onChange={event => set('name', event.target.value)} />
      <div className="form-row"><TextField id="profile-contact" label="Nomor kontak *" required type="tel" maxLength={40} placeholder="+62 812-0000-1000" value={values.contact} disabled={busy} error={errors.contact} onChange={event => set('contact', event.target.value)} /><TextField id="profile-operating_hours" label="Jam operasional *" required maxLength={120} placeholder="08.00–20.00" value={values.operating_hours} disabled={busy} error={errors.operating_hours} onChange={event => set('operating_hours', event.target.value)} /></div>
      <TextField id="profile-address" label="Alamat usaha *" required maxLength={1000} value={values.address} disabled={busy} error={errors.address} onChange={event => set('address', event.target.value)} />
    </section><aside className="order-panel settings-notifications"><h2>WhatsApp bisnis</h2><p>Informasi koneksi dan preferensi notifikasi belum tersedia.</p><Link className="workspace-button button-secondary" to="/notifications">Lihat riwayat pengiriman</Link></aside></div>
  </form>
}
export function SettingsPage() {
  const { data, loading, error, reload } = useResource<Profile>('/settings/profile')
  const context = useOutletContext<{ reloadIdentity?: () => void }>()
  if (loading) return <p className="collection-loading" role="status">Memuat pengaturan…</p>
  if (error) return <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section>
  return data ? <ProfileForm key={data.updated_at} profile={data} onSaved={() => context?.reloadIdentity?.()} /> : null
}
