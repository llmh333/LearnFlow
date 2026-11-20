import { useNavigate } from 'react-router-dom'
import { Alert, Button, Flex } from 'antd'
import { ClockCircleOutlined, ThunderboltFilled } from '@ant-design/icons'
import { ApiError } from '@/api/client'

interface AiQuotaNoticeProps {
  error: unknown
  userTimezone?: string
  onOpenProfile?: () => void
}

/**
 * Prominently surfaces the daily AI limit error (HTTP 429) per D8 & Phase R0 checklist,
 * explaining the 50-call limit, midnight reset in the user's timezone, and offering
 * alternative study actions (Vocabulary JLPT, Kanji review) that do not cost quota.
 */
export function AiQuotaNotice({ error, userTimezone, onOpenProfile }: AiQuotaNoticeProps) {
  const navigate = useNavigate()
  if (!error) return null

  const isQuota429 = error instanceof ApiError && error.status === 429

  // Non-429 errors render as regular alerts
  if (!isQuota429) {
    const message =
      error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
    return (
      <Alert
        type="error"
        showIcon
        title={message}
        className="!rounded-2xl !border-2 !border-rose-200 !bg-rose-50 text-xs font-bold"
      />
    )
  }

  return (
    <div
      data-testid="ai-quota-exceeded-notice"
      className="rounded-3xl border-2 border-b-4 border-amber-300 bg-[#FFF9E6] p-4 sm:p-5 dark:border-amber-700/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 shadow-xs animate-fade-in"
    >
      <Flex align="flex-start" gap={14}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFC800] text-amber-950 border border-amber-400 shadow-xs">
          <ClockCircleOutlined className="text-xl" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <h4 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>Đã dùng hết lượt AI hôm nay</span>
              <span className="rounded-full bg-amber-200/90 dark:bg-amber-800/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-100">
                Hết hạn mức (429)
              </span>
            </h4>
          </div>

          <p className="text-xs sm:text-sm font-medium text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            Bạn đã sử dụng hết hạn mức <strong>50 lượt gọi AI</strong> của ngày hôm nay. Hạn mức sẽ
            tự động được làm mới vào lúc <strong>00:00 (nửa đêm)</strong> theo múi giờ tài khoản của
            bạn{userTimezone ? ` (${userTimezone})` : ''}.
          </p>

          <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-300/80 mt-1">
            💡 Gợi ý: Bạn vẫn có thể tiếp tục tra cứu từ điển JLPT, tập nét viết Kanji hoặc ôn tập
            từ vựng — các tính năng này hoàn toàn miễn phí và không giới hạn!
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/60">
            <Button
              type="primary"
              size="middle"
              icon={<ThunderboltFilled />}
              onClick={() => navigate('/vocabulary')}
              className="!h-9 !px-4 !rounded-xl !bg-[#58cc02] hover:!bg-[#61e002] !border-b-2 !border-[#46a302] !text-white text-xs font-black cursor-pointer shadow-xs"
            >
              Ôn tập Từ vựng JLPT (Không tốn lượt)
            </Button>
            {onOpenProfile && (
              <Button
                type="default"
                size="middle"
                onClick={onOpenProfile}
                className="!h-9 !px-3.5 !rounded-xl !border-2 !border-amber-300 text-xs font-bold text-amber-900 dark:text-amber-100 hover:!bg-amber-100 dark:hover:!bg-amber-900/50 cursor-pointer"
              >
                ⚙️ Xem múi giờ tài khoản
              </Button>
            )}
          </div>
        </div>
      </Flex>
    </div>
  )
}
