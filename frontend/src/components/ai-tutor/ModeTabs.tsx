import { cn } from '@/lib/cn'

export type AiTutorMode = 'ask' | 'correct' | 'chat'

const TABS: { mode: AiTutorMode; label: string }[] = [
  { mode: 'ask', label: 'Ask' },
  { mode: 'correct', label: 'Correct' },
  { mode: 'chat', label: 'Chat' },
]

interface ModeTabsProps {
  active: AiTutorMode
  onChange: (mode: AiTutorMode) => void
}

export function ModeTabs({ active, onChange }: ModeTabsProps) {
  return (
    <div className="flex gap-1 rounded-md bg-neutral-100 p-1 dark:bg-neutral-900">
      {TABS.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          onClick={() => onChange(tab.mode)}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active === tab.mode
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
