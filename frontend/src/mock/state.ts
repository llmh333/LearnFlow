import { DEFAULT_MOCK_PROFILE } from './data/account'
import { MOCK_INITIAL_CONVERSATIONS } from './data/ai'
import { MOCK_USER } from './data/auth'
import type {
  ConversationDetail,
  ConversationMessageItem,
  ConversationSummaryResult,
} from '@/api/ai'
import type { Profile, ProfileUpdate, User } from '@/types/domain'

const MOCK_FLAG_KEY = 'learnflow_mock_mode'
const MOCK_PROFILE_KEY = 'learnflow_mock_profile'
const MOCK_CONVOS_KEY = 'learnflow_mock_conversations'

export function isMockMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(MOCK_FLAG_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
  } catch {
    // ignore
  }
  return import.meta.env.VITE_USE_MOCK === 'true'
}

export function setMockMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MOCK_FLAG_KEY, enabled ? 'true' : 'false')
  } catch {
    // ignore local storage errors
  }
}

let inMemoryProfile: Profile = { ...DEFAULT_MOCK_PROFILE }
let inMemoryConversations: ConversationDetail[] = [...MOCK_INITIAL_CONVERSATIONS]

function loadPersistedState(): void {
  if (typeof window === 'undefined') return
  try {
    const savedProfile = localStorage.getItem(MOCK_PROFILE_KEY)
    if (savedProfile) {
      inMemoryProfile = JSON.parse(savedProfile) as Profile
    }
    const savedConvos = localStorage.getItem(MOCK_CONVOS_KEY)
    if (savedConvos) {
      inMemoryConversations = JSON.parse(savedConvos) as ConversationDetail[]
    }
  } catch {
    // ignore parse errors
  }
}

loadPersistedState()

export function getMockProfile(): Profile {
  return inMemoryProfile
}

export function updateMockProfile(update: ProfileUpdate): Profile {
  inMemoryProfile = {
    ...inMemoryProfile,
    ...update,
  }
  try {
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(inMemoryProfile))
  } catch {
    // ignore
  }
  return inMemoryProfile
}

export function getMockConversations(): ConversationDetail[] {
  return inMemoryConversations
}

export function getMockConversation(id: number): ConversationDetail | undefined {
  return inMemoryConversations.find((c) => c.conversationId === id)
}

export function createMockConversation(
  languageCode: string,
  scenario: string | null,
  initialUserMessage: string,
  assistantReply: string,
): ConversationDetail {
  const newId = Date.now()
  const newConversation: ConversationDetail = {
    conversationId: newId,
    language: { id: 1, code: languageCode, name: languageCode.toUpperCase() },
    scenario: scenario ?? 'General Practice',
    startedAt: new Date().toISOString(),
    endedAt: null,
    summary: null,
    messages: [
      {
        role: 'USER',
        content: initialUserMessage,
        createdAt: new Date().toISOString(),
      },
      {
        role: 'ASSISTANT',
        content: assistantReply,
        createdAt: new Date(Date.now() + 500).toISOString(),
      },
    ],
  }
  inMemoryConversations = [newConversation, ...inMemoryConversations]
  try {
    localStorage.setItem(MOCK_CONVOS_KEY, JSON.stringify(inMemoryConversations))
  } catch {
    // ignore
  }
  return newConversation
}

export function appendMockMessage(
  conversationId: number,
  userMessage: string,
  assistantReply: string,
): ConversationDetail | undefined {
  const convo = inMemoryConversations.find((c) => c.conversationId === conversationId)
  if (!convo) return undefined

  const userTurn: ConversationMessageItem = {
    role: 'USER',
    content: userMessage,
    createdAt: new Date().toISOString(),
  }
  const botTurn: ConversationMessageItem = {
    role: 'ASSISTANT',
    content: assistantReply,
    createdAt: new Date(Date.now() + 500).toISOString(),
  }

  convo.messages.push(userTurn, botTurn)
  try {
    localStorage.setItem(MOCK_CONVOS_KEY, JSON.stringify(inMemoryConversations))
  } catch {
    // ignore
  }
  return convo
}

export function endMockConversation(
  conversationId: number,
  summary: ConversationSummaryResult,
): ConversationDetail | undefined {
  const convo = inMemoryConversations.find((c) => c.conversationId === conversationId)
  if (!convo) return undefined
  convo.endedAt = new Date().toISOString()
  convo.summary = summary.overview
  try {
    localStorage.setItem(MOCK_CONVOS_KEY, JSON.stringify(inMemoryConversations))
  } catch {
    // ignore
  }
  return convo
}

export function getMockUser(): User {
  return MOCK_USER
}
