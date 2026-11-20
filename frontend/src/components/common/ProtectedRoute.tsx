import { Flex, Spin } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { refreshSession } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

/**
 * The access token lives in memory only, so after a page load the session is restored from the
 * HttpOnly refresh cookie before deciding whether to show the page or send the user to /login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status === 'unknown') {
      void refreshSession()
    }
  }, [status])

  if (status === 'unknown') {
    return (
      <Flex role="status" align="center" justify="center" className="min-h-screen">
        <Spin size="large" aria-label="Loading" />
      </Flex>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return children
}
