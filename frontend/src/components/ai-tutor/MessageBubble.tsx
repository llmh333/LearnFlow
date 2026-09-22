import { cn } from '@/lib/cn'

interface MessageBubbleProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'USER'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        )}
      >
        {content}
      </div>
    </div>
  )
}
