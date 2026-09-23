import { IconBot } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

interface MessageBubbleProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'USER'

  return (
    <div className={cn('flex items-end gap-2.5 my-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
          <IconBot size={15} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed shadow-xs transition-all',
          isUser
            ? 'rounded-2xl rounded-br-xs bg-indigo-600 text-white font-medium shadow-indigo-600/10'
            : 'rounded-2xl rounded-bl-xs bg-white text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
        )}
      >
        {content}
      </div>
    </div>
  )
}
