import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Drawer, Flex, Input, Tag } from 'antd'
import {
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  HistoryOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ChatWindow } from '@/components/ai-tutor/ChatWindow'
import { ConversationList } from '@/components/ai-tutor/ConversationList'
import { ConversationSummaryCard } from '@/components/ai-tutor/ConversationSummaryCard'
import { ModeTabs, type AiTutorMode } from '@/components/ai-tutor/ModeTabs'
import { Flowy } from '@/assets'
import {
  useConversation,
  useConversationList,
  useCorrectSentence,
  useEndConversation,
  useExplainGrammar,
  useGenerateExamples,
  useScenarios,
  useSendConversationMessage,
} from '@/hooks/useAiTutor'
import { useUiStore } from '@/stores/uiStore'
import { ApiError } from '@/api/client'
import { streamConversationMessage } from '@/api/ai'
import type { ConversationMessageItem, ConversationSummaryResult } from '@/api/ai'
import { cn } from '@/lib/cn'

function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  return (
    <Alert
      type="error"
      showIcon
      message={message}
      className="!rounded-2xl !border-2 !border-rose-200 !bg-rose-50 text-xs font-bold"
    />
  )
}

function AskTab({ languageCode }: { languageCode: string }) {
  const [question, setQuestion] = useState('')
  const explainGrammar = useExplainGrammar()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    explainGrammar.mutate({ languageCode, question: question.trim() })
  }

  const askPlaceholder =
    languageCode === 'zh'
      ? "例如：怎么正确区分 '的', '得' 和 '地'? 能举例说明吗？"
      : languageCode === 'ja'
        ? 'e.g. When should I use は (wa) versus が (ga)? Can you give me easy examples?'
        : "e.g. When should I use 'since' versus 'for'? Can you explain with everyday examples?"

  return (
    <Flex vertical gap={20} className="max-w-4xl animate-fade-in">
      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-xs"
        styles={{ body: { padding: '1.5rem' } }}
      >
        <Flex align="center" gap={12} className="mb-4">
          <Flex
            align="center"
            justify="center"
            className="h-11 w-11 rounded-2xl bg-[#FFF5CC] border-2 border-b-4 border-amber-300 text-2xl shadow-xs"
          >
            <BookOutlined className="text-amber-800" />
          </Flex>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Grammar Clinic &amp; Guide
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Clear, friendly explanations with authentic example sentences in your target language.
            </p>
          </div>
        </Flex>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input.TextArea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={askPlaceholder}
            className="!rounded-2xl !border-2 text-sm !bg-slate-50 dark:!bg-[#131F24]"
          />
          <Flex justify="flex-end">
            <Button
              type="primary"
              htmlType="submit"
              disabled={explainGrammar.isPending || !question.trim()}
              loading={explainGrammar.isPending}
              icon={<BookOutlined />}
              className="!rounded-2xl !bg-[#ffc800] hover:!bg-[#ffd226] !border-b-4 !border-[#e5a500] active:!border-b-2 active:!translate-y-[2px] !text-amber-950 !font-extrabold shadow-xs"
            >
              {explainGrammar.isPending ? 'Consulting Coach...' : 'Ask Question 📖'}
            </Button>
          </Flex>
        </form>
      </Card>

      <ErrorNotice error={explainGrammar.error} />

      {explainGrammar.data && (
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] animate-pop-in shadow-xs"
          styles={{ body: { padding: '1.5rem' } }}
        >
          <Flex align="center" gap={8} className="mb-3 text-[#58CC02]">
            <BulbOutlined className="text-xl" />
            <span className="text-sm font-black uppercase tracking-wider">
              AI Coach Explanation
            </span>
          </Flex>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
            {explainGrammar.data.explanation}
          </div>
        </Card>
      )}
    </Flex>
  )
}

