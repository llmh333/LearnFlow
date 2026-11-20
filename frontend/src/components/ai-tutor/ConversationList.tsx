import { Flex, Tag } from 'antd'
import { IconPlus, IconBot } from '@/assets'
import { Button } from '@/components/ui/Button'
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
    <Flex vertical gap={12}>
      <Button type="button" variant="primary" onClick={onNew} className="w-full gap-2 py-3">
        <IconPlus size={16} />
        <span>Start New Chat</span>
      </Button>

      <ul className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto pr-1">
        {conversations.map((conversation) => {
          const isActive = activeId === conversation.conversationId
          return (
            <li key={conversation.conversationId}>
              <button
                type="button"
                onClick={() => onSelect(conversation.conversationId)}
                className={cn(
                  'w-full rounded-2xl p-3 text-left transition-all duration-75 cursor-pointer border-2 border-b-4 active:border-b-2 active:translate-y-[2px]',
                  isActive
                    ? 'border-[#1899D6] bg-[#1CB0F6] text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 dark:hover:bg-[#223238]',
                )}
              >
                <Flex align="center" justify="space-between" gap={4} className="mb-1.5">
                  <span className="font-extrabold text-xs truncate">
                    {conversation.scenario ?? 'General Practice'}
                  </span>
                  <Tag
                    className={cn(
                      'm-0 rounded-full border-2 px-2 text-[10px] font-bold',
                      isActive && 'border-white/50 bg-transparent text-white',
                    )}
                  >
                    {conversation.language?.code.toUpperCase() ?? 'JA'}
                  </Tag>
                </Flex>
                <div
                  className={cn(
                    'truncate text-[11px] font-bold',
                    isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500',
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
            <span>No previous chats yet.</span>
          </li>
        )}
      </ul>
    </Flex>
  )
}
