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
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  return <p className="text-sm text-red-600">{message}</p>
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
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What's the difference between 'I have done' and 'I did'?"
        />
        <Button type="submit" disabled={explainGrammar.isPending || !question.trim()}>
          {explainGrammar.isPending ? 'Thinking...' : 'Ask'}
        </Button>
      </form>
      <ErrorNotice error={explainGrammar.error} />
      {explainGrammar.data && (
        <Card>
          <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
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
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence you're not sure about..."
        />
        <Button type="submit" disabled={correctSentence.isPending || !text.trim()}>
          {correctSentence.isPending ? 'Checking...' : 'Correct'}
        </Button>
      </form>
      <ErrorNotice error={correctSentence.error} />
      {correctSentence.data && (
        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400">Correct</p>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {correctSentence.data.corrected}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400">Reason</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {correctSentence.data.explanation}
            </p>
          </div>
          {correctSentence.data.suggestedCategory && (
            <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <span className="text-xs text-neutral-500">
                Mistake type: {correctSentence.data.suggestedCategory} ·{' '}
                {correctSentence.data.suggestedTopic}
              </span>
              {createMistake.isSuccess ? (
                <span className="text-xs text-neutral-500">Saved ✓</span>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveToMistakeBook}
                  disabled={createMistake.isPending}
                >
                  {createMistake.isPending ? 'Saving...' : 'Save to Mistake Book'}
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
      // First message of a new conversation: use the non-streaming endpoint so we get the new
      // conversation's id back in the response.
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
    <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
      <div className="flex flex-col gap-3">
        {activeConversationId === null && (
          <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="">Scenario: daily conversation</option>
            {(scenarios ?? []).map((s) => (
              <option key={s.code} value={s.label}>
                {s.label}
              </option>
            ))}
          </Select>
        )}
        <ConversationList
          conversations={conversationList.data ?? []}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onNew={handleNew}
        />
      </div>
      <div className="flex flex-col gap-3">
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
        {ended && summary && <ConversationSummaryCard summary={summary} languageCode={languageCode} />}
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">AI Tutor</h1>
        <div className="w-40">
          <LanguageSwitcher value={selectedLanguageCode || 'en'} onChange={setSelectedLanguageCode} />
        </div>
      </div>

      <ModeTabs active={mode} onChange={setMode} />

      {mode === 'ask' && <AskTab languageCode={selectedLanguageCode || 'en'} />}
      {mode === 'correct' && <CorrectTab languageCode={selectedLanguageCode || 'en'} />}
      {mode === 'chat' && <ChatTab languageCode={selectedLanguageCode || 'en'} />}
    </div>
  )
}
