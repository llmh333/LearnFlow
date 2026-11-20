import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Divider, Flex, Form, Input } from 'antd'
import {
  LockOutlined,
  MailOutlined,
  PlayCircleOutlined,
  RocketFilled,
  UserOutlined,
} from '@ant-design/icons'
import { ApiError } from '@/api/client'
import { ChinaFlagBadge, EnglishFlagBadge, Flowy, JapanFlagBadge } from '@/assets'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useAuth } from '@/hooks/useAuth'
import { MOCK_AUTH_RESPONSE, setMockMode } from '@/mock'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function handleMockLogin() {
    setMockMode(true)
    useAuthStore.getState().setAuth(MOCK_AUTH_RESPONSE.token, MOCK_AUTH_RESPONSE.user)
    useUiStore.getState().setOnboarded(false)
    navigate('/onboarding', { replace: true })
  }

  function handleSubmit() {
    if (password !== confirmPassword) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    setConfirmModalOpen(true)
  }

  function handleConfirmRegister() {
    setMockMode(false)
    register.mutate(
      {
        email,
        password,
        confirmPassword,
        displayName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      {
        onSuccess: () => {
          setConfirmModalOpen(false)
          useUiStore.getState().setOnboarded(false)
          navigate('/onboarding', { replace: true })
        },
        onError: () => {
          setConfirmModalOpen(false)
        },
      },
    )
  }

  return (
    <Flex
      align="center"
      justify="center"
      className="relative min-h-screen p-4 bg-[#F7F9FA] dark:bg-[#131F24] overflow-hidden selection:bg-[#58CC02] selection:text-white"
    >
      {/* Decorative playful floating character badges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-8 text-7xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        A
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-6 text-8xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        学
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-1/4 text-8xl font-black text-slate-200/50 dark:text-[#202F36] select-none"
      >
        語
      </div>

      <Card
        className="relative w-full max-w-md !rounded-3xl !border-2 !border-b-4 !border-slate-200 dark:!border-[#2B3940] !bg-white dark:!bg-[#1A262C] shadow-lg"
        styles={{ body: { padding: '2rem 1.5rem' } }}
      >
        {/* Mascot Banner */}
        <Flex vertical align="center" className="mb-6 text-center">
          <Flex align="center" justify="center" className="relative mb-3">
            <Flex
              align="center"
              justify="center"
              className="h-16 w-16 rounded-2xl bg-white dark:bg-[#131F24] shadow-sm border-2 border-b-4 border-slate-200 dark:border-[#2B3940]"
            >
              <Flowy size={46} />
            </Flex>
            <span className="absolute -bottom-1 -right-2 inline-flex items-center rounded-full bg-[#58CC02] px-2 py-0.5 text-[10px] font-black uppercase text-white border border-[#46A302]">
              Level 1
            </span>
          </Flex>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-[#202F36] px-3.5 py-1 mb-2">
            <Flex align="center" gap={4}>
              <EnglishFlagBadge size={15} />
              <ChinaFlagBadge size={15} />
              <JapanFlagBadge size={15} />
            </Flex>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Start Your Journey
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Build an exciting, rewarding daily habit across English, Chinese, and Japanese.
          </p>
        </Flex>

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} className="space-y-1">
          <Form.Item
            label={
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Your name
              </span>
            }
            required
            className="!mb-3"
          >
            <Input
              size="large"
              placeholder="e.g. Alex (亚历克斯 / アレックス)"
              prefix={<UserOutlined className="text-slate-400 mr-1.5" />}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="!rounded-2xl !py-2.5 font-medium"
              required
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email address
              </span>
            }
            required
            className="!mb-3"
          >
            <Input
              type="email"
              size="large"
              placeholder="you@example.com"
              prefix={<MailOutlined className="text-slate-400 mr-1.5" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="!rounded-2xl !py-2.5 font-medium"
              required
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </span>
            }
            required
            className="!mb-3"
          >
            <Input.Password
              size="large"
              placeholder="Min. 8 characters"
              prefix={<LockOutlined className="text-slate-400 mr-1.5" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordMismatch) setPasswordMismatch(false)
              }}
              minLength={8}
              className="!rounded-2xl !py-2.5 font-medium"
              required
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Confirm password
              </span>
            }
            required
            className="!mb-3"
          >
            <Input.Password
              size="large"
              placeholder="Re-enter your password"
              prefix={<LockOutlined className="text-slate-400 mr-1.5" />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (passwordMismatch) setPasswordMismatch(false)
              }}
              minLength={8}
              className="!rounded-2xl !py-2.5 font-medium"
              required
            />
          </Form.Item>

          {passwordMismatch && (
            <div className="mb-3">
              <Alert
                type="error"
                showIcon
                message="Passwords do not match. Please re-enter both passwords."
                className="!rounded-2xl !border-2 !border-[#FF4B4B]/30 !bg-rose-50 dark:!bg-rose-950/40 text-xs font-bold"
              />
            </div>
          )}

          {register.isError && (
            <div className="mb-3">
              <Alert
                type="error"
                showIcon
                message={
                  register.error instanceof ApiError
                    ? register.error.message
                    : 'Registration failed'
                }
                className="!rounded-2xl !border-2 !border-[#FF4B4B]/30 !bg-rose-50 dark:!bg-rose-950/40 text-xs font-bold"
              />
            </div>
          )}

          <Form.Item className="!mb-2 !mt-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={register.isPending}
              icon={<RocketFilled />}
              className="w-full !h-12 !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-base !tracking-wide uppercase shadow-xs transition-all"
            >
              {register.isPending ? 'Creating account…' : 'Start Learning 🎉'}
            </Button>
          </Form.Item>

          {/* Playground Mock Option */}
          <Divider dashed plain className="!my-3 !text-xs !font-bold !text-slate-400">
            or test immediately
          </Divider>

          <Button
            type="default"
            size="large"
            onClick={handleMockLogin}
            icon={<PlayCircleOutlined />}
            className="w-full !h-11 !rounded-2xl !bg-[#1cb0f6] hover:!bg-[#34bdff] !border-b-4 !border-[#1899d6] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-xs !tracking-wide uppercase shadow-xs transition-all"
          >
            Explore in Mock Mode
          </Button>
        </Form>

        <p className="mt-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-[#1CB0F6] hover:underline dark:text-[#1CB0F6]"
          >
            Log in here
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          <Link to="/sources" className="hover:underline">
            📖 Data sources &amp; open licences
          </Link>
        </p>
      </Card>

      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmRegister}
        title="Xác nhận đăng ký tài khoản"
        description="Bạn sắp bắt đầu hành trình học ngoại ngữ tuyệt vời cùng LearnFlow!"
        confirmText="Xác nhận tạo tài khoản"
        cancelText="Kiểm tra lại"
        variant="primary"
        icon="mascot"
        isLoading={register.isPending}
      >
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-[#2B3940] dark:bg-[#131F24]">
          <Flex align="center" justify="space-between" className="py-1">
            <span className="text-slate-500 font-medium">Họ tên:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{displayName}</span>
          </Flex>
          <Flex
            align="center"
            justify="space-between"
            className="py-1 border-t border-slate-200/60 dark:border-slate-800"
          >
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>
          </Flex>
        </div>
      </ConfirmModal>
    </Flex>
  )
}
