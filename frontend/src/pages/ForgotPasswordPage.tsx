import { Alert, Button, Card, Flex, Form, Input, Steps, type FormInstance } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { Flowy } from '@/assets'
import {
  useConfirmPasswordReset,
  useRequestPasswordReset,
  useVerifyPasswordReset,
} from '@/hooks/usePasswordReset'
import { useAuthStore } from '@/stores/authStore'

/** The backend ignores repeat requests within 60 s of the last code, so the button waits too. */
const RESEND_SECONDS = 60
const STEPS = [{ title: 'Email' }, { title: 'Code' }, { title: 'New password' }]
const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'

/** Puts the backend's `errors.<field>` under the matching inputs; returns false if there were none. */
function showFieldErrors(form: FormInstance, error: unknown): boolean {
  if (!(error instanceof ApiError) || !error.errors) return false
  form.setFields(
    Object.entries(error.errors).map(([name, message]) => ({ name, errors: [message] })),
  )
  return true
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [emailForm] = Form.useForm<{ email: string }>()
  const [codeForm] = Form.useForm<{ code: string }>()
  const [passwordForm] = Form.useForm<{ newPassword: string; confirmNewPassword: string }>()
  const request = useRequestPasswordReset()
  const verify = useVerifyPasswordReset()
  const confirm = useConfirmPasswordReset()

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  function fail(form: FormInstance, error: unknown) {
    setGeneralError(showFieldErrors(form, error) ? null : errorText(error))
  }

  function sendCode(address: string) {
    setGeneralError(null)
    request.mutate(address, {
      onSuccess: () => {
        setEmail(address)
        setResendIn(RESEND_SECONDS)
        setStep(1)
      },
      onError: (error) => fail(emailForm, error),
    })
  }

  function handleVerify({ code: entered }: { code: string }) {
    setGeneralError(null)
    verify.mutate(
      { email, code: entered },
      {
        onSuccess: () => {
          setCode(entered)
          setStep(2)
        },
        onError: (error) => fail(codeForm, error),
      },
    )
  }

  function handleConfirm(values: { newPassword: string; confirmNewPassword: string }) {
    setGeneralError(null)
    confirm.mutate(
      { email, code, ...values },
      {
        onSuccess: () => {
          // Every session was revoked server-side; drop ours and make the user log in again.
          clearAuth()
          navigate('/login', { replace: true, state: { passwordReset: true } })
        },
        onError: (error) => {
          // The code expired or ran out of attempts while the user typed: back to step 2.
          if (error instanceof ApiError && error.errors?.code) {
            setStep(1)
            setGeneralError(`${error.errors.code}. Enter the code again or request a new one.`)
            return
          }
          fail(passwordForm, error)
        },
      },
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      className="min-h-screen p-4 bg-[#F7F9FA] dark:bg-[#131F24]"
    >
      <Card
        className="w-full max-w-md rounded-3xl border-2 border-b-4 border-slate-200 dark:border-[#2B3940] bg-white dark:bg-[#1A262C] shadow-lg"
        styles={{ body: { padding: '2rem 1.5rem' } }}
      >
        <Flex vertical align="center" className="mb-6 text-center">
          <Flex
            align="center"
            justify="center"
            className="mb-3 h-16 w-16 rounded-2xl bg-white dark:bg-[#131F24] shadow-sm border-2 border-b-4 border-slate-200 dark:border-[#2B3940]"
          >
            <Flowy size={46} />
          </Flex>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Reset your password
          </h1>
        </Flex>

        <Steps current={step} size="small" items={STEPS} className="mb-6" />

        {generalError && (
          <Alert type="error" showIcon title={generalError} className="mb-4 rounded-2xl" />
        )}

        {step === 0 && (
          <Form
            form={emailForm}
            layout="vertical"
            requiredMark={false}
            onFinish={({ email: address }) => sendCode(address.trim())}
          >
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Enter your account email and we will send you a 6-digit code.
            </p>
            <Form.Item
              name="email"
              label={<span className={labelClass}>Email address</span>}
              rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
            >
              <Input type="email" size="large" placeholder="you@example.com" autoFocus />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={request.isPending}
              className="rounded-2xl font-black"
            >
              Send code
            </Button>
          </Form>
        )}

        {step === 1 && (
          <Form form={codeForm} layout="vertical" requiredMark={false} onFinish={handleVerify}>
            <Alert
              type="info"
              showIcon
              className="mb-4 rounded-2xl"
              title="If this email has an account, we have sent a code. Check your inbox (and spam)."
              description={`Sent to ${email}. The code is valid for 10 minutes.`}
            />
            <Form.Item
              name="code"
              label={<span className={labelClass}>6-digit code</span>}
              rules={[{ required: true, pattern: /^\d{6}$/, message: 'Enter the 6 digits' }]}
            >
              <Input.OTP length={6} size="large" autoFocus />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={verify.isPending}
              className="rounded-2xl font-black"
            >
              Verify code
            </Button>
            <Flex justify="space-between" align="center" className="mt-4 text-xs">
              <Button type="link" size="small" className="px-0" onClick={() => setStep(0)}>
                Use another email
              </Button>
              <Button
                type="link"
                size="small"
                className="px-0"
                disabled={resendIn > 0 || request.isPending}
                onClick={() => sendCode(email)}
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </Button>
            </Flex>
          </Form>
        )}

        {step === 2 && (
          <Form form={passwordForm} layout="vertical" requiredMark={false} onFinish={handleConfirm}>
            <Form.Item
              name="newPassword"
              label={<span className={labelClass}>New password</span>}
              extra="At least 8 characters, with a letter and a digit."
              rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
            >
              <Input.Password size="large" autoComplete="new-password" autoFocus />
            </Form.Item>
            <Form.Item
              name="confirmNewPassword"
              label={<span className={labelClass}>Confirm new password</span>}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Confirm your new password' },
                ({ getFieldValue }) => ({
                  validator: (_, value) =>
                    !value || value === getFieldValue('newPassword')
                      ? Promise.resolve()
                      : Promise.reject(new Error('Passwords do not match')),
                }),
              ]}
            >
              <Input.Password size="large" autoComplete="new-password" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={confirm.isPending}
              className="rounded-2xl font-black"
            >
              Set new password
            </Button>
          </Form>
        )}

        <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-[#1CB0F6] hover:underline">
            Back to log in
          </Link>
        </p>
      </Card>
    </Flex>
  )
}
