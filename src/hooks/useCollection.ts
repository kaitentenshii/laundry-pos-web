import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context'

export function useCollection<T>(path: string) {
  const { authorizedRequest } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${path}:${revision}`
  const [state, setState] = useState<{ key: string; data: T[]; error: string }>({ key: '', data: [], error: '' })
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await authorizedRequest(path, { signal: controller.signal })
        const body: unknown = await response.json()
        if (typeof body !== 'object' || body === null || !('data' in body) || !Array.isArray(body.data)) throw new Error('Respons daftar dari server tidak valid.')
        if (!controller.signal.aborted) setState({ key, data: body.data as T[], error: '' })
      } catch (failure) {
        if (!controller.signal.aborted) setState({ key, data: [], error: failure instanceof Error ? failure.message : 'Data belum dapat dimuat.' })
      }
    }
    void load()
    return () => controller.abort()
  }, [path, key, authorizedRequest])
  return { data: state.data, loading: state.key !== key, error: state.key === key ? state.error : '', reload: () => setRevision(value => value + 1) }
}
