import { Alert, Flex, Form, InputNumber, Select, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useProfile, useUpdateProfile } from '@/hooks/useAccount'
import type { LearningGoal, Profile } from '@/types/domain'

const DAILY_MINUTES = [5, 10, 15, 20]
const GOALS: { value: LearningGoal | ''; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'JLPT', label: 'Pass the JLPT' },
  { value: 'CONVERSATION', label: 'Everyday conversation' },
  { value: 'TRAVEL', label: 'Travel' },
]
const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'

interface ProfileFormValues {
  timezone: string
  goal: LearningGoal | ''
  dailyMinutes: number
  dailyNewItems: number
}

interface ProfileDialogProps {
  open: boolean
  onClose: () => void
}

export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const profile = useProfile(open)

  return (
    <Dialog open={open} onClose={onClose} title="Learning profile">
      {profile.isLoading && <Spin className="block py-6" />}
      {profile.isError && <Alert type="error" showIcon title="Could not load your profile." />}
      {/* Keyed so the form starts from the latest saved values each time it opens. */}
      {profile.data && open && (
        <ProfileForm key={JSON.stringify(profile.data)} profile={profile.data} onSaved={onClose} />
      )}
    </Dialog>
  )
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const [form] = Form.useForm<ProfileFormValues>()
  const timezones = Intl.supportedValuesOf('timeZone')
  // Keep the saved zone selectable even if this browser does not list it.
  const timezoneOptions = (
    timezones.includes(profile.timezone) ? timezones : [profile.timezone, ...timezones]
  ).map((tz) => ({ value: tz, label: tz }))

  function handleFinish(values: ProfileFormValues) {
    update.mutate(
      { ...values, goal: values.goal || undefined },
      {
        onSuccess: onSaved,
        onError: (error) => {
          // Show the backend's per-field messages (400 errors.<field>) under the matching input.
          if (error instanceof ApiError && error.errors) {
            form.setFields(
              Object.entries(error.errors).map(([name, message]) => ({
                name: name as keyof ProfileFormValues,
                errors: [message],
              })),
            )
          }
        },
      },
    )
  }

  return (
    <Form<ProfileFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{
        timezone: profile.timezone,
        goal: profile.goal ?? '',
        dailyMinutes: profile.dailyMinutes,
        dailyNewItems: profile.dailyNewItems,
      }}
      onFinish={handleFinish}
    >
      {/* Onboarding Wizard shortcut */}
      <Flex
        align="center"
        justify="space-between"
        className="mb-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div>
          <p className="text-xs font-black text-slate-800 dark:text-white">Onboarding Wizard</p>
          <p className="text-[11px] text-slate-400">Select language course, level &amp; goals</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onSaved()
            navigate('/onboarding')
          }}
          className="text-xs font-bold"
        >
          Open Wizard
        </Button>
      </Flex>

      <Form.Item
        name="timezone"
        label={<span className={labelClass}>Time zone (your day starts at midnight here)</span>}
        rules={[{ required: true, message: 'Choose a time zone' }]}
      >
        <Select showSearch size="large" options={timezoneOptions} />
      </Form.Item>

      <Form.Item name="goal" label={<span className={labelClass}>Goal</span>}>
        <Select size="large" options={GOALS} />
      </Form.Item>

      <Form.Item name="dailyMinutes" label={<span className={labelClass}>Minutes per day</span>}>
        <Select
          size="large"
          options={DAILY_MINUTES.map((m) => ({ value: m, label: `${m} minutes` }))}
        />
      </Form.Item>

      <Form.Item
        name="dailyNewItems"
        label={<span className={labelClass}>New items per day</span>}
        rules={[{ required: true, type: 'integer', min: 0, max: 50, message: 'Enter 0–50' }]}
      >
        <InputNumber size="large" min={0} max={50} precision={0} className="w-full" />
      </Form.Item>

      {update.isError && !(update.error instanceof ApiError && update.error.errors) && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          title={update.error instanceof ApiError ? update.error.message : 'Could not save'}
        />
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full py-2.5 font-extrabold uppercase tracking-wide"
        disabled={update.isPending}
      >
        {update.isPending ? 'Saving…' : 'Save'}
      </Button>
    </Form>
  )
}
