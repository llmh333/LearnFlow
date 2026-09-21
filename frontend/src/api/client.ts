import { useAuthStore } from '@/stores/authStore'
import type { ProblemDetail } from '@/types/domain'

const API_BASE = '/api'

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

/**
 * Fetch wrapper per plan/phases/00-overview.md §1.2: attaches the Bearer token, parses RFC 7807
 * ProblemDetail error bodies into ApiError, and on 401 clears the auth store and redirects to
 * /login (a full navigation, since this runs outside the React tree).
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (response.status === 401) {
    useAuthStore.getState().clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
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

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
