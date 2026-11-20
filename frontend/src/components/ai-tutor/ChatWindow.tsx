import { useEffect, useRef, useState } from 'react'
import { Button, Flex, Form, Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { Flowy } from '@/assets'
import { ConfirmModal } from '@/components/common/ConfirmModal'
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
  const [form] = Form.useForm<{ draft: string }>()
  const draft: string = Form.useWatch('draft', form) ?? ''
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingReply])

  function handleFinish(values: { draft?: string }) {
    const text = values.draft?.trim()
    if (!text || isSending || ended) return
    onSend(text)
    form.resetFields()
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
    <Flex
      vertical
      gap={12}
      className="h-[38rem] rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4 sm:p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs"
    >
      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1.5">
        {messages.length === 0 && !streamingReply && (
          <Flex
            vertical
            align="center"
            justify="center"
            gap={16}
            className="h-full text-center p-6 animate-fade-in"
          >
            <Flex
              align="center"
              justify="center"
              className="h-16 w-16 rounded-3xl bg-[#FFF5CC] border-2 border-b-4 border-amber-300 shadow-sm"
            >
              <Flowy size={44} className="animate-bounce-playful" />
            </Flex>
            <div className="max-w-md">
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {langGreeting.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {langGreeting.desc}
              </p>
            </div>
            {/* Quick Prompts */}
            <Flex wrap justify="center" gap={10} className="mt-2 max-w-xl">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="default"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="!rounded-2xl !border-2 !border-b-4 !border-slate-200 !bg-slate-50 px-4 !py-2 !h-auto text-xs font-bold text-slate-700 hover:!border-[#58CC02] hover:!bg-[#D7FFB8]/40 hover:!text-[#347800] active:!border-b-2 active:!translate-y-[2px] transition-all cursor-pointer dark:!border-slate-700 dark:!bg-[#131F24] dark:!text-slate-300"
                >
                  {prompt}
                </Button>
              ))}
            </Flex>
          </Flex>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}

        {streamingReply && <MessageBubble role="ASSISTANT" content={streamingReply} />}

        {isSending && !streamingReply && (
          <Flex
            align="center"
            gap={8}
            className="text-xs font-bold text-[#58CC02] p-2 italic animate-pulse"
          >
            <Flowy size={18} />
            <span>AI Coach is formulating a thoughtful reply...</span>
          </Flex>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <Form
        form={form}
        onFinish={handleFinish}
        className="flex gap-2.5 pt-3 border-t-2 border-slate-100 dark:border-[#2B3940]"
      >
        <Form.Item name="draft" noStyle>
          <Input
            size="large"
            placeholder={ended ? 'This session has concluded.' : langGreeting.placeholder}
            disabled={ended || isSending}
            className="flex-1 !rounded-2xl !border-2 text-sm !bg-slate-50 dark:!bg-[#131F24]"
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          icon={<SendOutlined />}
          loading={isSending}
          disabled={ended || isSending || !draft.trim()}
          className="shrink-0 px-5 !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black"
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </Form>

      {!ended && messages.length > 0 && (
        <Flex justify="flex-end" className="pt-1">
          <Button
            type="default"
            size="small"
            onClick={() => setConfirmEndOpen(true)}
            disabled={isEnding}
            className="!rounded-xl !border-2 !border-slate-200 text-xs font-bold text-slate-600 dark:!border-slate-700 dark:text-slate-300"
          >
            {isEnding ? 'Analyzing session...' : '✨ End & review session'}
          </Button>
        </Flex>
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
    </Flex>
  )
}
