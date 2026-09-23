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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDFBD8] text-[#365314] dark:bg-[#365314]/50 dark:text-[#B6F23A]">
          <IconBot size={15} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] px-4 py-2.5 text-sm leading-relaxed shadow-xs transition-all',
          isUser
            ? 'rounded-2xl rounded-br-xs bg-[#B6F23A] text-[#1A1A1A] font-medium'
            : 'rounded-2xl rounded-bl-xs bg-white text-slate-800 border border-slate-200 dark:bg-[#1E1E1E] dark:text-slate-100 dark:border-[#333333]',
        )}
      >
        {content}
      </div>
    </div>
  )
}
