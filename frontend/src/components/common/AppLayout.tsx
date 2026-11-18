import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ProfileDialog } from '@/components/account/ProfileDialog'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  IconBot,
  IconBook,
  IconFlame,
  IconLogOut,
  IconMenu,
  IconSettings,
  IconX,
} from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'

// Learning pages were removed with the old schema; the new ones arrive with R2–R4.
const NAV_ITEMS = [{ to: '/ai-tutor', label: 'AI Tutor', icon: IconBot }]

export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  const navContent = (
    <div className="flex min-h-full flex-col justify-between gap-4">
      <div>
        {/* Brand Logo & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <IconBook size={20} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                LearnFlow
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Language Learning
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 flex flex-col gap-1">
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
                      ? 'bg-indigo-50 text-indigo-700 shadow-2xs dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110',
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200',
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
        <div className="rounded-2xl border border-orange-200/70 bg-orange-50/80 p-3.5 dark:border-orange-950/60 dark:bg-orange-950/30">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <IconFlame size={16} className="text-orange-500 animate-pulse-subtle" />
            <span className="text-xs font-semibold">Daily Habit</span>
          </div>
          <p className="mt-1 text-xs text-orange-900/80 dark:text-orange-200/90 leading-relaxed">
            Consistent 10-minute daily practice builds lasting confidence and long-term memory.
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {userInitial}
            </div>
            <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
              {user?.email}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProfileOpen(true)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Learning profile"
              aria-label="Learning profile"
            >
              <IconSettings size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogoutConfirmOpen(true)}
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              title="Logout"
              aria-label="Logout"
            >
              <IconLogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white p-4 lg:flex dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-y-auto z-30">
        {navContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <IconBook size={16} />
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white p-4 shadow-2xl dark:bg-slate-900 animate-scale-in overflow-y-auto">
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto min-w-0 animate-fade-in">
        <Outlet />
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} title="Log Out">
        <div className="flex flex-col gap-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to log out of your LearnFlow account?
          </p>
          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setLogoutConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => {
                setLogoutConfirmOpen(false)
                logout()
              }}
              className="gap-1.5"
            >
              <IconLogOut size={16} />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </Dialog>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
