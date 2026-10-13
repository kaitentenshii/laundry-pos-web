import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/context'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { useResource } from '../hooks/useResource'

const navigation: { to: string; label: string; icon: IconName; admin?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/orders', label: 'Pesanan', icon: 'bag' },
  { to: '/customers', label: 'Pelanggan', icon: 'users' },
  { to: '/services', label: 'Layanan', icon: 'wash', admin: true },
  { to: '/notifications', label: 'Notifikasi WA', icon: 'chat' },
  { to: '/users', label: 'Pengguna', icon: 'users', admin: true },
  { to: '/settings', label: 'Pengaturan', icon: 'settings', admin: true },
  { to: '/reports', label: 'Laporan', icon: 'grid', admin: true },
]

export function AppLayout() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const identity = useResource<{ name: string }>('/laundry/identity')
  const laundryName = identity.data?.name || 'Laundry Mitra'
  const user = session!.user
  const current = navigation.find(item => item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to))
  const initials = user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
  return (
    <div className="workspace" lang="id">
      <a href="#main-content" className="skip-content">Langsung ke konten</a>
      <aside className="workspace-sidebar">
        <NavLink to="/" className="workspace-brand"><Icon name="brand" /><span>laundry.</span></NavLink>
        <p className="workspace-laundry-name">{laundryName}</p>
        <nav aria-label="Main navigation" className="workspace-nav">
          {navigation.filter(item => !item.admin || user.role === 'admin').map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}><Icon name={item.icon} />{item.label}</NavLink>)}
        </nav>
        <div className="workspace-account" aria-label="Akun aktif">
          <div className="workspace-avatar">{initials}</div>
          <div><p>{user.name}</p><span>{user.role === 'admin' ? 'Admin' : 'Kasir'}</span></div>
        </div>
        <button className="workspace-logout" onClick={() => { void logout() }}>Keluar</button>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar"><p>{laundryName}&nbsp; / &nbsp;{current?.label ?? 'Halaman'}</p><div className="workspace-topbar-actions"><time>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date())}</time><NavLink to="/notifications" aria-label="Lihat notifikasi"><Icon name="bell" /></NavLink></div></header>
        <main id="main-content" tabIndex={-1} className="workspace-content"><Outlet context={{ reloadIdentity: identity.reload }} /></main>
      </div>
    </div>
  )
}