function ExamplesTab({ languageCode }: { languageCode: string }) {
  const [word, setWord] = useState('')
  const generateExamples = useGenerateExamples()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!word.trim()) return
    generateExamples.mutate({ languageCode, word: word.trim() })
  }

  const placeholder =
    languageCode === 'zh'
      ? '例如：咖啡, 学习, 朋友...'
      : languageCode === 'ja'
        ? '例：食べる, 友達, 楽しい...'
        : 'e.g. wanderlust, serendipity, negotiate...'

  return (
    <Flex vertical gap={20} className="max-w-4xl animate-fade-in">
      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-xs"
        styles={{ body: { padding: '1.5rem' } }}
      >
        <Flex align="center" gap={12} className="mb-4">
          <Flex
            align="center"
            justify="center"
            className="h-11 w-11 rounded-2xl bg-purple-100 border-2 border-b-4 border-purple-300 text-2xl shadow-xs"
          >
            <ThunderboltOutlined className="text-purple-700" />
          </Flex>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Vocabulary Example Generator
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Generate real-world authentic sentences for any word or phrase in your target
              language.
            </p>
          </div>
        </Flex>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            size="large"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={placeholder}
            className="flex-1 !rounded-2xl !border-2 text-sm !bg-slate-50 dark:!bg-[#131F24]"
          />
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={generateExamples.isPending}
            disabled={generateExamples.isPending || !word.trim()}
            icon={<ThunderboltOutlined />}
            className="!rounded-2xl !bg-[#a855f7] hover:!bg-[#9333ea] !border-b-4 !border-[#7e22ce] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black shadow-xs shrink-0"
          >
            {generateExamples.isPending ? 'Generating…' : 'Generate Examples ✨'}
          </Button>
        </form>
      </Card>

      <ErrorNotice error={generateExamples.error} />

      {generateExamples.data && (
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] animate-pop-in shadow-xs"
          styles={{ body: { padding: '1.5rem' } }}
        >
          <Flex align="center" gap={8} className="mb-3 text-purple-600 dark:text-purple-400">
            <ThunderboltOutlined className="text-lg" />
            <span className="text-sm font-black uppercase tracking-wider">
              Example Sentences for &quot;{word}&quot;
            </span>
          </Flex>
          <Flex vertical gap={10}>
            {generateExamples.data.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-800 dark:border-[#2B3940] dark:bg-[#131F24] dark:text-slate-200 leading-relaxed"
              >
                {example}
              </div>
            ))}
          </Flex>
        </Card>
      )}
    </Flex>
  )
}

function CorrectTab({ languageCode }: { languageCode: string }) {
  const [text, setText] = useState('')
  const correctSentence = useCorrectSentence()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    correctSentence.mutate({ languageCode, text: text.trim() })
  }

  const correctPlaceholder =
    languageCode === 'zh'
      ? '输入你想检查的中文句子，例如：昨天我和朋友去吃中国菜...'
      : languageCode === 'ja'
        ? 'Type your sentence here, e.g. 私は寿司を食べます...'
        : 'Type your sentence here, e.g. Yesterday I go to cinema with my friend...'

  return (
    <Flex vertical gap={20} className="max-w-4xl animate-fade-in">
      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-xs"
        styles={{ body: { padding: '1.5rem' } }}
      >
        <Flex align="center" gap={12} className="mb-4">
          <Flex
            align="center"
            justify="center"
            className="h-11 w-11 rounded-2xl bg-[#DDF4FF] border-2 border-b-4 border-sky-300 text-2xl shadow-xs"
          >
            <MedicineBoxOutlined className="text-[#0284c7]" />
          </Flex>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Sentence Doctor</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Type any sentence in your target language to polish grammar, word choice, and native
              flow.
            </p>
          </div>
        </Flex>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input.TextArea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={correctPlaceholder}
            className="!rounded-2xl !border-2 text-sm !bg-slate-50 dark:!bg-[#131F24]"
          />
          <Flex justify="flex-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={correctSentence.isPending}
              disabled={correctSentence.isPending || !text.trim()}
              icon={<CheckCircleOutlined />}
              className="!rounded-2xl !bg-[#1cb0f6] hover:!bg-[#34bdff] !border-b-4 !border-[#1899d6] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black shadow-xs"
            >
              {correctSentence.isPending ? 'Diagnosing...' : 'Check Sentence 🩺'}
            </Button>
          </Flex>
        </form>
      </Card>

      <ErrorNotice error={correctSentence.error} />

      {correctSentence.data && (
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] flex flex-col gap-5 animate-pop-in shadow-xs"
          styles={{ body: { padding: '1.5rem' } }}
        >
          {/* Original sentence box */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#131F24]">
            <p className="text-xs font-bold text-slate-400 mb-1">Original Sentence</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-through">
              {text.trim()}
            </p>
          </div>

          {/* Corrected sentence box */}
          <div className="rounded-2xl border-2 border-b-4 border-emerald-300 bg-[#D7FFB8]/50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40">
            <Flex align="center" gap={8} className="text-[#347800] dark:text-[#79e32a] mb-1.5">
              <CheckOutlined />
              <p className="text-xs font-black uppercase tracking-wide">Natural Native Phrasing</p>
            </Flex>
            <p className="text-base font-black text-[#265900] dark:text-emerald-100">
              {correctSentence.data.corrected}
            </p>
          </div>

          {/* Explanation */}
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1.5">
              Why this was corrected
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {correctSentence.data.explanation}
            </p>
          </div>

          {correctSentence.data.suggestedCategory && (
            <Flex
              align="center"
              gap={8}
              className="pt-3 border-t-2 border-slate-100 dark:border-slate-800"
            >
              <span className="text-xs font-bold text-slate-400">Category:</span>
              <Tag color="purple" className="!rounded-md !font-bold">
                {correctSentence.data.suggestedCategory}
              </Tag>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                {correctSentence.data.suggestedTopic}
              </span>
            </Flex>
          )}
        </Card>
      )}
    </Flex>
  )
}

