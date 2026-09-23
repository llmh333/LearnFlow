import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconSparkles, IconPlus, IconCheck } from '@/components/ui/Icon'
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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-[#2C2C2C] dark:bg-[#1E1E1E] shadow-xs animate-fade-in">
      <div className="flex items-center gap-2 text-[#365314] dark:text-[#B6F23A]">
        <IconSparkles size={18} />
        <h3 className="font-bold text-slate-900 dark:text-white">Conversation Analysis</h3>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-[#F8F9FA] dark:bg-[#262626] p-3 rounded-xl border border-slate-200 dark:border-[#383838] font-medium">
        {summary.overview}
      </p>

      {summary.pushedMistakes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Recorded Mistakes
          </p>
          <ul className="flex flex-col gap-1.5">
            {summary.pushedMistakes.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-slate-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
              >
                {m.category && <Badge variant="danger">{m.category}</Badge>}
                <span className="font-semibold">{m.topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.suggestedVocabulary.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#365314] dark:text-[#B6F23A]">
            Recommended Vocabulary
          </p>
          <ul className="flex flex-col gap-2">
            {summary.suggestedVocabulary.map((v) => (
              <li
                key={v.word}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#F8F9FA] p-2.5 border border-slate-200 dark:bg-[#262626] dark:border-[#383838]"
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  <span className="font-bold text-[#365314] dark:text-[#B6F23A]">{v.word}</span>
                  <span className="text-slate-400 mx-1.5">—</span>
                  <span>{v.meaningVietnamese}</span>
                </div>
                {addedWords.has(v.word) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#365314] dark:text-[#B6F23A]">
                    <IconCheck size={14} /> Added
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAdd(v.word, v.meaningVietnamese)}
                    disabled={createVocabulary.isPending}
                    className="gap-1 text-xs font-semibold"
                  >
                    <IconPlus size={13} />
                    <span>Add to deck</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.betterExpressions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Better Expressions
          </p>
          <ul className="space-y-1 rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-xs text-slate-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
            {summary.betterExpressions.map((expression) => (
              <li key={expression} className="flex items-start gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span className="font-medium">{expression}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.grammarProblems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Grammar Points to Review
          </p>
          <ul className="space-y-1 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-slate-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
            {summary.grammarProblems.map((problem) => (
              <li key={problem} className="flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 font-bold">!</span>
                <span className="font-medium">{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
