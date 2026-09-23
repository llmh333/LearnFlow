import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageBubble } from './MessageBubble'
import type { ConversationMessageItem } from '@/api/ai'

interface ChatWindowProps {
  messages: ConversationMessageItem[]
  /** In-progress assistant reply being streamed in, shown as an extra trailing bubble. */
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
    <div className="flex h-[28rem] flex-col gap-3">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}
        {streamingReply && <MessageBubble role="ASSISTANT" content={streamingReply} />}
        {messages.length === 0 && !streamingReply && (
          <p className="text-sm text-neutral-400">Say hello to start practicing!</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message..."
          disabled={ended || isSending}
        />
        <Button type="submit" disabled={ended || isSending || !draft.trim()}>
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </form>

      {!ended && (
        <Button
          variant="secondary"
          onClick={onEnd}
          disabled={isEnding || messages.length === 0}
        >
          {isEnding ? 'Ending...' : 'End conversation'}
        </Button>
      )}
    </div>
  )
}
