import { Flex, Radio } from 'antd'
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
    activeClass: 'bg-[#58cc02] border-[#46a302] text-white hover:text-white shadow-xs',
  },
  {
    mode: 'correct',
    label: 'Sentence Doctor',
    emoji: '🩺',
    desc: 'Check grammar & nuance',
    activeClass: 'bg-[#1cb0f6] border-[#1899d6] text-white hover:text-white shadow-xs',
  },
  {
    mode: 'ask',
    label: 'Grammar Clinic',
    emoji: '📖',
    desc: 'Clear rules & patterns',
    activeClass: 'bg-[#ffc800] border-[#e5a500] text-amber-950 hover:text-amber-950 shadow-xs',
  },
  {
    mode: 'examples',
    label: 'Example Generator',
    emoji: '✨',
    desc: 'Sentences for any word',
    activeClass: 'bg-[#a855f7] border-[#9333ea] text-white hover:text-white shadow-xs',
  },
]

interface ModeTabsProps {
  active: AiTutorMode
  onChange: (mode: AiTutorMode) => void
}

/**
 * The four AI tools as a radio group (arrow keys move between them, screen readers announce the
 * choice), laid out as 3D cards. The antd button look is replaced through Tailwind classes, which
 * win over antd because antd's styles sit in a lower CSS layer.
 */
export function ModeTabs({ active, onChange }: ModeTabsProps) {
  return (
    <Radio.Group
      value={active}
      onChange={(event) => onChange(event.target.value as AiTutorMode)}
      aria-label="AI tool"
      className="grid w-full grid-cols-2 gap-2.5 lg:grid-cols-4"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.mode
        return (
          <Radio.Button
            key={tab.mode}
            value={tab.mode}
            className={cn(
              'h-auto rounded-2xl border-2 border-b-4 p-3 leading-normal transition-all duration-75 select-none before:hidden active:border-b-2 active:translate-y-[2px] sm:p-3.5',
              isActive
                ? tab.activeClass
                : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-700 dark:bg-[#1B272C] dark:border-[#2B3940] dark:border-b-[#202c32] dark:text-slate-300 dark:hover:bg-[#223238]',
            )}
          >
            <Flex
              component="span"
              align="center"
              gap={10}
              className="flex-col sm:flex-row sm:items-start"
            >
              <span className="text-2xl shrink-0">{tab.emoji}</span>
              <span className="block text-center sm:text-left min-w-0">
                <span className="block font-extrabold text-sm leading-tight">{tab.label}</span>
                <span
                  className={cn(
                    'block text-[11px] font-semibold mt-0.5 truncate',
                    isActive ? 'opacity-90' : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {tab.desc}
                </span>
              </span>
            </Flex>
          </Radio.Button>
        )
      })}
    </Radio.Group>
  )
}
