import { beforeEach, describe, expect, it } from 'vitest'
import {
  handleMockRequest,
  handleMockStream,
  isMockMode,
  setMockMode,
  getMockProfile,
  MOCK_CONTENT_SOURCES,
  MOCK_LANGUAGES,
} from './index'
import type { ConversationSummaryResult } from '@/api/ai'
import type { AuthResponse, Profile } from '@/types/domain'

describe('Mock System', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles mock mode on and off', () => {
    setMockMode(false)
    expect(isMockMode()).toBe(false)
    setMockMode(true)
    expect(isMockMode()).toBe(true)
    setMockMode(false)
    expect(isMockMode()).toBe(false)
  })

  it('handles auth endpoints', async () => {
    const loginRes = await handleMockRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })
    expect(loginRes.token).toBeDefined()
    expect(loginRes.user.email).toBe('test@example.com')

    const regRes = await handleMockRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        displayName: 'New User',
        timezone: 'UTC',
      }),
    })
    expect(regRes.token).toBeDefined()
    expect(regRes.user.email).toBe('new@example.com')

    const changePwRes = await handleMockRequest<AuthResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      }),
    })
    expect(changePwRes.token).toBe('mock-jwt-token-after-password-change')
  })

  it('handles profile get and update', async () => {
    const profile = await handleMockRequest<Profile>('/account/profile')
    expect(profile.timezone).toBeDefined()

    const updated = await handleMockRequest<Profile>('/account/profile', {
      method: 'PATCH',
      body: JSON.stringify({ goal: 'JLPT', dailyMinutes: 20 }),
    })
    expect(updated.goal).toBe('JLPT')
    expect(updated.dailyMinutes).toBe(20)
    expect(getMockProfile().dailyMinutes).toBe(20)
  })

  it('handles languages and curriculum sources', async () => {
    const langs = await handleMockRequest('/languages')
    expect(langs).toEqual(MOCK_LANGUAGES)

    const sources = await handleMockRequest('/curriculum/sources')
    expect(sources).toEqual(MOCK_CONTENT_SOURCES)

    const courses = await handleMockRequest<unknown[]>('/curriculum/courses')
    expect(Array.isArray(courses)).toBe(true)
    expect(courses.length).toBeGreaterThan(0)

    const health = await handleMockRequest<{ status: string }>('/health')
    expect(health.status).toBe('UP')
  })

  it('handles AI grammar explain, sentence check, and example generation', async () => {
    const explain = await handleMockRequest<{ explanation: string }>('/ai/grammar/explain', {
      method: 'POST',
      body: JSON.stringify({ languageCode: 'ja', question: 'wa vs ga' }),
    })
    expect(explain.explanation).toContain('は')

    const examples = await handleMockRequest<{ examples: string[] }>('/ai/examples/generate', {
      method: 'POST',
      body: JSON.stringify({ languageCode: 'en', word: 'fluency' }),
    })
    expect(examples.examples.length).toBeGreaterThan(0)

    const check = await handleMockRequest<{ corrected: string }>('/ai/sentence/correct', {
      method: 'POST',
      body: JSON.stringify({ languageCode: 'ja', text: '寿司を食べました' }),
    })
    expect(check.corrected).toBeDefined()
  })

  it('handles AI conversations flow and streaming', async () => {
    const initialConvos = await handleMockRequest('/ai/conversations')
    expect(Array.isArray(initialConvos)).toBe(true)

    // Send a message
    const msgResult = await handleMockRequest<{ conversationId: number; reply: string }>(
      '/ai/conversation/message',
      {
        method: 'POST',
        body: JSON.stringify({ languageCode: 'ja', scenario: 'test', message: 'こんにちは' }),
      },
    )
    expect(msgResult.conversationId).toBeDefined()
    expect(msgResult.reply).toBeDefined()

    // Stream a reply
    const chunks: string[] = []
    await handleMockStream(msgResult.conversationId, 'ラーメンを食べたい', (chunk) => {
      chunks.push(chunk)
    })
    expect(chunks.length).toBeGreaterThan(0)

    // End conversation
    const summary = await handleMockRequest<ConversationSummaryResult>(
      `/ai/conversation/${msgResult.conversationId}/end`,
      { method: 'POST' },
    )
    expect(summary.conversationId).toBe(msgResult.conversationId)
    expect(summary.overview).toBeDefined()
  })

  it('handles dictionary levels, search and word details', async () => {
    const levels = await handleMockRequest<
      Array<{ level: string; name: string; wordCount: number }>
    >('/dictionary/levels?lang=ja')
    expect(levels.length).toBeGreaterThan(0)
    expect(levels.some((l) => l.level === 'N5' && l.name === 'JLPT N5')).toBe(true)

    const searchResult = await handleMockRequest<{
      content: Array<{ id: number; written: string; reading: string; level: string | null }>
      totalElements: number
    }>('/dictionary/words?lang=ja&level=N5&q=学生')
    expect(searchResult.content.length).toBeGreaterThan(0)
    expect(searchResult.content[0].reading).toBe('がくせい')
    expect(searchResult.content[0].level).toBe('N5')

    const detail = await handleMockRequest<{
      id: number
      written: string
      level: string | null
      examples: Array<{ text: string }>
    }>('/dictionary/words/1')
    expect(detail.id).toBe(1)
    expect(detail.level).toBe('N5')
    expect(detail.examples.length).toBeGreaterThan(0)

    // Missing lang should throw 400
    await expect(handleMockRequest('/dictionary/levels')).rejects.toMatchObject({
      status: 400,
      errors: { lang: expect.any(String) },
    })

    await expect(handleMockRequest('/dictionary/words')).rejects.toMatchObject({
      status: 400,
      errors: { lang: expect.any(String) },
    })

    // Unsupported lang should throw 400
    await expect(handleMockRequest('/dictionary/words?lang=en')).rejects.toMatchObject({
      status: 400,
      errors: { lang: expect.any(String) },
    })

    // Invalid level should throw 400
    await expect(handleMockRequest('/dictionary/words?lang=ja&level=N6')).rejects.toMatchObject({
      status: 400,
      errors: { level: expect.any(String) },
    })
  })
})
