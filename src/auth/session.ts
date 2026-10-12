export type User = {
  id: number
  name: string
  username: string
  email: string
  role: 'admin' | 'cashier'
}

export type AuthSession = {
  accessToken: string
  expiresAt: number
  user: User
}

export const SESSION_KEY = 'laundry-pos-session'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseUser(value: unknown): User {
  if (!isRecord(value) || !Number.isSafeInteger(value.id) || (value.id as number) <= 0 || typeof value.name !== 'string' || !value.name.trim() || typeof value.username !== 'string' || typeof value.email !== 'string' || !['admin', 'cashier'].includes(value.role as string)) {
    throw new Error('Respons akun dari server tidak valid. Hubungi administrator.')
  }
  return { id: value.id as number, name: value.name, username: value.username, email: value.email, role: value.role as User['role'] }
}

export function parseLoginResponse(value: unknown, now = Date.now()): AuthSession {
  if (!isRecord(value) || typeof value.access_token !== 'string' || !value.access_token.trim() || value.token_type !== 'Bearer' || typeof value.expires_in !== 'number' || !Number.isInteger(value.expires_in) || value.expires_in <= 0 || value.expires_in > 86400) {
    throw new Error('Respons login dari server tidak valid. Silakan coba lagi.')
  }
  return { accessToken: value.access_token, expiresAt: now + value.expires_in * 1000, user: parseUser(value.user) }
}

export function removeSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* The in-memory session still clears when storage is unavailable. */ }
}

export function readSession(now = Date.now()): AuthSession | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null')
    if (!isRecord(stored) || typeof stored.accessToken !== 'string' || !stored.accessToken.trim() || typeof stored.expiresAt !== 'number' || !Number.isFinite(stored.expiresAt) || stored.expiresAt <= now || stored.expiresAt > now + 86400000) {
      removeSession()
      return null
    }
    return { accessToken: stored.accessToken, expiresAt: stored.expiresAt, user: parseUser(stored.user) }
  } catch {
    removeSession()
    return null
  }
}

export function saveSession(session: AuthSession) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* Login can continue for this page without persisted storage. */ }
}
