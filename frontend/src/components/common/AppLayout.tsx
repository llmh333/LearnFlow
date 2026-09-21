import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/vocabulary', label: 'Vocabulary' },
  { to: '/review', label: 'Review' },
  { to: '/ai-tutor', label: 'AI Tutor' },
  { to: '/progress', label: 'Progress' },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="flex w-56 flex-col border-r border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-6 px-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          LearnFlow
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  isActive && 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="mb-2 truncate px-2 text-xs text-neutral-500">{user?.email}</p>
          <Button variant="secondary" className="w-full" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
