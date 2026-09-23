import { apiFetch, ApiError } from './client'
import { useAuthStore } from '@/stores/authStore'
import type { Language } from '@/types/domain'

export function explainGrammar(languageCode: string, question: string): Promise<{ explanation: string }> {
  return apiFetch('/ai/grammar/explain', {
    method: 'POST',
    body: JSON.stringify({ languageCode, question }),
  })
}

export interface SentenceCorrectionResult {
  corrected: string
  explanation: string
  suggestedCategory: string | null
  suggestedTopic: string | null
}

export function correctSentence(languageCode: string, text: string): Promise<SentenceCorrectionResult> {
  return apiFetch('/ai/sentence/correct', {
    method: 'POST',
    body: JSON.stringify({ languageCode, text }),
  })
}

export interface Scenario {
  code: string
  label: string
}

export function fetchScenarios(languageCode: string): Promise<Scenario[]> {
  return apiFetch(`/ai/scenarios?language=${languageCode}`)
}

export interface ConversationMessageResult {
  conversationId: number
  reply: string
}

export function sendConversationMessage(
  conversationId: number | null,
  languageCode: string,
  scenario: string | null,
  message: string,
): Promise<ConversationMessageResult> {
  const path = conversationId
    ? `/ai/conversation/${conversationId}/message`
    : '/ai/conversation/message'
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify({ languageCode, scenario, message }),
  })
}

/**
 * Consumes the SSE stream manually via fetch()+ReadableStream instead of native EventSource,
 * because EventSource can't send an Authorization header and our auth is Bearer-token-based.
 */
export async function streamConversationMessage(
  conversationId: number,
  message: string,
  onDelta: (delta: string) => void,
): Promise<void> {
  const token = useAuthStore.getState().token
  const params = new URLSearchParams({ message })
  const response = await fetch(`/api/ai/conversation/${conversationId}/stream?${params.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok || !response.body) {
    throw new ApiError(response.status, 'Failed to start streaming reply')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data:')) {
        onDelta(line.slice(5).trimStart())
      }
    }
  }
}

export interface PushedMistake {
  id: number
  category: string | null
  topic: string | null
  original: string
  corrected: string
  timesRepeated: number
}

export interface SuggestedVocabulary {
  word: string
  meaningVietnamese: string
}

export interface ConversationSummaryResult {
  conversationId: number
  overview: string
  pushedMistakes: PushedMistake[]
  suggestedVocabulary: SuggestedVocabulary[]
  betterExpressions: string[]
  grammarProblems: string[]
  endedAt: string
}

export function endConversation(conversationId: number): Promise<ConversationSummaryResult> {
  return apiFetch(`/ai/conversation/${conversationId}/end`, { method: 'POST' })
}

export interface ConversationListItem {
  conversationId: number
  language: Language | null
  scenario: string | null
  startedAt: string
  endedAt: string | null
  summary: string | null
}

export function listConversations(): Promise<ConversationListItem[]> {
  return apiFetch('/ai/conversations')
}

export interface ConversationMessageItem {
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}

export interface ConversationDetail extends ConversationListItem {
  messages: ConversationMessageItem[]
}

export function fetchConversation(id: number): Promise<ConversationDetail> {
  return apiFetch(`/ai/conversations/${id}`)
}
