import { Flowy, StudentAvatar } from '@/assets'
import { cn } from '@/lib/cn'

interface MessageBubbleProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'USER'

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 my-3 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#1B272C] border-2 border-b-3 border-slate-200 dark:border-[#2B3940] shadow-xs select-none">
          <Flowy size={25} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap break-words [overflow-wrap:anywhere] px-4 py-3 text-sm leading-relaxed transition-all select-text font-medium',
          isUser
            ? 'rounded-3xl rounded-br-xs bg-[#58CC02] border-2 border-b-4 border-[#46A302] text-white font-bold shadow-xs'
            : 'rounded-3xl rounded-bl-xs bg-white text-slate-800 border-2 border-b-4 border-slate-200 dark:bg-[#1B272C] dark:text-slate-100 dark:border-[#2B3940] shadow-xs',
        )}
      >
        {content}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] text-white shadow-xs select-none">
          <StudentAvatar size={24} />
        </div>
      )}
    </div>
  )
}
