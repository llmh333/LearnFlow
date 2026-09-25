import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PronounceButton } from './PronounceButton'

describe('PronounceButton', () => {
  const speakMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { speak: speakMock, cancel: vi.fn() })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (this: { text: string; lang: string }, text: string) {
        this.text = text
        this.lang = ''
      }),
    )
  })

  afterEach(() => {
    speakMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('speaks the word in its language when clicked', () => {
    render(<PronounceButton word="achieve" languageCode="en" />)

    fireEvent.click(screen.getByRole('button', { name: /listen/i }))

    expect(speakMock).toHaveBeenCalledTimes(1)
    expect(speakMock.mock.calls[0][0]).toMatchObject({ text: 'achieve', lang: 'en-US' })
  })

  it('renders nothing when speech synthesis is unsupported', () => {
    vi.unstubAllGlobals()
    render(<PronounceButton word="achieve" languageCode="en" />)

    expect(screen.queryByRole('button', { name: /listen/i })).not.toBeInTheDocument()
  })
})
