import { cn } from '@/lib/cn'
import type { ConversationListItem } from '@/api/ai'

interface ConversationListProps {
  conversations: ConversationListItem[]
  activeId: number | null
  onSelect: (id: number) => void
  onNew: () => void
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: ConversationListProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onNew}
        className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
      >
        + New conversation
      </button>
      <ul className="flex flex-col gap-1">
        {conversations.map((conversation) => (
          <li key={conversation.conversationId}>
            <button
              type="button"
              onClick={() => onSelect(conversation.conversationId)}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left text-sm',
                activeId === conversation.conversationId
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
              )}
            >
              <div className="font-medium">
                {conversation.language?.name ?? 'Unknown'} · {conversation.scenario ?? 'Chat'}
              </div>
              <div className="truncate text-xs opacity-70">
                {new Date(conversation.startedAt).toLocaleString()}
              </div>
            </button>
          </li>
        ))}
        {conversations.length === 0 && (
          <li className="px-3 py-2 text-sm text-neutral-400">No conversations yet.</li>
        )}
      </ul>
    </div>
  )
}
