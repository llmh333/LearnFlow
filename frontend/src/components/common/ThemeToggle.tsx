import { Button } from '@/components/ui/Button'
import { IconSun, IconMoon } from '@/components/ui/Icon'
import { useUiStore } from '@/stores/uiStore'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`h-9 w-9 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl transition-colors cursor-pointer ${className ?? ''}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <IconSun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <IconMoon size={18} className="text-slate-600 hover:-rotate-12 transition-transform" />
      )}
    </Button>
  )
}
