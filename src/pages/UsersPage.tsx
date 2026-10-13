import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { ApiError } from '../services/api'
import { useCollection } from '../hooks/useCollection'
import { Icon } from '../components/Icon'
import { Modal } from '../components/ui/Modal'
import { TextField } from '../components/ui/TextField'
import { SelectField } from '../components/ui/SelectField'
import { Button } from '../components/ui/Button'

export type Account = { id: number; name: string; username: string; email: string; role: 'admin' | 'cashier'; is_active: boolean; last_active_at: string | null }

function AccountEditor({ account, onClose, onSaved }: { account: Account | null; onClose: () => void; onSaved: () => void }) {
  const { session, authorizedRequest, refreshUser } = useAuth()
  const id = useId()
  const [name, setName] = useState(account?.name ?? '')
  const [identifier, setIdentifier] = useState(account?.email || account?.username || '')
  const [role, setRole] = useState(account?.role ?? 'cashier')
  const [active, setActive] = useState(account?.is_active ?? true)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const own = account?.id === session?.user.id
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const fields: Record<string, string> = {}
    if (!name.trim() || Array.from(name.trim()).length > 120) fields.name = 'Nama wajib diisi, maksimal 120 karakter.'
    if (!identifier.trim()) fields.identifier = 'Masukkan username atau email.'
    if (!account && (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72)) fields.password = 'Kata sandi minimal 8 karakter dan maksimal 72 byte.'
    setErrors(fields); setError('')
    if (Object.keys(fields).length) { document.getElementById(`${id}-${Object.keys(fields)[0]}`)?.focus(); return }
    setBusy(true)
    try {
      await authorizedRequest(account ? `/users/${account.id}` : '/users', { method: account ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), identifier: identifier.trim(), role, is_active: active, ...(!account ? { password } : {}) }) })
      if (own) await refreshUser()
      setPassword(''); onSaved()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Pengguna belum dapat disimpan.')
      if (failure instanceof ApiError) setErrors(failure.fields)
    } finally { setBusy(false) }
  }
  return <Modal title={account ? 'Edit akun pengguna' : 'Tambah akun pengguna'} description="Akses diberikan sesuai dengan peran pengguna." onClose={onClose} busy={busy}>
    <form onSubmit={submit} noValidate className="workspace-form">
      <TextField id={`${id}-name`} label="Nama *" value={name} onChange={event => setName(event.target.value)} error={errors.name} disabled={busy} required maxLength={120} autoComplete="off" placeholder="Nama pengguna" />
      <TextField id={`${id}-identifier`} label="Username atau email *" value={identifier} onChange={event => setIdentifier(event.target.value)} error={errors.identifier} disabled={busy} required autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="nama@laundry.test" />
      <div className="form-row">
        <SelectField id={`${id}-role`} label="Peran *" value={role} onChange={event => setRole(event.target.value as Account['role'])} disabled={busy || own} error={errors.role}><option value="cashier">Kasir</option><option value="admin">Admin</option></SelectField>
        <SelectField id={`${id}-active`} label="Status akun" value={String(active)} onChange={event => setActive(event.target.value === 'true')} disabled={busy || own} error={errors.is_active}><option value="true">Aktif</option><option value="false">Nonaktif</option></SelectField>
      </div>
      {!account && <TextField id={`${id}-password`} label="Kata sandi awal *" type="password" value={password} onChange={event => setPassword(event.target.value)} error={errors.password} disabled={busy} autoComplete="new-password" placeholder="Minimal 8 karakter" />}
      <div className="workspace-notice"><Icon name="check" /><p>Akun nonaktif tidak dapat masuk. Riwayat transaksinya tetap tersimpan.</p></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="dialog-actions"><Button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Batal</Button><Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan pengguna'}</Button></div>
    </form>
  </Modal>
}

export function UsersPage() {
  const { data, loading, error, reload } = useCollection<Account>('/users')
  const [editing, setEditing] = useState<Account | null | undefined>(undefined)
  const [notice, setNotice] = useState('')
  return <>
    <header className="page-heading page-heading-actions"><div><h1>Pengguna &amp; akses</h1><p>Kelola akun internal admin dan kasir.</p></div><Button onClick={() => { setNotice(''); setEditing(null) }}>+ Tambah pengguna</Button></header>
    <div className="workspace-notice" role={notice ? 'status' : undefined}><Icon name="check" /><p>{notice || 'Hanya admin yang dapat mengelola pengguna, layanan, dan pengaturan sistem.'}</p></div>
    {loading ? <p className="collection-loading" role="status">Memuat pengguna…</p> : error ? <section className="feedback-panel feedback-error" role="alert"><p>{error}</p><Button onClick={reload}>Coba lagi</Button></section> : data.length === 0 ? <section className="feedback-panel"><h2>Belum ada pengguna</h2><p>Tambahkan akun untuk membantu operasional laundry.</p></section> : <div className="table-wrap"><table className="workspace-table users-table"><colgroup><col style={{ width: '19.643%' }} /><col style={{ width: '26.786%' }} /><col style={{ width: '12.5%' }} /><col style={{ width: '10.714%' }} /><col style={{ width: '17.857%' }} /><col style={{ width: '12.5%' }} /></colgroup><thead><tr><th>NAMA</th><th>USERNAME / EMAIL</th><th>PERAN</th><th>STATUS</th><th>AKTIVITAS TERAKHIR</th><th>AKSI</th></tr></thead><tbody>{data.map(account => <tr key={account.id}><td className="cell-medium">{account.name}</td><td>{account.email || account.username}</td><td>{account.role === 'admin' ? 'Admin' : 'Kasir'}</td><td className={account.is_active ? 'text-active' : 'text-muted'}>{account.is_active ? 'Aktif' : 'Nonaktif'}</td><td>{account.last_active_at ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(account.last_active_at)) : 'Belum ada aktivitas'}</td><td><button className="table-action" aria-label={`Edit akun ${account.name}`} onClick={() => { setNotice(''); setEditing(account) }}>Edit akun</button></td></tr>)}</tbody></table></div>}
    <section className="role-cards"><article><h2>Admin</h2><p>Mengelola pengguna, layanan dan harga, pengaturan, pelanggan, serta seluruh pesanan.</p></article><article><h2>Kasir</h2><p>Mencatat pesanan dan pembayaran, mengubah status cucian, serta mengelola data pelanggan.</p></article></section>
    {editing !== undefined && <AccountEditor account={editing} onClose={() => setEditing(undefined)} onSaved={() => { setNotice(editing ? 'Data pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.'); setEditing(undefined); reload() }} />}
  </>
}
