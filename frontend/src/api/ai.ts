import { apiFetch } from './client'
import type { Language } from '@/types/domain'

export function explainGrammar(languageCode: string, question: string): Promise<{ explanation: string }> {
  return apiFetch('/ai/grammar/explain', {
    method: 'POST',
    body: JSON.stringify({ languageCode, question }),
  })
}

export function correctSentence(
  languageCode: string,
  text: string,
): Promise<{ corrected: string; explanation: string }> {
  return apiFetch('/ai/sentence/correct', {
    method: 'POST',
    body: JSON.stringify({ languageCode, text }),
  })
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

export interface ConversationSummaryResult {
  conversationId: number
  summary: string
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
