import { IconSparkles, IconCheckCircle, IconBot } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

export type AiTutorMode = 'ask' | 'correct' | 'chat'

const TABS: { mode: AiTutorMode; label: string; icon: typeof IconSparkles }[] = [
  { mode: 'ask', label: 'Grammar Q&A', icon: IconSparkles },
  { mode: 'correct', label: 'Sentence Check', icon: IconCheckCircle },
  { mode: 'chat', label: 'Interactive Chat', icon: IconBot },
]

interface ModeTabsProps {
  active: AiTutorMode
  onChange: (mode: AiTutorMode) => void
}

export function ModeTabs({ active, onChange }: ModeTabsProps) {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-[#F0F2F5] p-1.5 dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#2C2C2C]">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.mode
        return (
          <button
            key={tab.mode}
            type="button"
            onClick={() => onChange(tab.mode)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-[#B6F23A] text-[#1A1A1A] shadow-xs'
                : 'text-slate-700 hover:text-[#1A1A1A] hover:bg-white/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#262626]',
            )}
          >
            <Icon
              size={16}
              className={isActive ? 'text-[#1A1A1A]' : 'text-slate-500 dark:text-slate-400'}
            />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
