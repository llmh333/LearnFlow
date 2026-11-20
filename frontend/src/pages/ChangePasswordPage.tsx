import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Card, Flex, Form, Input } from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  KeyOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Flowy } from '@/assets'
import { changePassword } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/authStore'

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [form] = Form.useForm<ChangePasswordFormValues>()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const newPasswordValue: string = Form.useWatch('newPassword', form) ?? ''
  const confirmPasswordValue: string = Form.useWatch('confirmNewPassword', form) ?? ''

  const isMinLength = newPasswordValue.length >= 8
  const hasLetterAndDigit = /[a-zA-Z]/.test(newPasswordValue) && /\d/.test(newPasswordValue)
  const isMatched =
    Boolean(newPasswordValue) &&
    Boolean(confirmPasswordValue) &&
    newPasswordValue === confirmPasswordValue

  async function handleFinish(values: ChangePasswordFormValues) {
    setIsSubmitting(true)
    setGeneralError(null)

    try {
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      })

      // Update in-memory auth state with new access token
      setAuth(response.token, response.user)
      setIsSuccess(true)
      form.resetFields()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors && Object.keys(err.errors).length > 0) {
          form.setFields(
            Object.entries(err.errors).map(([field, msg]) => ({
              name: field as keyof ChangePasswordFormValues,
              errors: [msg],
            })),
          )
        } else {
          setGeneralError(err.message)
        }
      } else {
        setGeneralError('Đã có lỗi xảy ra trong quá trình đổi mật khẩu. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl py-4 sm:py-8">
      {/* Back button */}
      <div className="mb-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <ArrowLeftOutlined />
          <span>Quay lại</span>
        </Button>
      </div>

      <Card
        className="!rounded-3xl !border-2 !border-b-4 !border-slate-200 !bg-white dark:!border-[#2B3940] dark:!bg-[#1B272C] shadow-sm"
        styles={{ body: { padding: '2rem 1.75rem' } }}
      >
        {/* Header with Mascot & Security Shield */}
        <Flex vertical align="center" className="mb-6 text-center">
          <Flex align="center" justify="center" className="relative mb-3">
            <Flex
              align="center"
              justify="center"
              className="h-16 w-16 rounded-2xl bg-white dark:bg-[#131F24] shadow-sm border-2 border-b-4 border-slate-200 dark:border-[#2B3940]"
            >
              <Flowy size={44} />
            </Flex>
            <span className="absolute -bottom-1 -right-2 inline-flex items-center gap-1 rounded-full bg-[#1CB0F6] px-2 py-0.5 text-[10px] font-black uppercase text-white border border-[#1899D6]">
              <SafetyCertificateOutlined className="text-xs" />
              <span>Bảo mật</span>
            </span>
          </Flex>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Đổi mật khẩu tài khoản
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Cập nhật mật khẩu mới cho tài khoản của bạn. Các phiên đăng nhập trên thiết bị khác sẽ
            tự động được đăng xuất để bảo mật.
          </p>
        </Flex>

        {/* Success Alert */}
        {isSuccess ? (
          <div className="space-y-5 animate-fade-in">
            <Alert
              type="success"
              showIcon
              title={<span className="font-black text-sm">Đổi mật khẩu thành công!</span>}
              description="Mật khẩu của bạn đã được cập nhật thành công. Phiên đăng nhập hiện tại đã được gia hạn và tất cả các thiết bị khác đã được đăng xuất an toàn."
              className="!rounded-2xl !border-2 !border-emerald-200 !bg-emerald-50 dark:!bg-emerald-950/30 dark:!border-emerald-800"
            />

            <Flex gap={12} className="pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/ai-tutor')}
                className="flex-1 !h-11 !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-sm tracking-wide"
              >
                Tiếp tục học cùng AI Tutor
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSuccess(false)}
                className="!h-11 !rounded-2xl !border-2 !border-slate-200 font-bold text-xs"
              >
                Đổi lại
              </Button>
            </Flex>
          </div>
        ) : (
          <Form<ChangePasswordFormValues>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="space-y-4"
          >
            {generalError && (
              <Alert
                type="error"
                showIcon
                title={generalError}
                className="!rounded-2xl !border-2 !border-rose-200 !bg-rose-50 text-xs font-bold"
              />
            )}

            {/* Current Password */}
            <Form.Item
              name="currentPassword"
              label={
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mật khẩu hiện tại
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại của bạn' }]}
              className="!mb-3"
            >
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu hiện tại..."
                prefix={<LockOutlined className="text-slate-400 mr-1.5" />}
                className="!rounded-2xl !py-2.5 font-medium !border-2 text-sm"
              />
            </Form.Item>

            {/* New Password */}
            <Form.Item
              name="newPassword"
              label={
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mật khẩu mới
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                {
                  validator(_, val) {
                    if (!val) return Promise.resolve()
                    if (val.length < 8) {
                      return Promise.reject(new Error('Mật khẩu phải có ít nhất 8 ký tự'))
                    }
                    if (!/[a-zA-Z]/.test(val) || !/\d/.test(val)) {
                      return Promise.reject(new Error('Mật khẩu phải bao gồm cả chữ cái và chữ số'))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
              className="!mb-3"
            >
              <Input.Password
                size="large"
                placeholder="Tối thiểu 8 ký tự, có chữ và số..."
                prefix={<KeyOutlined className="text-slate-400 mr-1.5" />}
                className="!rounded-2xl !py-2.5 font-medium !border-2 text-sm"
              />
            </Form.Item>

            {/* Confirm New Password */}
            <Form.Item
              name="confirmNewPassword"
              label={
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Xác nhận mật khẩu mới
                </span>
              }
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận lại mật khẩu mới' },
                ({ getFieldValue }) => ({
                  validator(_, val) {
                    if (!val || getFieldValue('newPassword') === val) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp'))
                  },
                }),
              ]}
              className="!mb-4"
            >
              <Input.Password
                size="large"
                placeholder="Nhập lại mật khẩu mới..."
                prefix={<LockOutlined className="text-slate-400 mr-1.5" />}
                className="!rounded-2xl !py-2.5 font-medium !border-2 text-sm"
              />
            </Form.Item>

            {/* Live Password Requirements Checklist */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 space-y-1.5 text-xs">
              <p className="font-black text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                Yêu cầu mật khẩu an toàn:
              </p>

              <Flex
                align="center"
                gap={6}
                className={isMinLength ? 'text-emerald-600' : 'text-slate-400'}
              >
                {isMinLength ? (
                  <CheckCircleFilled />
                ) : (
                  <CloseCircleFilled className="text-slate-300" />
                )}
                <span className="font-bold">Độ dài tối thiểu 8 ký tự</span>
              </Flex>

              <Flex
                align="center"
                gap={6}
                className={hasLetterAndDigit ? 'text-emerald-600' : 'text-slate-400'}
              >
                {hasLetterAndDigit ? (
                  <CheckCircleFilled />
                ) : (
                  <CloseCircleFilled className="text-slate-300" />
                )}
                <span className="font-bold">Bao gồm cả chữ cái và chữ số</span>
              </Flex>

              <Flex
                align="center"
                gap={6}
                className={isMatched ? 'text-emerald-600' : 'text-slate-400'}
              >
                {isMatched ? (
                  <CheckCircleFilled />
                ) : (
                  <CloseCircleFilled className="text-slate-300" />
                )}
                <span className="font-bold">Hai mật khẩu nhập trùng khớp</span>
              </Flex>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className={cn(
                  'w-full !h-12 !rounded-2xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-4 !border-[#46a302] active:!border-b-2 active:!translate-y-[2px] !text-white !font-black !text-sm uppercase tracking-wider shadow-xs cursor-pointer',
                  isSubmitting && 'opacity-70 cursor-not-allowed',
                )}
              >
                {isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Xác nhận đổi mật khẩu'}
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
