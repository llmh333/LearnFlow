import { useState } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { IconMistake, IconCheck, IconX, IconSparkles } from '@/components/ui/Icon'
import { useMistakeCategories, useMistakes, useRecurringMistakes } from '@/hooks/useMistakes'
import { useUiStore } from '@/stores/uiStore'
import type { Mistake } from '@/api/mistakes'

function MistakeRow({ mistake }: { mistake: Mistake }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {mistake.category && <Badge variant="purple">{mistake.category}</Badge>}
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {mistake.topic}
          </span>
        </div>
        <Badge variant="danger" className="text-[11px] font-bold">
          Repeated {mistake.timesRepeated}x
        </Badge>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white font-bold">
            <IconX size={10} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-0.5">
              Original Mistake
            </p>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-through">
              {mistake.original}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
            <IconCheck size={10} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
              Correction
            </p>
            <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
              {mistake.corrected}
            </p>
          </div>
        </div>
      </div>

      {mistake.explanation && (
        <div className="flex items-start gap-1.5 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <IconSparkles size={14} className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <p className="leading-relaxed font-medium">{mistake.explanation}</p>
        </div>
      )}
    </div>
  )
}

export function MistakeBookPage() {
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const [category, setCategory] = useState('')

  const language = selectedLanguageCode || undefined
  const { data: categories } = useMistakeCategories()
  const { data: recurring } = useRecurringMistakes(language)
  const { data: mistakes, isLoading } = useMistakes(language, category || undefined)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Mistake Book</span>
            <Badge variant="danger" className="text-xs font-bold">
              Error Review
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review your frequent grammar and vocabulary errors to eliminate them permanently.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="w-full sm:w-44">
          <LanguageSwitcher
            value={selectedLanguageCode}
            onChange={setSelectedLanguageCode}
            includeAll
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {(categories ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Most Repeated Mistakes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconMistake size={18} className="text-rose-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Most Frequent Mistakes
          </h2>
        </div>
        {recurring && recurring.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {recurring.slice(0, 4).map((mistake) => (
              <MistakeRow key={mistake.id} mistake={mistake} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-xs text-slate-500 dark:text-slate-400">No recurring mistakes logged yet.</p>
          </Card>
        )}
      </div>

      {/* All Mistakes List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          All Logged Mistakes
        </h2>
        {isLoading ? (
          <Card className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </Card>
        ) : mistakes && mistakes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {mistakes.map((mistake) => (
              <MistakeRow key={mistake.id} mistake={mistake} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <p className="text-xs text-slate-500 dark:text-slate-400">No mistakes saved yet for this filter.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
