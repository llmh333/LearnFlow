/**
 * Minimal fetch wrapper skeleton (Phase 0). Phase 1 extends this to attach the Bearer token,
 * parse RFC 7807 ProblemDetail bodies into ApiError, and redirect to /login on 401 — see
 * plan/phases/phase-1-auth-shell.md and the API conventions in plan/phases/00-overview.md §1.2.
 */

const API_BASE = '/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
