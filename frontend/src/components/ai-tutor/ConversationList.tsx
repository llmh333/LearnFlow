import { IconPlus, IconBot } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { ConversationListItem } from '@/api/ai'

interface ConversationListProps {
  conversations: ConversationListItem[]
  activeId: number | null
  onSelect: (id: number) => void
  onNew: () => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: ConversationListProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onNew}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100/70 hover:border-indigo-400 transition-all dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70 cursor-pointer"
      >
        <IconPlus size={15} />
        <span>New conversation</span>
      </button>

      <ul className="flex flex-col gap-1.5 max-h-[26rem] overflow-y-auto pr-1">
        {conversations.map((conversation) => {
          const isActive = activeId === conversation.conversationId
          return (
            <li key={conversation.conversationId}>
              <button
                type="button"
                onClick={() => onSelect(conversation.conversationId)}
                className={cn(
                  'w-full rounded-xl px-3 py-2.5 text-left text-xs transition-all duration-150 cursor-pointer border',
                  isActive
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs dark:bg-indigo-600'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800',
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold truncate">
                    {conversation.scenario ?? 'General Chat'}
                  </span>
                  <Badge
                    variant={isActive ? 'outline' : 'default'}
                    className={cn(
                      'text-[10px] py-0 px-1.5',
                      isActive ? 'border-white/40 text-white' : '',
                    )}
                  >
                    {conversation.language?.code.toUpperCase() ?? 'EN'}
                  </Badge>
                </div>
                <div
                  className={cn(
                    'truncate text-[11px] font-medium',
                    isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  {new Date(conversation.startedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </button>
            </li>
          )
        })}

        {conversations.length === 0 && (
          <li className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
            <IconBot size={24} className="text-slate-300 dark:text-slate-600 mb-1" />
            <span>No previous chats.</span>
          </li>
        )}
      </ul>
    </div>
  )
}
