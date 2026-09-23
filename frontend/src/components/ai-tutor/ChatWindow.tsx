import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IconSend, IconSparkles } from '@/components/ui/Icon'
import { MessageBubble } from './MessageBubble'
import type { ConversationMessageItem } from '@/api/ai'

interface ChatWindowProps {
  messages: ConversationMessageItem[]
  streamingReply?: string
  onSend: (message: string) => void
  isSending: boolean
  onEnd: () => void
  isEnding: boolean
  ended: boolean
}

export function ChatWindow({
  messages,
  streamingReply,
  onSend,
  isSending,
  onEnd,
  isEnding,
  ended,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingReply])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || isSending || ended) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className="flex h-[32rem] flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-900/50 shadow-xs">
      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {messages.length === 0 && !streamingReply && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <IconSparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                AI Conversation Partner
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Practice realistic dialogues. Say hello or introduce yourself to start!
              </p>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}
        {streamingReply && <MessageBubble role="ASSISTANT" content={streamingReply} />}
        {isSending && !streamingReply && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 italic animate-pulse">
            AI is formulating a reply...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={ended ? 'This conversation has ended.' : 'Type your message in target language...'}
          disabled={ended || isSending}
          className="flex-1 bg-white dark:bg-slate-900"
        />
        <Button
          type="submit"
          disabled={ended || isSending || !draft.trim()}
          className="gap-1.5 shrink-0 px-4"
        >
          <IconSend size={15} />
          <span>{isSending ? 'Sending...' : 'Send'}</span>
        </Button>
      </form>

      {!ended && messages.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnd}
            disabled={isEnding}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {isEnding ? 'Generating summary...' : 'End & analyze conversation'}
          </Button>
        </div>
      )}
    </div>
  )
}
