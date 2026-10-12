import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './context'

export function RequireAuth() {
  const { session, checking } = useAuth()
  const location = useLocation()
  if (checking) return <p className="p-8 text-slate-600" role="status">Memeriksa sesi…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  return <Outlet />
}
