import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, apiRequest } from '../services/api'
import { AuthContext } from './context'
import { parseLoginResponse, parseUser, readSession, removeSession, saveSession } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [restoredSession] = useState(readSession)
  const [session, setSession] = useState(restoredSession)
  const [checking, setChecking] = useState(Boolean(restoredSession))
  const [notice, setNotice] = useState('')

  const clearSession = useCallback((message = '') => {
    removeSession()
    setSession(null)
    setNotice(message)
  }, [])

  useEffect(() => {
    if (!restoredSession) return
    const controller = new AbortController()
    async function restore() {
      try {
        const response = await apiRequest('/auth/me', { signal: controller.signal }, restoredSession!.accessToken)
        const body: unknown = await response.json().catch(() => null)
        const user = parseUser(typeof body === 'object' && body !== null && 'user' in body ? body.user : null)
        if (controller.signal.aborted) return
        if (restoredSession!.expiresAt <= Date.now()) throw new ApiError(401, 'unauthorized', 'Sesi Anda telah berakhir. Silakan masuk kembali.')
        const verified = { ...restoredSession!, user }
        saveSession(verified)
        setSession(verified)
      } catch (failure) {
        if (controller.signal.aborted) return
        clearSession(failure instanceof Error ? failure.message : 'Sesi tidak dapat diverifikasi. Silakan masuk kembali.')
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }
    void restore()
    return () => controller.abort()
  }, [restoredSession, clearSession])

  useEffect(() => {
    if (!session) return
    const expire = () => {
      if (session.expiresAt <= Date.now()) clearSession('Sesi Anda telah berakhir. Silakan masuk kembali.')
    }
    const timer = window.setTimeout(expire, Math.max(0, session.expiresAt - Date.now()))
    document.addEventListener('visibilitychange', expire)
    window.addEventListener('focus', expire)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', expire)
      window.removeEventListener('focus', expire)
    }
  }, [session, clearSession])

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await apiRequest('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) })
    const authenticated = parseLoginResponse(await response.json().catch(() => null))
    saveSession(authenticated)
    setSession(authenticated)
    setNotice('')
  }, [])

  const logout = useCallback(async () => {
    const token = session?.accessToken
    clearSession()
    if (token) {
      try { await apiRequest('/auth/logout', { method: 'POST' }, token) } catch { /* Local logout always completes, including when the server is unavailable. */ }
    }
  }, [session, clearSession])

  const authorizedRequest = useCallback(async (path: string, options?: RequestInit) => {
    if (!session || session.expiresAt <= Date.now()) {
      clearSession('Sesi Anda telah berakhir. Silakan masuk kembali.')
      throw new ApiError(401, 'unauthorized', 'Sesi Anda telah berakhir. Silakan masuk kembali.')
    }
    try { return await apiRequest(path, options, session.accessToken) } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) clearSession(failure.message)
      throw failure
    }
  }, [session, clearSession])

  return <AuthContext.Provider value={{ session, checking, notice, login, logout, authorizedRequest }}>{children}</AuthContext.Provider>
}
