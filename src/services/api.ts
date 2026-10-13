import { env } from '../config/env'

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
  }
}

const messages: Record<string, string> = {
  forbidden: 'Anda tidak memiliki izin untuk menggunakan fitur ini.',
  invalid_credentials: 'Username, email, atau kata sandi tidak sesuai.',
  account_inactive: 'Akun Anda tidak aktif. Hubungi administrator laundry.',
  invalid_request: 'Periksa username atau email dan kata sandi Anda.',
  unauthorized: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
}

export async function apiRequest(path: string, options: RequestInit = {}, token?: string): Promise<Response> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('API requests must use an application-relative path.')
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers,
      redirect: 'error',
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.', { cause: error })
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const code = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object' && body.error !== null && 'code' in body.error && typeof body.error.code === 'string' ? body.error.code : ''
    const fallback = response.status === 401 ? messages.unauthorized : response.status === 429 ? 'Terlalu banyak percobaan. Coba lagi sebentar.' : 'Server belum dapat memproses permintaan. Silakan coba lagi.'
    const detail = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object' && body.error !== null ? body.error as Record<string, unknown> : {}
    const fields = typeof detail.fields === 'object' && detail.fields !== null ? Object.fromEntries(Object.entries(detail.fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : {}
    const validationMessage = ['validation_error', 'conflict', 'not_found'].includes(code) && typeof detail.message === 'string' ? detail.message : undefined
    throw new ApiError(response.status, code, messages[code] ?? validationMessage ?? fallback, fields)
  }
  return response
}
