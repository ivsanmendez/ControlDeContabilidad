import type { TokenPair } from '@/types/auth'
import i18n from '@/lib/i18n'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setRefreshToken(token: string) {
  localStorage.setItem('refresh_token', token)
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export function setTokens(pair: TokenPair) {
  setAccessToken(pair.access_token)
  setRefreshToken(pair.refresh_token)
}

export function clearTokens() {
  accessToken = null
  localStorage.removeItem('refresh_token')
}

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  const rt = getRefreshToken()
  if (!rt) throw new ApiClientError('No refresh token', 401)

  const res = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  })

  if (!res.ok) {
    clearTokens()
    throw new ApiClientError('Session expired', res.status)
  }

  const pair: TokenPair = await res.json()
  setTokens(pair)
}

function ensureRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export class ApiClientError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept-Language', i18n.language)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401 && getRefreshToken()) {
    try {
      await ensureRefresh()
    } catch {
      throw new ApiClientError('Session expired', 401)
    }

    const retryHeaders = new Headers(options.headers)
    retryHeaders.set('Authorization', `Bearer ${accessToken}`)
    if (options.body && !retryHeaders.has('Content-Type')) {
      retryHeaders.set('Content-Type', 'application/json')
    }
    res = await fetch(url, { ...options, headers: retryHeaders })
  }

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiClientError(body.error || 'Request failed', res.status)
  }

  return res.json()
}
