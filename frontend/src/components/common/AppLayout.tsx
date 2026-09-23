import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  IconDashboard,
  IconBook,
  IconReview,
  IconBot,
  IconProgress,
  IconMistake,
  IconSparkles,
  IconFlame,
  IconLogOut,
  IconMenu,
  IconX,
} from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconDashboard },
  { to: '/vocabulary', label: 'Vocabulary', icon: IconBook },
  { to: '/review', label: 'Review', icon: IconReview },
  { to: '/ai-tutor', label: 'AI Tutor', icon: IconBot },
  { to: '/progress', label: 'Progress', icon: IconProgress },
  { to: '/mistakes', label: 'Mistake Book', icon: IconMistake },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
              <IconSparkles size={20} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                LearnFlow
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Spaced Repetition & AI
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 dark:bg-indigo-600 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={cn(
                        'transition-transform duration-150 group-hover:scale-110',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200',
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Motivation Tip Card & User Footer */}
      <div className="space-y-3 pt-4">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-3.5 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-purple-950/30">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <IconFlame size={16} className="text-amber-500 animate-pulse-subtle" />
            <span className="text-xs font-bold uppercase tracking-wider">Stay Consistent</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Reviewing daily cements 90% of newly learned words into long-term memory.
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-xs">
              {userInitial}
            </div>
            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            title="Logout"
            aria-label="Logout"
          >
            <IconLogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white p-4 lg:flex dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        {navContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm">
            <IconSparkles size={16} />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white">LearnFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white p-4 shadow-2xl dark:bg-slate-900 animate-scale-in">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <IconX size={18} />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
