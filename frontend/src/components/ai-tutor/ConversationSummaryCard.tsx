import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useCreateVocabulary } from '@/hooks/useVocabulary'
import type { ConversationSummaryResult } from '@/api/ai'

interface ConversationSummaryCardProps {
  summary: ConversationSummaryResult
  languageCode: string
}

export function ConversationSummaryCard({ summary, languageCode }: ConversationSummaryCardProps) {
  const createVocabulary = useCreateVocabulary()
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())

  function handleAdd(word: string, meaning: string) {
    createVocabulary.mutate(
      { languageCode, word, meaning, tags: [], attributes: {} },
      { onSuccess: () => setAddedWords((prev) => new Set(prev).add(word)) },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800">
      <p className="text-neutral-700 dark:text-neutral-300">{summary.overview}</p>

      {summary.pushedMistakes.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Added to Mistake Book
          </p>
          <ul className="flex flex-col gap-1">
            {summary.pushedMistakes.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                {m.category && <Badge>{m.category}</Badge>}
                {m.topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.suggestedVocabulary.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            New vocabulary
          </p>
          <ul className="flex flex-col gap-2">
            {summary.suggestedVocabulary.map((v) => (
              <li key={v.word} className="flex items-center justify-between gap-2">
                <span className="text-neutral-700 dark:text-neutral-300">
                  {v.word} <span className="text-neutral-400">— {v.meaningVietnamese}</span>
                </span>
                {addedWords.has(v.word) ? (
                  <span className="text-xs text-neutral-400">Added ✓</span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => handleAdd(v.word, v.meaningVietnamese)}
                    disabled={createVocabulary.isPending}
                  >
                    Add to Vocabulary
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.betterExpressions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Better expressions
          </p>
          <ul className="list-disc pl-4 text-neutral-600 dark:text-neutral-400">
            {summary.betterExpressions.map((expression) => (
              <li key={expression}>{expression}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.grammarProblems.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Grammar to review
          </p>
          <ul className="list-disc pl-4 text-neutral-600 dark:text-neutral-400">
            {summary.grammarProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
