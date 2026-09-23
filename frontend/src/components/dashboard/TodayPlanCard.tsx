import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useGenerateDailyPlan, useTodayPlan, useUpdatePlanItem } from '@/hooks/useDailyPlan'
import { ApiError } from '@/api/client'
import type { DailyPlanItem } from '@/types/domain'

const KIND_LABELS: Record<DailyPlanItem['kind'], string> = {
  REVIEW_DUE: 'Review',
  LEARN_NEW: 'New words',
  GRAMMAR_EXERCISE: 'Grammar',
  CONVERSATION: 'Conversation',
}

function groupByLanguage(items: DailyPlanItem[]): Map<string, DailyPlanItem[]> {
  const groups = new Map<string, DailyPlanItem[]>()
  for (const item of items) {
    const key = item.languageCode ?? 'unknown'
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  return groups
}

export function TodayPlanCard() {
  const { data: plan, isLoading } = useTodayPlan()
  const generatePlan = useGenerateDailyPlan()
  const updateItem = useUpdatePlanItem()
  const [minutes, setMinutes] = useState('30')
  const [showForm, setShowForm] = useState(false)

  function handleGenerate(event: FormEvent) {
    event.preventDefault()
    const value = Number(minutes)
    if (!value || value <= 0) return
    generatePlan.mutate(value, { onSuccess: () => setShowForm(false) })
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-neutral-500">Loading today's plan...</p>
      </Card>
    )
  }

  if (!plan || showForm) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Today's plan
        </h2>
        <form onSubmit={handleGenerate} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Minutes available today</label>
            <Input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={generatePlan.isPending}>
            {generatePlan.isPending ? 'Generating...' : 'Generate plan'}
          </Button>
        </form>
        {generatePlan.isError && (
          <p className="text-sm text-red-600">
            {generatePlan.error instanceof ApiError
              ? generatePlan.error.message
              : 'Could not generate a plan. Please try again.'}
          </p>
        )}
      </Card>
    )
  }

  const groups = groupByLanguage(plan.items)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Today's plan — {plan.availableMinutes} min
        </h2>
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          Regenerate
        </Button>
      </div>

      {plan.intro && <p className="text-sm text-neutral-600 dark:text-neutral-400">{plan.intro}</p>}

      {plan.items.length === 0 ? (
        <p className="text-sm text-neutral-500">Not enough time to plan anything today.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from(groups.entries()).map(([languageCode, items]) => (
            <div key={languageCode} className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                {languageCode} — {items.reduce((sum, item) => sum + item.minutes, 0)} min
              </p>
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={item.completed}
                      onChange={(e) => updateItem.mutate({ itemId: item.id, completed: e.target.checked })}
                    />
                    <span
                      className={
                        item.completed
                          ? 'text-neutral-400 line-through'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }
                    >
                      {item.minutes} min — {KIND_LABELS[item.kind]}: {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
