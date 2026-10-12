import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/context'

const navigation = [
  { to: '/', label: 'Overview' },
  { to: '/customers', label: 'Customers' },
  { to: '/services', label: 'Laundry services' },
]

export function AppLayout() {
  const { session, logout } = useAuth()
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4 focus:text-teal-800">Skip to content</a>
      <aside className="border-b border-slate-200 bg-white px-6 py-7 lg:flex lg:min-h-screen lg:flex-col lg:border-r lg:border-b-0">
        <NavLink to="/" className="inline-flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-900">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white">L</span>
          Laundry POS
        </NavLink>
        <nav aria-label="Main navigation" className="mt-7 flex flex-wrap gap-2 lg:flex-col">
          {navigation.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto hidden pt-10 text-xs text-slate-500 lg:block">Laundry operations workspace</p>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-5 sm:px-10">
          <p className="text-sm font-medium text-slate-500">Your laundry workspace</p>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{session?.user.name} · {session?.user.role === 'admin' ? 'Admin' : 'Kasir'}</span>
            <button type="button" onClick={() => { void logout() }} className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Keluar</button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-6 py-10 outline-none sm:px-10 sm:py-14">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
