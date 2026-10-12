const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'

let parsedUrl: URL
try {
  parsedUrl = new URL(apiBaseUrl)
} catch {
  throw new Error('VITE_API_BASE_URL must be an absolute HTTP or HTTPS URL.')
}

if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
  throw new Error('VITE_API_BASE_URL must be an absolute HTTP or HTTPS URL.')
}

export const env = Object.freeze({
  apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
})
