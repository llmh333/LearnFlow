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
      <div role="status" className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return children
}
