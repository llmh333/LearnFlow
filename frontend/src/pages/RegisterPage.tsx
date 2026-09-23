import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { IconSparkles } from '@/components/ui/Icon'
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
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#F0F2F5] dark:bg-[#121212] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#B6F23A]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#93D620]/10 blur-3xl" />

      <Card className="relative w-full max-w-md p-8 shadow-xl border-slate-200 dark:border-[#2C2C2C] bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#365314] text-[#B6F23A] dark:bg-[#B6F23A] dark:text-[#1A1A1A] shadow-xs mb-3">
            <IconSparkles size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
            Create your LearnFlow account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master foreign languages with science-backed Spaced Repetition & AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Display name
            </label>
            <Input
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {register.isError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {register.error instanceof ApiError ? register.error.message : 'Registration failed'}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={register.isPending} className="mt-2 w-full py-2.5 shadow-xs font-bold">
            {register.isPending ? 'Creating account...' : 'Get started'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#365314] dark:text-[#B6F23A] hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
