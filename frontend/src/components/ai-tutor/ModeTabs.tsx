import { cn } from '@/lib/cn'

export type AiTutorMode = 'chat' | 'correct' | 'ask' | 'examples'

const TABS: {
  mode: AiTutorMode
  label: string
  emoji: string
  desc: string
  activeClass: string
}[] = [
  {
    mode: 'chat',
    label: 'AI Conversation',
    emoji: '💬',
    desc: 'Interactive live dialogue',
    activeClass: 'bg-[#58cc02] border-[#46a302] text-white shadow-xs',
  },
  {
    mode: 'correct',
    label: 'Sentence Doctor',
    emoji: '🩺',
    desc: 'Check grammar & nuance',
    activeClass: 'bg-[#1cb0f6] border-[#1899d6] text-white shadow-xs',
  },
  {
    mode: 'ask',
    label: 'Grammar Clinic',
    emoji: '📖',
    desc: 'Clear rules & patterns',
    activeClass: 'bg-[#ffc800] border-[#e5a500] text-amber-950 shadow-xs',
  },
  {
    mode: 'examples',
    label: 'Example Generator',
    emoji: '✨',
    desc: 'Sentences for any word',
    activeClass: 'bg-[#a855f7] border-[#9333ea] text-white shadow-xs',
  },
]

interface ModeTabsProps {
  active: AiTutorMode
  onChange: (mode: AiTutorMode) => void
}

export function ModeTabs({ active, onChange }: ModeTabsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {TABS.map((tab) => {
        const isActive = active === tab.mode
        return (
          <button
            key={tab.mode}
            type="button"
            onClick={() => onChange(tab.mode)}
            className={cn(
              'flex flex-col sm:flex-row items-center sm:items-start gap-2.5 rounded-2xl p-3 sm:p-3.5 transition-all duration-75 select-none cursor-pointer border-2 border-b-4 active:border-b-2 active:translate-y-[2px]',
              isActive
                ? tab.activeClass
                : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-[#1B272C] dark:border-[#2B3940] dark:border-b-[#202c32] dark:text-slate-300 dark:hover:bg-[#223238]',
            )}
          >
            <span className="text-2xl sm:text-2xl shrink-0">{tab.emoji}</span>
            <div className="text-center sm:text-left min-w-0">
              <p className="font-extrabold text-sm leading-tight">{tab.label}</p>
              <p
                className={cn(
                  'text-[11px] font-semibold mt-0.5 truncate',
                  isActive ? 'opacity-90' : 'text-slate-400 dark:text-slate-500',
                )}
              >
                {tab.desc}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
