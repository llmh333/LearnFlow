import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { useUpdateUserSettings } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'

const DAILY_NEW_WORDS_OPTIONS = [20, 25, 30, 35]

interface AccountSettingsDialogProps {
  open: boolean
  onClose: () => void
}

/** Lets the learner cap how many brand-new words the Review queue introduces per day — without
 * this, every due word (including all 300 starter-pack words on day one) gets suggested at once. */
export function AccountSettingsDialog({ open, onClose }: AccountSettingsDialogProps) {
  const user = useAuthStore((state) => state.user)
  const updateSettings = useUpdateUserSettings()
  const [dailyNewWordsLimit, setDailyNewWordsLimit] = useState(user?.dailyNewWordsLimit ?? 20)

  useEffect(() => {
    if (open && user) setDailyNewWordsLimit(user.dailyNewWordsLimit)
  }, [open, user])

  function handleSave() {
    updateSettings.mutate({ dailyNewWordsLimit }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Account settings">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            New words per day
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            How many brand-new words the Review queue introduces each day. Words you've already
            started are never limited by this — only new ones.
          </p>
          <Select
            value={dailyNewWordsLimit}
            onChange={(event) => setDailyNewWordsLimit(Number(event.target.value))}
          >
            {DAILY_NEW_WORDS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} words/day
              </option>
            ))}
          </Select>
        </div>

        {updateSettings.isError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Something went wrong. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={updateSettings.isPending}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
