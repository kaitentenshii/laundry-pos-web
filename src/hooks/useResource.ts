import { useEffect, useState } from 'react'
import { useAuth } from '../auth/context'
export function useResource<T>(path: string) {
  const { authorizedRequest } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${path}:${revision}`
  const [state, setState] = useState<{ key: string; data?: T; error: string }>({ key: '', error: '' })
  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      try {
        const response = await authorizedRequest(path, { signal: controller.signal })
        const body: unknown = await response.json()
        if (!body || typeof body !== 'object' || !('data' in body) || !body.data) throw new Error('Respons data tidak valid.')
        if (!controller.signal.aborted) setState({ key, data: body.data as T, error: '' })
      } catch (failure) { if (!controller.signal.aborted) setState({ key, error: failure instanceof Error ? failure.message : 'Data belum dapat dimuat.' }) }
    })()
    return () => controller.abort()
  }, [path, key, authorizedRequest])
  return { data: state.key === key ? state.data : undefined, loading: state.key !== key, error: state.key === key ? state.error : '', reload: () => setRevision(value => value + 1) }
}
