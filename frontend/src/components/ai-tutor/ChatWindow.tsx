import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Flowy, IconSend } from '@/assets'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageBubble } from './MessageBubble'
import type { ConversationMessageItem } from '@/api/ai'

const QUICK_PROMPTS_BY_LANG: Record<string, string[]> = {
  en: [
    'Hi! What do you recommend from the menu? ☕',
    'Excuse me, how do I get to the nearest station? 🚆',
    'Let me introduce myself! Nice to meet you. 🤝',
  ],
  zh: [
    '你好！请问有什么好推荐的招牌菜吗？ 🥟',
    '请问，去最近的地铁站怎么走？ 🚆',
    '我来做个自我介绍吧！很高兴认识你。 🤝',
  ],
  ja: [
    'こんにちは！おすすめのメニューは何ですか？ 🍜',
    'すみません、駅への行き方を教えてください。 🚆',
    '自己紹介をさせてください！ 🤝',
  ],
}

interface ChatWindowProps {
  languageCode?: string
  messages: ConversationMessageItem[]
  streamingReply?: string
  onSend: (message: string) => void
  isSending: boolean
  onEnd: () => void
  isEnding: boolean
  ended: boolean
}

export function ChatWindow({
  languageCode = 'en',
  messages,
  streamingReply,
  onSend,
  isSending,
  onEnd,
  isEnding,
  ended,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('')
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
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

  function handleQuickPrompt(text: string) {
    if (isSending || ended) return
    onSend(text)
  }

  const quickPrompts = QUICK_PROMPTS_BY_LANG[languageCode] ?? QUICK_PROMPTS_BY_LANG.en

  const langGreeting =
    languageCode === 'zh'
      ? {
          title: '你好！准备好开始练习了吗？',
          desc: '我是你的AI多语言助教。随时用中文、英文或日文畅所欲言，或者点击下方开场白：',
          placeholder: '用中文输入你想说的话...',
        }
      : languageCode === 'ja'
        ? {
            title: 'Konnichiwa! Ready to practice?',
            desc: 'I am your AI language companion. Speak naturally in Japanese or tap an icebreaker below:',
            placeholder: 'Type your message in Japanese...',
          }
        : {
            title: 'Hello! Ready for a quick chat?',
            desc: 'I am your AI language coach. Speak naturally in English, Chinese, or Japanese, or tap an icebreaker below:',
            placeholder: 'Type your message in English...',
          }

  return (
    <div className="flex h-[38rem] flex-col gap-3 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4 sm:p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1.5">
        {messages.length === 0 && !streamingReply && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-6 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF5CC] border-2 border-b-4 border-amber-300 shadow-sm">
              <Flowy size={44} className="animate-bounce-playful" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {langGreeting.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {langGreeting.desc}
              </p>
            </div>
            {/* Quick Prompts */}
            <div className="flex flex-wrap justify-center gap-2.5 mt-2 max-w-xl">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-2xl border-2 border-b-4 border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-[#58CC02] hover:bg-[#D7FFB8]/40 hover:text-[#347800] active:border-b-2 active:translate-y-[2px] transition-all cursor-pointer dark:border-slate-700 dark:bg-[#131F24] dark:text-slate-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}

        {streamingReply && <MessageBubble role="ASSISTANT" content={streamingReply} />}

        {isSending && !streamingReply && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#58CC02] p-2 italic animate-pulse">
            <Flowy size={18} />
            <span>AI Coach is formulating a thoughtful reply...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2.5 pt-3 border-t-2 border-slate-100 dark:border-[#2B3940]"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={ended ? 'This session has concluded.' : langGreeting.placeholder}
          disabled={ended || isSending}
          className="flex-1 rounded-2xl border-2 text-sm bg-slate-50 dark:bg-[#131F24]"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={ended || isSending || !draft.trim()}
          className="gap-2 shrink-0 px-5"
        >
          <IconSend size={16} />
          <span>{isSending ? 'Sending...' : 'Send'}</span>
        </Button>
      </form>

      {!ended && messages.length > 0 && (
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirmEndOpen(true)}
            disabled={isEnding}
            className="text-xs"
          >
            {isEnding ? 'Analyzing session...' : '✨ End & review session'}
          </Button>
        </div>
      )}

      <ConfirmModal
        open={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          setConfirmEndOpen(false)
          onEnd()
        }}
        title="Kết thúc buổi luyện tập?"
        description="AI Coach sẽ phân tích toàn bộ hội thoại, tổng kết từ vựng, ngữ pháp và lập báo cáo đánh giá tiến độ cho bạn."
        confirmText="Kết thúc & Nhận đánh giá"
        cancelText="Tiếp tục trò chuyện"
        variant="primary"
        icon="mascot"
        isLoading={isEnding}
      />
    </div>
  )
}
