import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
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
    useAuthStore.setState({ token: null, user: null })
  })

  it('redirects to /login when there is no token', () => {
    renderWithRouter()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when a token is present', () => {
    useAuthStore.setState({
      token: 'fake-token',
      user: { id: 1, email: 'user@example.com', displayName: 'User' },
    })

    renderWithRouter()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
