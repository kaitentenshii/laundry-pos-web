import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import laundryLogo from '../assets/laundry-logo.svg'
import laundryCycle from '../assets/laundry-cycle.svg'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '../styles/login.css'

export function LoginPage() {
  const { session, checking, notice, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' })
  const submitting = useRef(false)

  const state = location.state as { from?: string } | null
  const requestedPath = state?.from
  const destination = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.startsWith('/login') ? requestedPath : '/'

  if (checking) return <p className="p-8 text-slate-600" role="status">Memeriksa sesi…</p>
  if (session) return <Navigate to={destination} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const errors = {
      identifier: identifier.trim() ? '' : 'Masukkan username atau email Anda.',
      password: password ? '' : 'Masukkan kata sandi Anda.',
    }
    setFieldErrors(errors)
    setError('')
    if (errors.identifier || errors.password) {
      document.getElementById(errors.identifier ? 'identifier' : 'password')?.focus()
      return
    }

    submitting.current = true
    setPending(true)
    try {
      await login(identifier.trim(), password)
      setPassword('')
      navigate(destination, { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Tidak dapat masuk. Silakan coba lagi.')
      setPassword('')
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <main className="login-shell" lang="id">
      <section className="login-story" aria-label="Tentang laundry">
        <div className="login-brand">
          <span className="login-brand-icon"><img src={laundryLogo} alt="" /></span>
          <span>laundry.</span>
        </div>
        <div className="login-introduction">
          <h1>Urus laundry.<br />Tanpa terlewat.</h1>
          <p>Dari cucian masuk sampai siap diambil.<br />Satu ruang kerja untuk semua pesanan.</p>
          <div className="login-illustration"><img src={laundryCycle} alt="" /></div>
          <p className="login-tagline">Pesanan rapi. Pelanggan terinformasi.</p>
        </div>
      </section>
      <section className="login-panel" aria-labelledby="login-heading">
        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={pending}>
          <div className="login-mobile-brand" aria-hidden="true">laundry.</div>
          <span className="login-badge">Sistem informasi laundry</span>
          <h2 id="login-heading">Selamat datang kembali</h2>
          <p className="login-subtitle">Masuk dengan akun admin atau kasir Anda.</p>
          {(error || notice) && <p className="login-error" role="alert">{error || notice}</p>}
          <TextField id="identifier" name="identifier" label="Username atau email" placeholder="admin@laundry.test" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={identifier} disabled={pending} onChange={event => { setIdentifier(event.target.value); setFieldErrors(previous => ({ ...previous, identifier: '' })) }} error={fieldErrors.identifier} />
          <TextField id="password" name="password" label="Kata sandi" type="password" placeholder="••••••••••••" autoComplete="current-password" required value={password} disabled={pending} onChange={event => { setPassword(event.target.value); setFieldErrors(previous => ({ ...previous, password: '' })) }} error={fieldErrors.password} />
          <p className="login-account-note">Akun dikelola oleh administrator.</p>
          <Button type="submit" disabled={pending}>{pending ? 'Sedang masuk…' : 'Masuk ke ruang kerja'}</Button>
          <p className="login-help">Tidak dapat masuk? Hubungi admin laundry.</p>
          <hr className="login-divider" />
          <p className="login-footnote">Prototipe capstone · Seluruh data adalah contoh.</p>
        </form>
      </section>
    </main>
  )
}
