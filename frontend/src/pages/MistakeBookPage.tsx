import { useState } from 'react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useMistakeCategories, useMistakes, useRecurringMistakes } from '@/hooks/useMistakes'
import { useUiStore } from '@/stores/uiStore'
import type { Mistake } from '@/api/mistakes'

function MistakeRow({ mistake }: { mistake: Mistake }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-0 dark:border-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {mistake.category && <Badge>{mistake.category}</Badge>}
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {mistake.topic}
          </span>
        </div>
        <span className="text-xs text-neutral-400">Repeated {mistake.timesRepeated}x</span>
      </div>
      <p className="text-sm text-neutral-500 line-through">{mistake.original}</p>
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{mistake.corrected}</p>
      {mistake.explanation && (
        <p className="text-xs text-neutral-400">{mistake.explanation}</p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Mistake Book</h1>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <LanguageSwitcher value={selectedLanguageCode} onChange={setSelectedLanguageCode} includeAll />
        </div>
        <div className="w-48">
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

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Most repeated
        </h2>
        {recurring && recurring.length > 0 ? (
          <div>
            {recurring.slice(0, 5).map((mistake) => (
              <MistakeRow key={mistake.id} mistake={mistake} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No recurring mistakes yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">All mistakes</h2>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : mistakes && mistakes.length > 0 ? (
          <div>
            {mistakes.map((mistake) => (
              <MistakeRow key={mistake.id} mistake={mistake} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No mistakes saved yet.</p>
        )}
      </Card>
    </div>
  )
}
