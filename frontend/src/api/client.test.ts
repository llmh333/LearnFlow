import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { apiFetch, refreshSession } from './client'

const USER = { id: 1, email: 'user@example.com', displayName: 'User' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiFetch auth handling', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    localStorage.setItem('learnflow_mock_mode', 'false')
    vi.stubGlobal('fetch', fetchMock)
    useAuthStore.setState({ token: 'expired', user: USER, status: 'authenticated' })
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('never writes the access token to localStorage', () => {
    useAuthStore.getState().setAuth('secret-token', USER)

    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/refresh')) {
        return json(200, { token: 'fresh', expiresAt: '2026-01-01T00:15:00Z', user: USER })
      }
      const auth = new Headers(init?.headers).get('Authorization')
      return auth === 'Bearer fresh' ? json(200, { ok: true }) : json(401, {})
    })

    await expect(apiFetch('/account/profile')).resolves.toEqual({ ok: true })
    expect(useAuthStore.getState().token).toBe('fresh')
  })

  it('shares one refresh between concurrent 401s', async () => {
    let refreshCalls = 0
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshCalls++
        return json(200, { token: 'fresh', expiresAt: '2026-01-01T00:15:00Z', user: USER })
      }
      const auth = new Headers(init?.headers).get('Authorization')
      return auth === 'Bearer fresh' ? json(200, {}) : json(401, {})
    })

    await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')])

    expect(refreshCalls).toBe(1)
  })

  it('signs out when the refresh fails', async () => {
    fetchMock.mockResolvedValue(json(401, { detail: 'Refresh token is invalid or expired' }))

    await expect(refreshSession()).resolves.toBe(false)
    expect(useAuthStore.getState()).toMatchObject({ token: null, status: 'anonymous' })
  })

  it('does not try to refresh when login itself is rejected', async () => {
    fetchMock.mockResolvedValue(json(401, { detail: 'Invalid email or password' }))

    await expect(apiFetch('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 401,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
