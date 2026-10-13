import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context'

export function useCollection<T>(path: string) {
  const { authorizedRequest } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${path}:${revision}`
  const [state, setState] = useState<{ key: string; data: T[]; total: number; error: string }>({ key: '', data: [], total: 0, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await authorizedRequest(path, { signal: controller.signal })
        const body: unknown = await response.json()
        if (typeof body !== 'object' || body === null || !('data' in body) || !Array.isArray(body.data)) throw new Error('Respons daftar dari server tidak valid.')
        const total = 'total' in body && typeof body.total === 'number' ? body.total : body.data.length
        if (!controller.signal.aborted) setState({ key, data: body.data as T[], total, error: '' })
      } catch (failure) {
        if (!controller.signal.aborted) setState({ key, data: [], total: 0, error: failure instanceof Error ? failure.message : 'Data belum dapat dimuat.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [path, key, authorizedRequest])
  return { data: state.key === key ? state.data : [], total: state.key === key ? state.total : 0, loading: state.key !== key, error: state.key === key ? state.error : '', reload: () => setRevision(value => value + 1) }
}
