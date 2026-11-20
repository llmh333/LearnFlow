import { isMockMode, handleMockRequest, setMockMode } from '@/mock'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse, ProblemDetail } from '@/types/domain'

export const API_BASE = '/api/v1'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string>

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/** Auth calls whose 401 means "bad credentials / no session", not "access token expired". */
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/password-reset/request',
  '/auth/password-reset/verify',
  '/auth/password-reset/confirm',
]

let refreshInFlight: Promise<boolean> | null = null

/**
 * Gets a new access token from the HttpOnly refresh cookie. Single-flight: concurrent callers share
 * one request, because the backend rotates the refresh token and treats a reused one as stolen
 * (revoking the whole session).
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' })
    .then((data) => {
      useAuthStore.getState().setAuth(data.token, data.user)
      return true
    })
    .catch(() => {
      useAuthStore.getState().clearAuth()
      return false
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/**
 * Fetch wrapper per plan/phases/00-overview.md §1.2: attaches the Bearer token and parses RFC 7807
 * ProblemDetail error bodies into ApiError. On 401 it refreshes the session once and retries; if
 * that fails it clears the auth store and redirects to /login (a full navigation, since this runs
 * outside the React tree).
 *
 * If Mock Mode is enabled (or the backend is unreachable), delegates to the mock service.
 */
export async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  if (isMockMode()) {
    return handleMockRequest<T>(path, init)
  }

  const token = useAuthStore.getState().token

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      // Sends the refresh cookie; the API is same-origin (Vite proxy in dev, Caddy in prod).
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch (err) {
    // If backend is not running and we are in the browser, seamlessly fall back to mock data
    if (err instanceof TypeError) {
      console.warn(`[LearnFlow API] Backend unreachable at ${path}. Falling back to Mock Mode.`)
      setMockMode(true)
      return handleMockRequest<T>(path, init)
    }
    throw err
  }

  if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    if (!retried && (await refreshSession())) {
      return apiFetch<T>(path, init, true)
    }
    useAuthStore.getState().clearAuth()
    redirectToLogin()
  }

  if (!response.ok) {
    let detail: ProblemDetail = {}
    try {
      detail = (await response.json()) as ProblemDetail
    } catch {
      // body wasn't JSON (or was empty) — fall back to the status text below
    }
    throw new ApiError(
      response.status,
      detail.detail ?? detail.title ?? response.statusText,
      detail.errors,
    )
  }

  // 202/204 and other empty bodies resolve to undefined instead of failing to parse.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
