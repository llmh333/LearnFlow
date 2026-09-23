import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  IconCheck,
  IconClock,
  IconRotate,
  IconSparkles,
  IconBook,
  IconReview,
  IconBot,
} from '@/components/ui/Icon'
import { useGenerateDailyPlan, useTodayPlan, useUpdatePlanItem } from '@/hooks/useDailyPlan'
import { ApiError } from '@/api/client'
import type { DailyPlanItem } from '@/types/domain'

const KIND_CONFIG: Record<
  DailyPlanItem['kind'],
  { label: string; badgeVariant: 'warning' | 'primary' | 'purple' | 'success'; icon: typeof IconBook }
> = {
  REVIEW_DUE: { label: 'Review', badgeVariant: 'warning', icon: IconReview },
  LEARN_NEW: { label: 'New words', badgeVariant: 'primary', icon: IconBook },
  GRAMMAR_EXERCISE: { label: 'Grammar', badgeVariant: 'purple', icon: IconSparkles },
  CONVERSATION: { label: 'Conversation', badgeVariant: 'success', icon: IconBot },
}

const PRESET_MINUTES = [15, 30, 45, 60]

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

  function handleQuickSelect(min: number) {
    setMinutes(String(min))
    generatePlan.mutate(min, { onSuccess: () => setShowForm(false) })
  }

  if (isLoading) {
    return (
      <Card className="flex items-center gap-3 p-6 text-slate-500 animate-pulse">
        <IconClock size={20} className="animate-spin text-indigo-500" />
        <span className="text-sm">Loading today's smart plan...</span>
      </Card>
    )
  }

  if (!plan || showForm) {
    return (
      <Card className="relative overflow-hidden border-slate-200 bg-white dark:border-[#2C2C2C] dark:bg-[#1E1E1E]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDFBD8] text-[#365314] dark:bg-[#365314]/50 dark:text-[#B6F23A]">
              <IconSparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
                Generate Today's Study Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI optimizes your learning sessions based on your available study time.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_MINUTES.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => handleQuickSelect(min)}
                  disabled={generatePlan.isPending}
                  className="rounded-full border border-slate-200 bg-[#F0F2F5] px-4 py-1.5 text-xs font-semibold text-[#1A1A1A] shadow-2xs hover:bg-[#EDFBD8] hover:text-[#365314] hover:border-[#93D620] transition-all active:scale-95 dark:border-[#383838] dark:bg-[#262626] dark:text-white dark:hover:bg-[#333333] dark:hover:border-[#B6F23A]/50 cursor-pointer"
                >
                  ⚡ {min} minutes
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-3 pt-2">
            <div className="w-full flex-1">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Or custom minutes available
              </label>
              <Input
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {plan && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={generatePlan.isPending}
                className="flex-1 sm:flex-none font-semibold"
              >
                {generatePlan.isPending ? 'Generating...' : 'Generate plan'}
              </Button>
            </div>
          </form>

          {generatePlan.isError && (
            <p className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {generatePlan.error instanceof ApiError
                ? generatePlan.error.message
                : 'Could not generate a plan. Please try again.'}
            </p>
          )}
        </div>
      </Card>
    )
  }

  const groups = groupByLanguage(plan.items)
  const totalItems = plan.items.length
  const completedItems = plan.items.filter((i) => i.completed).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <Card className="flex flex-col gap-5 border-slate-200 dark:border-[#2C2C2C] dark:bg-[#1E1E1E] shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-[#2C2C2C]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
              Today's Plan
            </h2>
            <Badge variant="primary" className="font-bold">
              <IconClock size={12} /> {plan.availableMinutes} min
            </Badge>
            {completedItems === totalItems && totalItems > 0 && (
              <Badge variant="tertiary">All done! 🎉</Badge>
            )}
          </div>
          {plan.intro && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {plan.intro}
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowForm(true)}
          className="self-start sm:self-auto gap-1.5"
        >
          <IconRotate size={14} /> Regenerate
        </Button>
      </div>

      {totalItems > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Progress: {completedItems} of {totalItems} completed</span>
            <span className="font-bold text-[#365314] dark:text-[#B6F23A]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDFBD8] dark:bg-[#2A2A2A]">
            <div
              className="h-full rounded-full bg-[#B6F23A] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {plan.items.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-slate-500">Not enough time to plan anything today.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from(groups.entries()).map(([languageCode, items]) => (
            <div
              key={languageCode}
              className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-[#F8F9FA] p-4 dark:border-[#303030] dark:bg-[#242424]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {languageCode}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ~{items.reduce((sum, item) => sum + item.minutes, 0)} min total
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {items.map((item) => {
                  const config = KIND_CONFIG[item.kind] ?? {
                    label: item.kind,
                    badgeVariant: 'default' as const,
                    icon: IconBook,
                  }
                  return (
                    <li
                      key={item.id}
                      className="group flex items-start gap-3 rounded-lg bg-white p-2.5 shadow-2xs transition-all hover:shadow-xs dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#333333]"
                    >
                      <label className="flex cursor-pointer items-start gap-3 w-full">
                        <div className="relative mt-0.5 flex h-4 w-4 items-center justify-center">
                          <input
                            type="checkbox"
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-slate-300 transition-colors checked:border-[#365314] checked:bg-[#365314] dark:checked:border-[#B6F23A] dark:checked:bg-[#B6F23A] focus:outline-none dark:border-slate-600"
                            checked={item.completed}
                            onChange={(e) =>
                              updateItem.mutate({ itemId: item.id, completed: e.target.checked })
                            }
                          />
                          <IconCheck
                            size={12}
                            className="pointer-events-none absolute text-white dark:text-[#1A1A1A] opacity-0 peer-checked:opacity-100 transition-opacity"
                          />
                        </div>

                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={config.badgeVariant} className="text-[10px] py-0 px-2 font-bold">
                              {config.label}
                            </Badge>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {item.minutes} min
                            </span>
                          </div>
                          <span
                            className={
                              item.completed
                                ? 'text-xs text-slate-400 line-through transition-all'
                                : 'text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug'
                            }
                          >
                            {item.description}
                          </span>
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
