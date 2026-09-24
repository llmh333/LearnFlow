import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import {
  IconProgress,
  IconSparkles,
  IconFlame,
  IconClock,
  IconBook,
  IconCheckCircle,
  IconMistake,
} from '@/components/ui/Icon'
import {
  useProgressHistory,
  useProgressSummary,
  useRetention,
  useWeakAreas,
} from '@/hooks/useProgress'
import { useRecurringMistakes } from '@/hooks/useMistakes'
import { useUiStore } from '@/stores/uiStore'

function StatTile({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: ReactNode
  icon: typeof IconBook
  colorClass: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {value}
      </span>
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
  const { data: recurringMistakes } = useRecurringMistakes(language)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Learning Analytics</span>
            <Badge variant="primary" className="text-xs font-bold">
              SRS Metrics
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track retention rates, memory strength, and weak areas over time.
          </p>
        </div>
        <div className="w-full sm:w-44">
          <LanguageSwitcher
            value={selectedLanguageCode}
            onChange={setSelectedLanguageCode}
            includeAll
          />
        </div>
      </div>

      {/* Metric Stat Tiles */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile
            label="Total Words"
            value={summary.total}
            icon={IconBook}
            colorClass="bg-[#EDFBD8] text-[#365314] dark:bg-[#365314]/40 dark:text-[#B6F23A]"
          />
          <StatTile
            label="New"
            value={summary.newCount}
            icon={IconSparkles}
            colorClass="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
          />
          <StatTile
            label="Learning"
            value={summary.learningCount}
            icon={IconFlame}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          />
          <StatTile
            label="Mastered"
            value={summary.masteredCount}
            icon={IconCheckCircle}
            colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <StatTile
            label="Due Review"
            value={summary.dueCount}
            icon={IconClock}
            colorClass="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
          />
        </div>
      )}

      {/* Retention Rate Card */}
      {retention && (
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-slate-200 dark:border-[#2C2C2C] dark:bg-[#1E1E1E] shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <IconProgress size={16} className="text-[#365314] dark:text-[#B6F23A]" />
              <span>Retention Rate (Last 30 Days)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Based on {retention.successCount} successful recalls out of {retention.totalCount} total reviews.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-black text-[#365314] dark:text-[#B6F23A]">
                {retention.ratePercent.toFixed(1)}%
              </p>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Target: &gt; 85%
              </span>
            </div>
            <div className="h-12 w-2 rounded-full bg-[#EDFBD8] dark:bg-[#2A2A2A] overflow-hidden">
              <div
                className="w-full bg-[#93D620] dark:bg-[#B6F23A] rounded-full transition-all duration-500"
                style={{ height: `${Math.min(100, Math.max(5, retention.ratePercent))}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weak Areas */}
        <Card className="flex flex-col gap-4 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <IconMistake size={16} className="text-amber-500" />
              <span>Words Needing Attention</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low ease factor</span>
          </div>

          {weakAreas && weakAreas.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {weakAreas.map((area) => (
                <li
                  key={area.vocabularyId}
                  className="flex items-center justify-between rounded-xl bg-slate-100/80 p-3 text-xs border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {area.word}
                    </span>
                    <span className="text-slate-400 mx-1.5">—</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{area.meaning}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" className="text-[10px] font-bold">
                      ease {area.easeFactor.toFixed(2)}
                    </Badge>
                    <span
                      className="font-bold text-rose-600 dark:text-rose-400"
                      title={`Rated "Again" ${area.failureCount} out of ${area.reviewCount} times you've reviewed this word`}
                    >
                      {area.failureCount}/{area.reviewCount} rated "Again"
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No weak areas detected! Keep it up.</p>
          )}
        </Card>

        {/* Recurring Mistakes */}
        <Card className="flex flex-col gap-4 border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <IconMistake size={16} className="text-rose-500" />
              <span>Recurring Mistake Topics</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Frequency count</span>
          </div>

          {recurringMistakes && recurringMistakes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recurringMistakes.slice(0, 5).map((mistake) => (
                <li
                  key={mistake.id}
                  className="flex items-center justify-between rounded-xl bg-slate-100/80 p-3 text-xs border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                >
                  <span className="flex items-center gap-2">
                    {mistake.category && <Badge variant="danger">{mistake.category}</Badge>}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {mistake.topic}
                    </span>
                  </span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {mistake.timesRepeated}x repeated
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No recurring mistakes logged.</p>
          )}
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="flex flex-col gap-4 border-slate-200 dark:border-[#2C2C2C] dark:bg-[#1E1E1E] shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <IconClock size={16} className="text-[#365314] dark:text-[#B6F23A]" />
          <span>Recent Study Sessions</span>
        </h2>

        {history && history.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8F9FA] p-3.5 text-xs dark:border-[#303030] dark:bg-[#242424]"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {new Date(session.startedAt).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(session.startedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#365314] dark:text-[#B6F23A]">
                    {session.wordsReviewed} words
                  </span>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {session.mistakesCount > 0 ? `${session.mistakesCount} mistakes` : 'Clean run!'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">No study sessions recorded yet.</p>
        )}
      </Card>
    </div>
  )
}
