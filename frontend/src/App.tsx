import { useEffect, useState } from 'react'
import { apiFetch } from './api/client'

interface HealthResponse {
  status: string
  time: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiFetch<HealthResponse>('/health')
      .then(setHealth)
      .catch(() => setError(true))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-900">
      <p className="text-lg text-neutral-800 dark:text-neutral-200">
        Backend:{' '}
        {error ? (
          <span className="font-semibold text-red-600">DOWN</span>
        ) : health ? (
          <span className="font-semibold text-green-600">{health.status}</span>
        ) : (
          <span className="text-neutral-500">checking...</span>
        )}
      </p>
    </div>
  )
}

export default App
