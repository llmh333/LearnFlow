import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { ProtectedRoute } from './ProtectedRoute'

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.setState({ token: null, user: null, status: 'unknown' })
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('redirects to /login when there is no session', () => {
    useAuthStore.setState({ status: 'anonymous' })
    renderWithRouter()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when a token is present', () => {
    useAuthStore.setState({
      token: 'fake-token',
      user: { id: 1, email: 'user@example.com', displayName: 'User' },
      status: 'authenticated',
    })

    renderWithRouter()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('restores the session from the refresh cookie after a page load', async () => {
    localStorage.setItem('learnflow_mock_mode', 'false')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              token: 'restored',
              expiresAt: '2026-01-01T00:15:00Z',
              user: { id: 1, email: 'user@example.com', displayName: 'User' },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    )

    renderWithRouter()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByText('Protected content')).toBeInTheDocument()
  })
})
