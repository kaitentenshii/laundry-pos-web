import { createContext, useContext } from 'react'
import type { AuthSession } from './session'

export type AuthContextValue = {
  session: AuthSession | null
  checking: boolean
  notice: string
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authorizedRequest: (path: string, options?: RequestInit) => Promise<Response>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
