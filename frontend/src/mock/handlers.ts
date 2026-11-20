import { MOCK_CONTENT_SOURCES, MOCK_COURSES } from './data/curriculum'
import { MOCK_LANGUAGES } from './data/languages'
import { MOCK_WORDS, MOCK_LEVEL_COUNTS, toWordSummary } from './data/dictionary'
import {
  MOCK_CONVERSATION_SUMMARY,
  MOCK_SENTENCE_CORRECTION,
  MOCK_GRAMMAR_EXPLANATIONS,
  MOCK_SCENARIOS,
  MOCK_SCENARIOS_BY_LANG,
} from './data/ai'
import {
  appendMockMessage,
  createMockConversation,
  endMockConversation,
  getMockConversation,
  getMockConversations,
  getMockProfile,
  getMockUser,
  setMockMode,
  updateMockProfile,
} from './state'
import { MOCK_AUTH_RESPONSE } from './data/auth'
import { ApiError } from '@/api/client'
import type { ConversationSummaryResult } from '@/api/ai'
import type { AuthResponse, ProfileUpdate } from '@/types/domain'

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateMockAssistantReply(userPrompt: string): string {
  const p = userPrompt.toLowerCase()
  if (
    p.includes('你好') ||
    p.includes('请问') ||
    p.includes('谢谢') ||
    p.includes('北京') ||
    p.includes('点心')
  ) {
    return '你好！很高兴和你一起练习中文。你的句子表达得很清晰、很地道。请问接下来你想聊聊什么呢？'
  }
  if (
    p.includes('こんにちは') ||
    p.includes('ラーメン') ||
    p.includes('駅') ||
    p.includes('ありがとう') ||
    p.includes('すみません')
  ) {
    return 'こんにちは！メッセージありがとうございます。とても自然な日本語ですね！続けて練習しましょう。'
  }
  if (
    p.includes('hello') ||
    p.includes('hi') ||
    p.includes('coffee') ||
    p.includes('station') ||
    p.includes('thank')
  ) {
    return 'Hello! That sounds great. Your phrasing is natural and easy to understand! What would you like to explore next?'
  }
  return `Thank you for your message: "${userPrompt}"! That is clear and well-formed. Let's keep practicing together!`
}