function ChatTab({ languageCode }: { languageCode: string }) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [scenario, setScenario] = useState('')
  const [messages, setMessages] = useState<ConversationMessageItem[]>([])
  const [streamingReply, setStreamingReply] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [ended, setEnded] = useState(false)
  const [summary, setSummary] = useState<ConversationSummaryResult | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: scenarios } = useScenarios(languageCode)
  const conversationList = useConversationList()
  const conversationDetail = useConversation(activeConversationId ?? undefined)
  const sendMessage = useSendConversationMessage()
  const endConversation = useEndConversation()

  const pastCount = conversationList.data?.length ?? 0

  useEffect(() => {
    if (conversationDetail.data) {
      setMessages(conversationDetail.data.messages)
      setEnded(Boolean(conversationDetail.data.endedAt))
    }
  }, [conversationDetail.data])

  function handleNew() {
    setActiveConversationId(null)
    setMessages([])
    setEnded(false)
    setSummary(null)
  }

  function handleSend(message: string) {
    const userTurn: ConversationMessageItem = {
      role: 'USER',
      content: message,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userTurn])

    if (activeConversationId === null) {
      sendMessage.mutate(
        { conversationId: null, languageCode, scenario: scenario || null, message },
        {
          onSuccess: (result) => {
            setActiveConversationId(result.conversationId)
            setMessages((prev) => [
              ...prev,
              { role: 'ASSISTANT', content: result.reply, createdAt: new Date().toISOString() },
            ])
          },
        },
      )
      return
    }

    setIsStreaming(true)
    setStreamingReply('')
    streamConversationMessage(activeConversationId, message, (delta) =>
      setStreamingReply((prev) => prev + delta),
    )
      .then(() => {
        setStreamingReply((finalReply) => {
          setMessages((prev) => [
            ...prev,
            { role: 'ASSISTANT', content: finalReply, createdAt: new Date().toISOString() },
          ])
          return ''
        })
      })
      .finally(() => setIsStreaming(false))
  }

  function handleEnd() {
    if (!activeConversationId) return
    endConversation.mutate(activeConversationId, {
      onSuccess: (result) => {
        setEnded(true)
        setSummary(result)
      },
    })
  }

  return (
    <Flex vertical gap={16} className="w-full animate-fade-in">
      {/* Top Action Bar & Status */}
      <Flex vertical justify="space-between" gap={12} className="sm:flex-row sm:items-center">
        {/* Left: New chat & active scenario info */}
        <Flex align="center" gap={8} wrap>
          <Button
            type="primary"
            size="middle"
            onClick={handleNew}
            icon={<PlusOutlined />}
            className="!rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-xs shadow-xs"
          >
            Đoạn chat mới
          </Button>

          {activeConversationId !== null ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200">
              <span className="text-slate-400 font-medium">Chủ đề:</span>
              <span className="font-extrabold text-[#58CC02]">
                {(conversationDetail.data?.scenario ?? scenario) || 'Trò chuyện tự do'}
              </span>
            </div>
          ) : scenario ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200">
              <span className="text-slate-400 font-medium">Đã chọn:</span>
              <span className="font-extrabold text-[#58CC02]">{scenario}</span>
              <button
                type="button"
                onClick={() => setScenario('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1"
                title="Bỏ chọn chủ đề"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>
          ) : null}
        </Flex>

        {/* Right: History Drawer Trigger */}
        <Flex align="center" gap={8}>
          <Button
            type="default"
            size="middle"
            onClick={() => setHistoryOpen(true)}
            icon={<HistoryOutlined />}
            className="!rounded-2xl !border-2 !border-b-4 !border-slate-200 !bg-white text-xs font-extrabold text-slate-700 hover:!bg-slate-50 dark:!border-[#2B3940] dark:!bg-[#1B272C] dark:!text-slate-200"
          >
            <span>Lịch sử hội thoại</span>
            {pastCount > 0 && (
              <Tag
                color="cyan"
                className="!rounded-full !font-black !text-[10px] !px-1.5 !py-0 !m-0 !ml-1"
              >
                {pastCount}
              </Tag>
            )}
          </Button>
        </Flex>
      </Flex>

      {/* Horizontal Scenario Pills Carousel */}
      {activeConversationId === null && (
        <Card
          className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-xs"
          styles={{ body: { padding: '0.875rem' } }}
        >
          <Flex align="center" gap={8} className="overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-1 pr-1">
              <ThunderboltOutlined className="text-amber-500" />
              <span>Kịch bản:</span>
            </span>
            <Button
              type={scenario === '' ? 'primary' : 'default'}
              onClick={() => setScenario('')}
              className={cn(
                '!rounded-2xl !text-xs !font-black shrink-0 !border-2 !border-b-4 transition-all',
                scenario === ''
                  ? '!bg-[#58cc02] hover:!bg-[#61e002] !border-[#46a302] !text-white'
                  : '!border-slate-200 !bg-slate-50 !text-slate-700 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-200',
              )}
            >
              ☕ Trò chuyện tự do
            </Button>
            {(scenarios ?? []).map((s) => (
              <Button
                key={s.code}
                type={scenario === s.label ? 'primary' : 'default'}
                onClick={() => setScenario(s.label)}
                className={cn(
                  '!rounded-2xl !text-xs !font-black shrink-0 !border-2 !border-b-4 transition-all',
                  scenario === s.label
                    ? '!bg-[#58cc02] hover:!bg-[#61e002] !border-[#46a302] !text-white'
                    : '!border-slate-200 !bg-slate-50 !text-slate-700 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-200',
                )}
              >
                {s.label}
              </Button>
            ))}
          </Flex>
        </Card>
      )}

      {/* Main Full-Width Chat Canvas */}
      <Flex vertical gap={16} className="min-w-0 w-full">
        <ErrorNotice error={sendMessage.error} />
        <ChatWindow
          languageCode={languageCode}
          messages={messages}
          streamingReply={streamingReply}
          onSend={handleSend}
          isSending={sendMessage.isPending || isStreaming}
          onEnd={handleEnd}
          isEnding={endConversation.isPending}
          ended={ended}
        />
        {ended && summary && <ConversationSummaryCard summary={summary} />}
      </Flex>

      {/* Ant Design Slide-over Conversation History Drawer */}
      <Drawer
        title={
          <Flex align="center" gap={10}>
            <Flex
              align="center"
              justify="center"
              className="h-9 w-9 rounded-2xl bg-sky-100 text-[#0284C7] dark:bg-sky-950 dark:text-sky-300"
            >
              <ClockCircleOutlined />
            </Flex>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Lịch Sử Hội Thoại
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                {pastCount} cuộc hội thoại đã lưu
              </p>
            </div>
          </Flex>
        }
        placement="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        className="dark:!bg-[#1A262C]"
      >
        <Flex vertical gap={16}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              handleNew()
              setHistoryOpen(false)
            }}
            className="w-full !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] !text-white !font-black !text-xs uppercase tracking-wide"
          >
            Bắt đầu hội thoại mới
          </Button>

          <ConversationList
            conversations={conversationList.data ?? []}
            activeId={activeConversationId}
            onSelect={(id) => {
              setActiveConversationId(id)
              setHistoryOpen(false)
            }}
            onNew={() => {
              handleNew()
              setHistoryOpen(false)
            }}
          />
        </Flex>
      </Drawer>
    </Flex>
  )
}

