import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Card } from '@/components/ui/Card'
import { useProgressHistory, useProgressSummary, useRetention, useWeakAreas } from '@/hooks/useProgress'
import { useUiStore } from '@/stores/uiStore'

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <span className="text-xs uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
    </div>
  )
}

export function ProgressPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const language = selectedLanguageCode || undefined

  const { data: summary } = useProgressSummary(language)
  const { data: retention } = useRetention(language)
  const { data: weakAreas } = useWeakAreas(language)
  const { data: history } = useProgressHistory(language)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Progress</h1>
        <div className="w-40">
          <LanguageSwitcher
            value={selectedLanguageCode}
            onChange={setSelectedLanguageCode}
            includeAll
          />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="Total" value={summary.total} />
          <StatTile label="New" value={summary.newCount} />
          <StatTile label="Learning" value={summary.learningCount} />
          <StatTile label="Mastered" value={summary.masteredCount} />
          <StatTile label="Due" value={summary.dueCount} />
        </div>
      )}

      {retention && (
        <Card>
          <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Retention (last 30 days)
          </h2>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {retention.ratePercent.toFixed(1)}%
          </p>
          <p className="text-xs text-neutral-500">
            {retention.successCount} / {retention.totalCount} reviews
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Weak areas
        </h2>
        {weakAreas && weakAreas.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {weakAreas.map((area) => (
              <li
                key={area.vocabularyId}
                className="flex justify-between text-neutral-600 dark:text-neutral-400"
              >
                <span>
                  {area.word} <span className="text-neutral-400">— {area.meaning}</span>
                </span>
                <span>
                  ease {area.easeFactor.toFixed(2)} · {area.failureCount}/{area.reviewCount} failed
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No weak areas yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Recent sessions
        </h2>
        {history && history.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {history.map((session) => (
              <li
                key={session.id}
                className="flex justify-between text-neutral-600 dark:text-neutral-400"
              >
                <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                <span>
                  {session.wordsReviewed} words · {session.mistakesCount} mistakes
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No study sessions yet.</p>
        )}
      </Card>
    </div>
  )
}
