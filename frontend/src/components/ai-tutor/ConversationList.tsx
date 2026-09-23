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
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#93D620] bg-[#EDFBD8]/60 px-3.5 py-2.5 text-xs font-bold text-[#365314] hover:bg-[#EDFBD8] transition-all dark:border-[#365314] dark:bg-[#1E2B11] dark:text-[#B6F23A] cursor-pointer"
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
                    ? 'border-[#365314] bg-[#365314] text-white shadow-xs dark:border-[#B6F23A] dark:bg-[#B6F23A] dark:text-[#1A1A1A]'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-[#2C2C2C] dark:bg-[#1E1E1E] dark:text-slate-200 dark:hover:bg-[#252525]',
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
                      isActive ? 'border-white/40 text-white dark:border-black/30 dark:text-[#1A1A1A]' : '',
                    )}
                  >
                    {conversation.language?.code.toUpperCase() ?? 'EN'}
                  </Badge>
                </div>
                <div
                  className={cn(
                    'truncate text-[11px] font-medium',
                    isActive ? 'text-[#EDFBD8] dark:text-[#1A1A1A]/80' : 'text-slate-500 dark:text-slate-400',
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
