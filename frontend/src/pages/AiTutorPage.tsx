import { useEffect, useState, type FormEvent } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ChatWindow } from '@/components/ai-tutor/ChatWindow'
import { ConversationList } from '@/components/ai-tutor/ConversationList'
import { ConversationSummaryCard } from '@/components/ai-tutor/ConversationSummaryCard'
import { ModeTabs, type AiTutorMode } from '@/components/ai-tutor/ModeTabs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import {
  IconSparkles,
  IconCheck,
  IconCheckCircle,
  IconBookmark,
} from '@/components/ui/Icon'
import {
  useConversation,
  useConversationList,
  useCorrectSentence,
  useEndConversation,
  useExplainGrammar,
  useScenarios,
  useSendConversationMessage,
} from '@/hooks/useAiTutor'
import { useCreateMistake } from '@/hooks/useMistakes'
import { useUiStore } from '@/stores/uiStore'
import { ApiError } from '@/api/client'
import { streamConversationMessage } from '@/api/ai'
import type { ConversationMessageItem, ConversationSummaryResult } from '@/api/ai'

function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  const message =
    error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  return (
    <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
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

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <Card className="flex flex-col gap-4 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ask Any Grammar or Usage Question
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Get instant, in-depth explanations with real-world examples in your target language.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is the difference between 'I have done' and 'I did'? When should I use each?"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={explainGrammar.isPending || !question.trim()}
              className="gap-2 self-end font-semibold"
            >
              <IconSparkles size={16} />
              <span>{explainGrammar.isPending ? 'Thinking...' : 'Ask AI Tutor'}</span>
            </Button>
          </div>
        </form>
      </Card>

      <ErrorNotice error={explainGrammar.error} />

      {explainGrammar.data && (
        <Card className="border-slate-200 bg-white p-6 shadow-xs dark:border-[#2C2C2C] dark:bg-[#1E1E1E] animate-fade-in">
          <div className="flex items-center gap-2 mb-3 text-[#365314] dark:text-[#B6F23A]">
            <IconSparkles size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Explanation</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {explainGrammar.data.explanation}
          </p>
        </Card>
      )}
    </div>
  )
}

function CorrectTab({ languageCode }: { languageCode: string }) {
  const [text, setText] = useState('')
  const correctSentence = useCorrectSentence()
  const createMistake = useCreateMistake()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    createMistake.reset()
    correctSentence.mutate({ languageCode, text: text.trim() })
  }

  function handleSaveToMistakeBook() {
    if (!correctSentence.data || !correctSentence.data.suggestedCategory) return
    createMistake.mutate({
      languageCode,
      category: correctSentence.data.suggestedCategory,
      topic: correctSentence.data.suggestedTopic,
      original: text.trim(),
      corrected: correctSentence.data.corrected,
      explanation: correctSentence.data.explanation,
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <Card className="flex flex-col gap-4 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Sentence Checker & Error Correction
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Type any sentence you wrote to inspect grammar, vocabulary nuances, and natural phrasing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a sentence you are not sure about..."
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={correctSentence.isPending || !text.trim()}
              className="gap-2 font-semibold"
            >
              <IconCheckCircle size={16} />
              <span>{correctSentence.isPending ? 'Checking...' : 'Check Sentence'}</span>
            </Button>
          </div>
        </form>
      </Card>

      <ErrorNotice error={correctSentence.error} />

      {correctSentence.data && (
        <Card className="flex flex-col gap-5 border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-fade-in">
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Your Input
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 line-through">
              {text.trim()}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-1">
              <IconCheck size={16} />
              <p className="text-xs font-bold uppercase tracking-wider">Corrected Phrasing</p>
            </div>
            <p className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              {correctSentence.data.corrected}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Why this change was made
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {correctSentence.data.explanation}
            </p>
          </div>

          {correctSentence.data.suggestedCategory && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Category:</span>
                <Badge variant="purple">{correctSentence.data.suggestedCategory}</Badge>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {correctSentence.data.suggestedTopic}
                </span>
              </div>
              {createMistake.isSuccess ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <IconCheck size={15} /> Saved to Mistake Book
                </span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveToMistakeBook}
                  disabled={createMistake.isPending}
                  className="gap-1.5 font-semibold"
                >
                  <IconBookmark size={14} />
                  <span>{createMistake.isPending ? 'Saving...' : 'Save to Mistake Book'}</span>
                </Button>
              )}
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

  const { data: scenarios } = useScenarios(languageCode)
  const conversationList = useConversationList()
  const conversationDetail = useConversation(activeConversationId ?? undefined)
  const sendMessage = useSendConversationMessage()
  const endConversation = useEndConversation()

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
    <div className="grid gap-5 md:grid-cols-[17rem_1fr]">
      <div className="flex flex-col gap-3">
        {activeConversationId === null && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pick Scenario
            </label>
            <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="">Daily conversation</option>
              {(scenarios ?? []).map((s) => (
                <option key={s.code} value={s.label}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        )}
        <ConversationList
          conversations={conversationList.data ?? []}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={handleNew}
        />
      </div>

      <div className="flex flex-col gap-4">
        <ErrorNotice error={sendMessage.error} />
        <ChatWindow
          messages={messages}
          streamingReply={streamingReply}
          onSend={handleSend}
          isSending={sendMessage.isPending || isStreaming}
          onEnd={handleEnd}
          isEnding={endConversation.isPending}
          ended={ended}
        />
        {ended && summary && (
          <ConversationSummaryCard summary={summary} languageCode={languageCode} />
        )}
      </div>
    </div>
  )
}

export function AiTutorPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const [mode, setMode] = useState<AiTutorMode>('ask')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>AI Language Tutor</span>
            <Badge variant="primary" className="text-xs font-bold">
              Powered by AI
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ask complex grammar doubts, correct phrasing, or practice interactive roleplay scenarios.
          </p>
        </div>
        <div className="w-full sm:w-44">
          <LanguageSwitcher
            value={selectedLanguageCode || 'en'}
            onChange={setSelectedLanguageCode}
          />
        </div>
      </div>

      <ModeTabs active={mode} onChange={setMode} />

      {mode === 'ask' && <AskTab languageCode={selectedLanguageCode || 'en'} />}
      {mode === 'correct' && <CorrectTab languageCode={selectedLanguageCode || 'en'} />}
      {mode === 'chat' && <ChatTab languageCode={selectedLanguageCode || 'en'} />}
    </div>
  )
}
