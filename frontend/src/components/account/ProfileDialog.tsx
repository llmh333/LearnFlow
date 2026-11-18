import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useProfile, useUpdateProfile } from '@/hooks/useAccount'
import type { LearningGoal, Profile } from '@/types/domain'

const DAILY_MINUTES = [5, 10, 15, 20]
const GOALS: { value: LearningGoal; label: string }[] = [
  { value: 'JLPT', label: 'Pass the JLPT' },
  { value: 'CONVERSATION', label: 'Everyday conversation' },
  { value: 'TRAVEL', label: 'Travel' },
]
const labelClass = 'text-xs font-semibold text-slate-700 dark:text-slate-300'

interface ProfileDialogProps {
  open: boolean
  onClose: () => void
}

export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const profile = useProfile(open)

  return (
    <Dialog open={open} onClose={onClose} title="Learning profile">
      {profile.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {profile.isError && <p className="text-sm text-rose-600">Could not load your profile.</p>}
      {/* Keyed so the form starts from the latest saved values each time it opens. */}
      {profile.data && open && (
        <ProfileForm key={JSON.stringify(profile.data)} profile={profile.data} onSaved={onClose} />
      )}
    </Dialog>
  )
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const update = useUpdateProfile()
  const [timezone, setTimezone] = useState(profile.timezone)
  const [goal, setGoal] = useState<LearningGoal | ''>(profile.goal ?? '')
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyMinutes)
  const [dailyNewItems, setDailyNewItems] = useState(profile.dailyNewItems)
  const timezones = Intl.supportedValuesOf('timeZone')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate(
      { timezone, goal: goal || undefined, dailyMinutes, dailyNewItems },
      { onSuccess: onSaved },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="profile-timezone" className={labelClass}>
          Time zone (your day starts at midnight here)
        </label>
        <Select
          id="profile-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {/* Keep the saved zone selectable even if this browser does not list it. */}
          {!timezones.includes(timezone) && <option value={timezone}>{timezone}</option>}
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-goal" className={labelClass}>
          Goal
        </label>
        <Select
          id="profile-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as LearningGoal | '')}
        >
          <option value="">Not set</option>
          {GOALS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-minutes" className={labelClass}>
          Minutes per day
        </label>
        <Select
          id="profile-minutes"
          value={dailyMinutes}
          onChange={(e) => setDailyMinutes(Number(e.target.value))}
        >
          {DAILY_MINUTES.map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-new-items" className={labelClass}>
          New items per day
        </label>
        <Input
          id="profile-new-items"
          type="number"
          min={0}
          max={50}
          value={dailyNewItems}
          onChange={(e) => setDailyNewItems(Number(e.target.value))}
          required
        />
      </div>

      {update.isError && (
        <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          {update.error instanceof ApiError ? update.error.message : 'Could not save'}
        </p>
      )}

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
