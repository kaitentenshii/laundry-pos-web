import { Outlet } from 'react-router'
import { useAuth } from './context'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import type { User } from './session'

export function RequireRole({ roles }: { roles: User['role'][] }) {
  const { session } = useAuth()
  return session && roles.includes(session.user.role) ? <Outlet /> : <ForbiddenPage />
}
