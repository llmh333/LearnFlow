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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#365314] text-[#B6F23A] dark:bg-[#B6F23A] dark:text-[#1A1A1A] shadow-xs">
              <IconSparkles size={20} />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                LearnFlow
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
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
                      ? 'bg-[#365314] text-white shadow-xs dark:bg-[#B6F23A] dark:text-[#1A1A1A]'
                      : 'text-slate-700 hover:bg-[#F0F2F5] hover:text-[#1A1A1A] dark:text-slate-300 dark:hover:bg-[#262626] dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110',
                        isActive
                          ? 'bg-white/15 dark:bg-black/10'
                          : 'text-slate-400 group-hover:text-[#1A1A1A] dark:text-slate-400 dark:group-hover:text-white',
                      )}
                    >
                      <Icon size={17} />
                    </div>
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
        <div className="rounded-2xl border border-[#D5ECC2] bg-[#EDFBD8] p-3.5 dark:border-[#365314] dark:bg-[#1E2B11]">
          <div className="flex items-center gap-2 text-[#365314] dark:text-[#B6F23A]">
            <IconFlame size={16} className="text-[#93D620] dark:text-[#B6F23A] animate-pulse-subtle" />
            <span className="text-xs font-bold uppercase tracking-wider">Stay Consistent</span>
          </div>
          <p className="mt-1 text-xs text-[#2b440e] dark:text-slate-200 leading-relaxed font-medium">
            Reviewing daily cements 90% of newly learned words into long-term memory.
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-[#2C2C2C] dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#365314] text-xs font-bold text-white dark:bg-[#B6F23A] dark:text-[#1A1A1A] shadow-xs">
              {userInitial}
            </div>
            <p className="truncate text-xs font-semibold text-[#1A1A1A] dark:text-slate-200">
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
    <div className="flex min-h-screen bg-[#F0F2F5] text-[#1A1A1A] dark:bg-[#121212] dark:text-[#F5F5F5]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex dark:border-[#282828] dark:bg-[#1A1A1A] shadow-xs">
        {navContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden dark:border-[#282828] dark:bg-[#1A1A1A]/95">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#365314] text-[#B6F23A] dark:bg-[#B6F23A] dark:text-[#1A1A1A] shadow-xs">
            <IconSparkles size={16} />
          </div>
          <span className="text-base font-bold text-[#1A1A1A] dark:text-white">LearnFlow</span>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white p-4 shadow-2xl dark:bg-[#1A1A1A] animate-scale-in">
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