export function AiTutorPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const [mode, setMode] = useState<AiTutorMode>('chat')

  return (
    <Flex vertical gap={24}>
      {/* Playful Hero Header */}
      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-xs"
        styles={{ body: { padding: '1.5rem' } }}
      >
        <Flex vertical gap={16} className="sm:flex-row sm:items-center sm:justify-between">
          <Flex align="center" gap={16}>
            <Flex
              align="center"
              justify="center"
              className="h-14 w-14 rounded-3xl bg-white dark:bg-[#131F24] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-sm"
            >
              <Flowy size={42} className="animate-bounce-playful" />
            </Flex>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Language Practice Studio</span>
                <Tag color="success" className="!rounded-full !font-black !text-xs !px-2.5 !py-0.5">
                  EN • 中文 • 日本語
                </Tag>
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Practice everyday conversations, diagnose grammar nuances, and level up your
                fluency.
              </p>
            </div>
          </Flex>

          <div className="w-full sm:w-44 shrink-0">
            <LanguageSwitcher
              value={selectedLanguageCode || 'en'}
              onChange={setSelectedLanguageCode}
            />
          </div>
        </Flex>
      </Card>

      {/* Playful 3D Mode Switcher */}
      <ModeTabs active={mode} onChange={setMode} />

      {/* Active Tab View */}
      {mode === 'chat' && <ChatTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'correct' && <CorrectTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'ask' && <AskTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'examples' && <ExamplesTab languageCode={selectedLanguageCode || 'ja'} />}
    </Flex>
  )
}
