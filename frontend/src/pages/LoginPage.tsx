import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    login.mutate(
      { email, password },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Log in to LearnFlow
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {login.isError && (
            <p className="text-sm text-red-600">
              {login.error instanceof ApiError ? login.error.message : 'Login failed'}
            </p>
          )}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          No account yet?{' '}
          <Link to="/register" className="font-medium underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  )
}
