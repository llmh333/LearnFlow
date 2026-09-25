import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { IconVolume2 } from '@/components/ui/Icon'
import { isSpeechSupported, speak } from '@/lib/speech'
import { cn } from '@/lib/cn'

interface PronounceButtonProps {
  word: string
  languageCode: string
  size?: number
  className?: string
}

/** Plays `word` aloud via the browser's built-in text-to-speech (see lib/speech.ts) — a "listen"
 * button for the word/meaning views on the Review and Vocabulary pages. Renders nothing if the
 * browser has no speech synthesis support. */
export function PronounceButton({ word, languageCode, size = 15, className }: PronounceButtonProps) {
  const [speaking, setSpeaking] = useState(false)

  if (!isSpeechSupported()) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={(event) => {
        event.stopPropagation()
        speak(word, languageCode, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
        })
      }}
      className={cn('h-8 w-8 p-0 rounded-full', speaking && 'animate-pulse-subtle', className)}
      title="Listen"
      aria-label="Listen to pronunciation"
    >
      <IconVolume2 size={size} />
    </Button>
  )
}
