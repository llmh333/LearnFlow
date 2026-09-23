import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    register.mutate(
      { email, password, displayName },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Create your LearnFlow account
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {register.isError && (
            <p className="text-sm text-red-600">
              {register.error instanceof ApiError ? register.error.message : 'Registration failed'}
            </p>
          )}
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