export async function handleMockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await delay(160)
  const method = (init?.method ?? 'GET').toUpperCase()
  let body: Record<string, unknown> = {}

  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body) as Record<string, unknown>
    } catch {
      // not json
    }
  }

  // 0. Health
  if (path === '/health') {
    return {
      status: 'UP',
      time: new Date().toISOString(),
    } as T
  }

  // 1. Auth endpoints
  if (path === '/auth/login' && method === 'POST') {
    const email = (body.email as string) || 'learner@learnflow.app'
    const authRes: AuthResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 1,
        email,
        displayName: email.split('@')[0] || 'Learner',
      },
    }
    return authRes as T
  }

  if (path === '/auth/register' && method === 'POST') {
    const email = (body.email as string) || 'newuser@learnflow.app'
    const displayName = (body.displayName as string) || 'Learner'
    const authRes: AuthResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 1,
        email,
        displayName,
      },
    }
    const prof = getMockProfile()
    prof.onboardedAt = null
    prof.goal = null
    return authRes as T
  }

  // The real refresh token is an HttpOnly cookie; in mock mode being in mock mode is the session.
  if (path === '/auth/refresh' && method === 'POST') {
    return MOCK_AUTH_RESPONSE as T
  }

  if (path === '/auth/logout' && method === 'POST') {
    setMockMode(false)
    return undefined as T
  }

  if (path === '/auth/change-password' && method === 'POST') {
    const cur = (body.currentPassword as string) || ''
    const newP = (body.newPassword as string) || ''
    const conf = (body.confirmNewPassword as string) || ''
    if (!cur.trim()) {
      throw new ApiError(400, 'Current password is required', {
        currentPassword: 'Current password is required',
      })
    }
    if (newP !== conf) {
      throw new ApiError(400, 'Passwords do not match', {
        confirmNewPassword: 'Passwords do not match',
      })
    }
    if (newP.length < 8 || !/[a-zA-Z]/.test(newP) || !/\d/.test(newP)) {
      throw new ApiError(
        400,
        'Password must be 8+ characters and contain both letters and digits',
        {
          newPassword: 'Password must be 8+ characters and contain both letters and digits',
        },
      )
    }
    if (newP === cur) {
      throw new ApiError(400, 'New password must differ from current password', {
        newPassword: 'New password must differ from current password',
      })
    }
    return {
      token: 'mock-jwt-token-after-password-change',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: getMockUser(),
    } as T
  }

  // Password reset: any email gets a "code", any 6 digits pass (real codes live in the backend log).
  if (path.startsWith('/auth/password-reset/') && method === 'POST') {
    return undefined as T
  }

  if (path === '/auth/me' && method === 'GET') {
    return getMockUser() as T
  }

  // 2. Profile endpoints
  if (path === '/account/profile') {
    if (method === 'PATCH') {
      const updated = updateMockProfile(body as ProfileUpdate)
      return updated as T
    }
    return getMockProfile() as T
  }

  // 3. Languages
  if (path === '/languages') {
    return MOCK_LANGUAGES as T
  }

  // 4. Curriculum content sources & courses
  if (path === '/curriculum/sources') {
    return MOCK_CONTENT_SOURCES as T
  }

  if (path === '/curriculum/courses') {
    return MOCK_COURSES as T
  }

  // 5. AI endpoints
  if (path === '/ai/grammar/explain' && method === 'POST') {
    return { explanation: MOCK_GRAMMAR_EXPLANATIONS.default } as T
  }

  if (path === '/ai/examples/generate' && method === 'POST') {
    const word = (body.word as string) || 'learn'
    const lang = (body.languageCode as string) || 'en'
    if (lang === 'zh') {
      return {
        examples: [
          `我每天都在努力学习新的汉字。 (I study new Chinese characters hard every day.)`,
          `学好一门外语需要持之以恒的练习。 (Mastering a foreign language requires consistent practice.)`,
          `你能给我举一个关于"${word}"的具体例句吗？ (Can you give me a specific example sentence for "${word}"?)`,
        ],
      } as T
    }
    if (lang === 'ja') {
      return {
        examples: [
          `毎日日本語の新しい単語を勉強しています。 (I study new Japanese words every day.)`,
          `「${word}」を使った自然な会話フレーズです。 (This is a natural conversational phrase using "${word}".)`,
          `この文法パターンは日常会話でよく使われます。 (This grammar pattern is frequently used in everyday conversation.)`,
        ],
      } as T
    }
    return {
      examples: [
        `Practice makes progress when learning "${word}".`,
        `She decided to incorporate "${word}" into her daily vocabulary.`,
        `Could you show me how native speakers use "${word}" in casual conversation?`,
      ],
    } as T
  }

  if (path === '/ai/sentence/correct' && method === 'POST') {
    return MOCK_SENTENCE_CORRECTION as T
  }

  if (path.startsWith('/ai/scenarios')) {
    const url = new URL('http://localhost' + path)
    const lang = url.searchParams.get('language') || 'en'
    return (MOCK_SCENARIOS_BY_LANG[lang] ?? MOCK_SCENARIOS) as T
  }

  if (path === '/ai/conversations' && method === 'GET') {
    return getMockConversations() as T
  }

  const convoDetailMatch = path.match(/^\/ai\/conversations\/(\d+)$/)
  if (convoDetailMatch && method === 'GET') {
    const id = parseInt(convoDetailMatch[1], 10)
    const convo = getMockConversation(id)
    if (!convo) {
      throw new Error(`Mock conversation with id ${id} not found`)
    }
    return convo as T
  }

  if (path === '/ai/conversation/message' && method === 'POST') {
    const lang = (body.languageCode as string) || 'ja'
    const scenario = (body.scenario as string) || null
    const userMsg = (body.message as string) || ''
    const reply = generateMockAssistantReply(userMsg)
    const newConvo = createMockConversation(lang, scenario, userMsg, reply)
    return {
      conversationId: newConvo.conversationId,
      reply,
    } as T
  }

  const convoMsgMatch = path.match(/^\/ai\/conversation\/(\d+)\/message$/)
  if (convoMsgMatch && method === 'POST') {
    const id = parseInt(convoMsgMatch[1], 10)
    const userMsg = (body.message as string) || ''
    const reply = generateMockAssistantReply(userMsg)
    appendMockMessage(id, userMsg, reply)
    return {
      conversationId: id,
      reply,
    } as T
  }

  const convoEndMatch = path.match(/^\/ai\/conversation\/(\d+)\/end$/)
  if (convoEndMatch && method === 'POST') {
    const id = parseInt(convoEndMatch[1], 10)
    const summary: ConversationSummaryResult = {
      ...MOCK_CONVERSATION_SUMMARY,
      conversationId: id,
      endedAt: new Date().toISOString(),
    }
    endMockConversation(id, summary)
    return summary as T
  }

  // 6. Dictionary endpoints
  if (path.startsWith('/dictionary/levels') && method === 'GET') {
    const url = new URL(path, 'http://localhost')
    const lang = url.searchParams.get('lang')
    if (!lang || lang !== 'ja') {
      throw new ApiError(400, 'Language parameter is required and must be supported', {
        lang: 'Language parameter is required and must be supported',
      })
    }
    return MOCK_LEVEL_COUNTS as T
  }

  const wordDetailMatch = path.match(/^\/dictionary\/words\/(\d+)$/)
  if (wordDetailMatch && method === 'GET') {
    const id = parseInt(wordDetailMatch[1], 10)
    const word = MOCK_WORDS.find((w) => w.id === id)
    if (!word) {
      throw new ApiError(404, `Word with id ${id} not found`)
    }
    return word as T
  }

  if (path.startsWith('/dictionary/words') && method === 'GET') {
    const url = new URL(path, 'http://localhost')
    const lang = url.searchParams.get('lang')
    if (!lang || lang !== 'ja') {
      throw new ApiError(400, 'Language parameter is required and must be supported', {
        lang: 'Language parameter is required and must be supported',
      })
    }
    const q = url.searchParams.get('q')?.toLowerCase() || ''
    const level = url.searchParams.get('level')?.toUpperCase() || ''
    const page = parseInt(url.searchParams.get('page') || '0', 10)
    const size = parseInt(url.searchParams.get('size') || '20', 10)

    let filtered = MOCK_WORDS
    if (level) {
      const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1']
      if (!validLevels.includes(level)) {
        throw new ApiError(400, `Invalid level for language ${lang}: ${level}`, {
          level: `Invalid level for language ${lang}: ${level}`,
        })
      }
      filtered = filtered.filter((w) => w.level === level)
    }
    if (q) {
      filtered = filtered.filter(
        (w) =>
          w.reading.toLowerCase().includes(q) ||
          (w.written && w.written.toLowerCase().includes(q)) ||
          w.meaningsVi.some((m) => m.toLowerCase().includes(q)) ||
          w.meaningsEn.some((m) => m.toLowerCase().includes(q)),
      )
    }

    const totalElements = filtered.length
    const totalPages = Math.ceil(totalElements / size) || 1
    const start = page * size
    const pagedContent = filtered.slice(start, start + size).map(toWordSummary)

    return {
      content: pagedContent,
      page,
      size,
      totalElements,
      totalPages,
    } as T
  }

  // Fallback for unknown paths
  console.warn(`[Mock Mode] Unhandled mock path: ${method} ${path}`)
  return {} as T
}

export async function handleMockStream(
  conversationId: number,
  userMessage: string,
  onDelta: (chunk: string) => void,
): Promise<void> {
  const reply = generateMockAssistantReply(userMessage)
  // Split into chunks to simulate real streaming tokens
  const words = reply.split(/(.{1,4})/gu).filter(Boolean)

  for (const chunk of words) {
    await delay(45)
    onDelta(chunk)
  }

  // Update in-memory mock history
  appendMockMessage(conversationId, userMessage, reply)
}
