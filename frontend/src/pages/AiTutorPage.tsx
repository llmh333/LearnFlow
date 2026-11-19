import { useEffect, useState, type FormEvent } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ChatWindow } from '@/components/ai-tutor/ChatWindow'
import { ConversationList } from '@/components/ai-tutor/ConversationList'
import { ConversationSummaryCard } from '@/components/ai-tutor/ConversationSummaryCard'
import { ModeTabs, type AiTutorMode } from '@/components/ai-tutor/ModeTabs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Flowy,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconPlus,
  IconSparkles,
  IconX,
} from '@/assets'
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
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
      {message}
    </div>
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
    <div className="flex flex-col gap-5 max-w-4xl animate-fade-in">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF5CC] border-2 border-b-4 border-amber-300 text-2xl shadow-xs">
            📖
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Grammar Clinic &amp; Guide
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Clear, friendly explanations with authentic example sentences in your target language.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <Textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={askPlaceholder}
            className="rounded-2xl border-2 text-sm bg-slate-50 dark:bg-[#131F24]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="yellow"
              disabled={explainGrammar.isPending || !question.trim()}
              className="gap-2"
            >
              <span>{explainGrammar.isPending ? 'Consulting Coach...' : 'Ask Question 📖'}</span>
            </Button>
          </div>
        </form>
      </Card>

      <ErrorNotice error={explainGrammar.error} />

      {explainGrammar.data && (
        <Card className="animate-pop-in">
          <div className="flex items-center gap-2 mb-3 text-[#58CC02]">
            <span className="text-2xl">💡</span>
            <span className="text-sm font-black uppercase tracking-wider">
              AI Coach Explanation
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
            {explainGrammar.data.explanation}
          </div>
        </Card>
      )}
    </div>
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
    <div className="flex flex-col gap-5 max-w-4xl animate-fade-in">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 border-2 border-b-4 border-purple-300 text-2xl shadow-xs">
            ✨
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Vocabulary Example Generator
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Generate real-world authentic sentences for any word or phrase in your target
              language.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-2xl border-2 text-sm bg-slate-50 dark:bg-[#131F24]"
          />
          <Button
            type="submit"
            variant="inverted"
            disabled={generateExamples.isPending || !word.trim()}
            className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 border-purple-800 text-white"
          >
            <span>{generateExamples.isPending ? 'Generating…' : 'Generate Examples ✨'}</span>
          </Button>
        </form>
      </Card>

      <ErrorNotice error={generateExamples.error} />

      {generateExamples.data && (
        <Card className="animate-pop-in">
          <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
            <span className="text-2xl">📝</span>
            <span className="text-sm font-black uppercase tracking-wider">
              Example Sentences for &quot;{word}&quot;
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {generateExamples.data.examples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-800 dark:border-[#2B3940] dark:bg-[#131F24] dark:text-slate-200 leading-relaxed"
              >
                {example}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
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
    <div className="flex flex-col gap-5 max-w-4xl animate-fade-in">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDF4FF] border-2 border-b-4 border-sky-300 text-2xl shadow-xs">
            🩺
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Sentence Doctor</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Type any sentence in your target language to polish grammar, word choice, and native
              flow.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <Textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={correctPlaceholder}
            className="rounded-2xl border-2 text-sm bg-slate-50 dark:bg-[#131F24]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="sky"
              disabled={correctSentence.isPending || !text.trim()}
              className="gap-2"
            >
              <IconCheckCircle size={16} />
              <span>{correctSentence.isPending ? 'Diagnosing...' : 'Check Sentence 🩺'}</span>
            </Button>
          </div>
        </form>
      </Card>

      <ErrorNotice error={correctSentence.error} />

      {correctSentence.data && (
        <Card className="flex flex-col gap-5 animate-pop-in">
          {/* Original sentence box */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#131F24]">
            <p className="text-xs font-bold text-slate-400 mb-1">Original Sentence</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-through">
              {text.trim()}
            </p>
          </div>

          {/* Corrected sentence box */}
          <div className="rounded-2xl border-2 border-b-4 border-emerald-300 bg-[#D7FFB8]/50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2 text-[#347800] dark:text-[#79e32a] mb-1.5">
              <IconCheck size={18} />
              <p className="text-xs font-black uppercase tracking-wide">Natural Native Phrasing</p>
            </div>
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
            <div className="flex items-center gap-2 pt-3 border-t-2 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">Category:</span>
              <Badge variant="purple">{correctSentence.data.suggestedCategory}</Badge>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                {correctSentence.data.suggestedTopic}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
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
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      {/* Top Action Bar & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: New chat & active scenario info */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 font-black text-xs"
          >
            <IconPlus size={15} />
            <span>Đoạn chat mới</span>
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
                <IconX size={14} />
              </button>
            </div>
          ) : null}
        </div>

        {/* Right: History Drawer Trigger */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="gap-2 text-xs font-extrabold"
          >
            <IconClock size={15} />
            <span>Lịch sử hội thoại</span>
            {pastCount > 0 && (
              <span className="rounded-full bg-[#1CB0F6] px-2 py-0.5 text-[10px] font-black text-white">
                {pastCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Horizontal Scenario Pills Carousel (1-click scenario picking) */}
      {activeConversationId === null && (
        <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-3.5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-1 pr-1">
              <IconSparkles size={14} className="text-[#FF9600]" />
              <span>Kịch bản:</span>
            </span>
            <button
              type="button"
              onClick={() => setScenario('')}
              className={cn(
                'rounded-2xl px-3.5 py-1.5 text-xs font-black transition-all border-2 shrink-0 cursor-pointer border-b-4 active:border-b-2 active:translate-y-[2px]',
                scenario === ''
                  ? 'border-[#46A302] bg-[#58CC02] text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
              )}
            >
              ☕ Trò chuyện tự do
            </button>
            {(scenarios ?? []).map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setScenario(s.label)}
                className={cn(
                  'rounded-2xl px-3.5 py-1.5 text-xs font-black transition-all border-2 shrink-0 cursor-pointer border-b-4 active:border-b-2 active:translate-y-[2px]',
                  scenario === s.label
                    ? 'border-[#46A302] bg-[#58CC02] text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Full-Width Chat Canvas */}
      <div className="flex flex-col gap-4 min-w-0 w-full">
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
      </div>

      {/* Slide-over Conversation History Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm sm:max-w-md bg-white dark:bg-[#1A262C] shadow-2xl p-6 flex flex-col gap-4 animate-scale-in border-l-2 border-slate-200 dark:border-[#2B3940]">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-[#0284C7] dark:bg-sky-950 dark:text-sky-300">
                    <IconClock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Lịch Sử Hội Thoại
                    </h3>
                    <p className="text-[11px] text-slate-400">{pastCount} cuộc hội thoại đã lưu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Conversations List inside drawer */}
              <div className="flex-1 overflow-y-auto pr-1">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AiTutorPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const [mode, setMode] = useState<AiTutorMode>('chat')

  return (
    <div className="flex flex-col gap-6">
      {/* Playful Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-6 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white dark:bg-[#131F24] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-sm">
            <Flowy size={42} className="animate-bounce-playful" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Language Practice Studio</span>
              <Badge variant="primary" className="text-xs">
                EN • 中文 • 日本語
              </Badge>
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Practice everyday conversations, diagnose grammar nuances, and level up your fluency.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <LanguageSwitcher
            value={selectedLanguageCode || 'en'}
            onChange={setSelectedLanguageCode}
          />
        </div>
      </div>

      {/* Playful 3D Mode Switcher */}
      <ModeTabs active={mode} onChange={setMode} />

      {/* Active Tab View */}
      {mode === 'chat' && <ChatTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'correct' && <CorrectTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'ask' && <AskTab languageCode={selectedLanguageCode || 'ja'} />}
      {mode === 'examples' && <ExamplesTab languageCode={selectedLanguageCode || 'ja'} />}
    </div>
  )
}
