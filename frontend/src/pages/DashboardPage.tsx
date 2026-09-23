import { Link } from 'react-router-dom'
import { TodayPlanCard } from '@/components/dashboard/TodayPlanCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useDashboardToday } from '@/hooks/useDashboard'

export function DashboardPage() {
  const { data, isLoading } = useDashboardToday()

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading...</p>
  }

  if (!data) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        {data.streakDays > 0 && (
          <span className="text-sm text-neutral-500">
            {data.streakDays}-day streak · ~{data.totalEstimatedMinutes} min today
          </span>
        )}
      </div>

      <TodayPlanCard />

      {data.languages.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-500">No languages configured.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.languages.map((language) => (
            <Card key={language.language.code} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {language.language.name}
              </h2>
              <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span>{language.dueCount} due</span>
                <span>{language.newCount} new</span>
                <span>~{language.estimatedMinutes} min</span>
              </div>
              <Link to={`/review?language=${language.language.code}`}>
                <Button className="w-full">Start review</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Quick progress
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.languages.map((language) => (
            <div key={language.language.code} className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {language.language.name}
              </span>
              <span className="text-neutral-500">Known words: {language.knownWords}</span>
              <span className="text-neutral-500">
                Retention: {language.retentionPercent.toFixed(0)}%
              </span>
              <span className="text-neutral-500">Due: {language.dueCount}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
