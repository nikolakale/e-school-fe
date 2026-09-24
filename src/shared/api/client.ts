const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]> | undefined

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Sanctum SPA auth needs a CSRF cookie before any state-changing request.
 * Safe to call repeatedly - the endpoint just (re)issues the cookie.
 */
export async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & { body?: unknown }

/**
 * Thin fetch wrapper for the /api/v1 contract: cookie auth (credentials always
 * included), CSRF header on mutating requests, JSON in/out, and BE's
 * {message, errors} error shape surfaced as a typed ApiError.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const isMutating = method !== 'GET' && method !== 'HEAD'

  if (isMutating) {
    await ensureCsrfCookie()
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const xsrfToken = readCookie('XSRF-TOKEN')
  if (isMutating && xsrfToken) {
    headers.set('X-XSRF-TOKEN', xsrfToken)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? response.statusText, data?.errors)
  }

  return data as T
}
