import { Link } from 'react-router-dom'
import { TodayPlanCard } from '@/components/dashboard/TodayPlanCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  IconFlame,
  IconClock,
  IconArrowRight,
  IconSparkles,
  IconBook,
  IconReview,
  IconProgress,
} from '@/components/ui/Icon'
import { useDashboardToday } from '@/hooks/useDashboard'

export function DashboardPage() {
  const { data, isLoading } = useDashboardToday()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-44 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const hasDueWords = data.languages.some((l) => l.dueCount > 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner & Streak Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-lg shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <IconSparkles size={14} className="text-amber-300" />
              <span>Smart SRS Spaced Repetition</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back! Keep the momentum.
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl">
              {hasDueWords
                ? 'You have reviews scheduled for today. Completing them reinforces long-term retention!'
                : 'Great job! Your review queue is currently clear. You can learn new words or practice with the AI Tutor.'}
            </p>
          </div>

          {/* Motivational Streak Card */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/30">
              <IconFlame size={24} className="animate-bounce-soft" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight">
                {data.streakDays} {data.streakDays === 1 ? 'Day' : 'Days'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                <IconClock size={13} />
                <span>~{data.totalEstimatedMinutes} min goal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* AI Daily Plan Section */}
      <TodayPlanCard />

      {/* Language Learning Courses */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Your Languages
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pick a language to review or practice
          </p>
        </div>

        {data.languages.length === 0 ? (
          <Card className="text-center py-10">
            <IconBook size={32} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No languages configured yet.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add vocabulary in the Vocabulary tab to get started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.languages.map((language) => {
              const isUrgent = language.dueCount > 0
              return (
                <Card
                  key={language.language.code}
                  className="group relative flex flex-col justify-between overflow-hidden border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:border-indigo-800"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {language.language.code}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {language.language.name}
                        </h3>
                      </div>
                      {isUrgent ? (
                        <Badge variant="danger" className="animate-pulse-subtle">
                          {language.dueCount} due
                        </Badge>
                      ) : (
                        <Badge variant="success">Up to date</Badge>
                      )}
                    </div>

                    {/* High-contrast stats container */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-3 text-center border border-slate-200 dark:bg-slate-800/90 dark:border-slate-700">
                      <div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {language.dueCount}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Due</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                          {language.newCount}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">New</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          ~{language.estimatedMinutes}m
                        </div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Time</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Retention rate</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {language.retentionPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, language.retentionPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <Link to={`/review?language=${language.language.code}`} className="block">
                      <Button className="w-full gap-2 justify-center shadow-sm font-semibold">
                        <IconReview size={16} />
                        <span>Start review</span>
                        <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Progress Overview */}
      <Card className="space-y-5 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <IconProgress size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Progress Overview
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.languages.map((language) => (
            <div
              key={language.language.code}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {language.language.name}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {language.language.code.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-1 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Known words</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {language.knownWords}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Retention</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {language.retentionPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Due now</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {language.dueCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
