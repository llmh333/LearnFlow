import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { ChinaFlagBadge, EnglishFlagBadge, Flowy, JapanFlagBadge, StreakFlameBadge } from '@/assets'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { MOCK_AUTH_RESPONSE, setMockMode } from '@/mock'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    const isOnboarded = useUiStore.getState().isOnboarded
    return <Navigate to={isOnboarded ? '/' : '/onboarding'} replace />
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMockMode(false)
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          const isOnboarded = useUiStore.getState().isOnboarded
          navigate(isOnboarded ? '/' : '/onboarding', { replace: true })
        },
      },
    )
  }

  function handleMockLogin() {
    setMockMode(true)
    useAuthStore.getState().setAuth(MOCK_AUTH_RESPONSE.token, MOCK_AUTH_RESPONSE.user)
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#F7F9FA] dark:bg-[#131F24] overflow-hidden selection:bg-[#58CC02] selection:text-white">
      {/* Decorative playful floating character badges (EN, ZH, JA) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -left-8 text-7xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        A
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 -right-6 text-8xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        中
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/4 text-8xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        あ
      </div>

      <Card className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-[#2B3940] bg-white dark:bg-[#1A262C] shadow-lg">
        {/* Mascot Banner */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-[#131F24] shadow-sm border-2 border-b-4 border-slate-200 dark:border-[#2B3940]">
              <Flowy size={46} />
            </div>
            <span className="absolute -bottom-1 -right-2 inline-flex items-center gap-1 rounded-full bg-[#FFC800] px-2 py-0.5 text-[10px] font-black uppercase text-amber-950 border border-[#E5A500]">
              <StreakFlameBadge size={12} />
              <span>7 Streak</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-[#202F36] px-3.5 py-1 mb-2">
            <div className="flex items-center gap-1">
              <EnglishFlagBadge size={15} />
              <ChinaFlagBadge size={15} />
              <JapanFlagBadge size={15} />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              English • 中文 • 日本語
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Keep your streak alive and practice English, Chinese &amp; Japanese today.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {login.isError && (
            <div className="rounded-2xl border-2 border-[#FF4B4B]/30 bg-rose-50 p-3 text-xs font-bold text-[#FF4B4B] dark:bg-rose-950/40 dark:text-rose-400">
              {login.error instanceof ApiError ? login.error.message : 'Login failed'}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={login.isPending}
            className="mt-2 w-full py-3 text-base font-extrabold uppercase tracking-wide"
          >
            {login.isPending ? 'Logging in…' : 'Log in 🚀'}
          </Button>

          {/* Playground Mock Option */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-dashed border-slate-200 dark:border-[#2B3940]" />
            </div>
            <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400 dark:bg-[#1A262C] dark:text-slate-500">
                or no backend?
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="sky"
            onClick={handleMockLogin}
            className="w-full py-2.5 text-xs font-extrabold uppercase tracking-wide"
          >
            🎮 Explore in Mock Mode
          </Button>
        </form>

        <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          No account yet?{' '}
          <Link
            to="/register"
            className="font-bold text-[#1CB0F6] hover:underline dark:text-[#1CB0F6]"
          >
            Create an account free
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          <Link to="/sources" className="hover:underline">
            📖 Data sources &amp; open licences
          </Link>
        </p>
      </Card>
    </div>
  )
}
