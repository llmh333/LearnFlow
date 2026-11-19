import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flowy,
  FlowyHappy,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFlame,
  IconGraduationCap,
  IconSparkles,
  IconTrophy,
  IconZap,
  LanguageFlagBadge,
} from '@/assets'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useProfile, useUpdateProfile } from '@/hooks/useAccount'
import {
  COURSES,
  COURSES_BY_CODE,
  DAILY_TARGET_OPTIONS,
  GOAL_OPTIONS,
  type LevelDefinition,
} from '@/lib/courses'
import { cn } from '@/lib/cn'
import { isMockMode, updateMockProfile } from '@/mock'
import { useUiStore } from '@/stores/uiStore'
import type { LearningGoal } from '@/types/domain'

type OnboardingStep = 1 | 2 | 3 | 4 | 5

export function OnboardingPage() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const updateProfileMutation = useUpdateProfile()

  const currentLang = useUiStore((state) => state.selectedLanguageCode)
  const userLevels = useUiStore((state) => state.userLevels)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const setUserLevel = useUiStore((state) => state.setUserLevel)
  const setOnboarded = useUiStore((state) => state.setOnboarded)

  // Step state
  const [step, setStep] = useState<OnboardingStep>(1)
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLang || 'en')
  const [selectedLevel, setSelectedLevel] = useState<string>(
    () => userLevels[selectedLanguage] || COURSES_BY_CODE[selectedLanguage]?.defaultLevel || 'B1',
  )
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal>(
    () => profile?.goal || 'CONVERSATION',
  )
  const [selectedDailyMinutes, setSelectedDailyMinutes] = useState<number>(
    () => profile?.dailyMinutes || 10,
  )

  const activeCourse = COURSES_BY_CODE[selectedLanguage] ?? COURSES[0]

  // When changing language, reset chosen level to that course's default
  function handleSelectLanguage(code: string) {
    setSelectedLanguage(code)
    const targetCourse = COURSES_BY_CODE[code] ?? COURSES[0]
    setSelectedLevel(userLevels[code] || targetCourse.defaultLevel)
  }

  function handleNextStep() {
    if (step < 5) {
      setStep((prev) => (prev + 1) as OnboardingStep)
    }
  }

  function handlePrevStep() {
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep)
    }
  }

  async function handleFinish() {
    // 1. Update UI Store
    setSelectedLanguageCode(selectedLanguage)
    setUserLevel(selectedLanguage, selectedLevel)
    setOnboarded(true)

    // 2. Persist to Backend Profile / Mock Profile
    const nowIso = new Date().toISOString()
    if (isMockMode()) {
      updateMockProfile({
        goal: selectedGoal,
        dailyMinutes: selectedDailyMinutes,
      })
      // set onboarded timestamp in mock
      const mockProfile = updateMockProfile({})
      mockProfile.onboardedAt = nowIso
    }

    try {
      await updateProfileMutation.mutateAsync({
        goal: selectedGoal,
        dailyMinutes: selectedDailyMinutes,
      })
    } catch {
      // ignore network errors if mock or backend offline
    }

    navigate('/ai-tutor', { replace: true })
  }

  const stepProgress = (step / 5) * 100

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#374151] dark:bg-[#131F24] dark:text-[#E5E7EB] flex flex-col justify-between selection:bg-[#58CC02] selection:text-white">
      {/* Top Header & Wizard Progress */}
      <header className="sticky top-0 z-20 border-b-2 border-slate-200 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md dark:border-[#2B3940] dark:bg-[#1A262C]/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                aria-label="Previous step"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-all"
              >
                <IconArrowLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
              <Flowy size={26} />
              <span className="text-base tracking-tight">LearnFlow Onboarding</span>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-4">
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Step {step} of 5</span>
              <span>{Math.round(stepProgress)}% Completed</span>
            </div>
          </div>

          {/* Quick Skip button */}
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
          >
            Skip to App
          </button>
        </div>
      </header>

      {/* Main Wizard Content Area */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Step 1: Select Language Course */}
        {step === 1 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#1A262C] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-xs">
                <Flowy size={40} className="animate-bounce-playful" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F6FD] px-3 py-0.5 text-xs font-black text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300 mb-1">
                  <IconSparkles size={13} />
                  <span>Bước 1: Chọn Khóa Học</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Bạn muốn chinh phục ngôn ngữ nào?
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  LearnFlow hỗ trợ học chuyên sâu 3 ngôn ngữ với AI Tutor, từ vựng và luyện phản xạ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {COURSES.map((course) => {
                const isSelected = selectedLanguage === course.code
                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => handleSelectLanguage(course.code)}
                    className={cn(
                      'group relative flex flex-col justify-between rounded-3xl p-5 text-left transition-all border-2 border-b-4 cursor-pointer',
                      'hover:-translate-y-0.5 active:translate-y-0 active:border-b-2',
                      isSelected
                        ? 'border-[#58CC02] bg-[#F3FCE8] shadow-md dark:border-[#46A302] dark:bg-emerald-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#1A262C] dark:hover:bg-[#202F36]',
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <LanguageFlagBadge code={course.code} size={36} />
                        {isSelected ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#58CC02] text-white shadow-xs">
                            <IconCheck size={16} />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-800 dark:text-white">
                        {course.name}
                      </h3>
                      <p className="text-xs font-bold text-[#58CC02] mt-0.5">{course.nativeName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-black text-slate-400">
                      <span>{course.tagline}</span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-300">
                        {course.levels.length} Cấp độ
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Starting Proficiency Level */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#1A262C] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-xs">
                <Flowy size={40} className="animate-bounce-playful" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-1">
                  <IconGraduationCap size={13} />
                  <span>Bước 2: Trình Độ Bắt Đầu</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Trình độ {activeCourse.name.split(' ')[0]} của bạn?</span>
                  <LanguageFlagBadge code={activeCourse.code} size={28} />
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Chọn trình độ phù hợp nhất để AI đề xuất từ vựng và kịch bản hội thoại đúng sức.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {activeCourse.levels.map((level: LevelDefinition) => {
                const isSelected = selectedLevel === level.code
                return (
                  <button
                    key={level.code}
                    type="button"
                    onClick={() => setSelectedLevel(level.code)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-3xl p-4 sm:p-5 text-left transition-all border-2 border-b-4 cursor-pointer',
                      'hover:-translate-y-0.5 active:translate-y-0 active:border-b-2',
                      isSelected
                        ? 'border-[#1CB0F6] bg-sky-50 shadow-md dark:border-[#1899D6] dark:bg-sky-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#1A262C] dark:hover:bg-[#202F36]',
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          'flex h-12 w-16 sm:w-20 shrink-0 items-center justify-center rounded-2xl font-black text-sm border shadow-2xs',
                          level.pillColor,
                        )}
                      >
                        {level.code}
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white">
                          {level.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {level.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isSelected ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1CB0F6] text-white shadow-xs">
                          <IconCheck size={16} />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Learning Goal */}
        {step === 3 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <IconTrophy size={36} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-1">
                  <IconZap size={13} />
                  <span>Bước 3: Mục Tiêu Học Tập</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Mục tiêu chính khi học của bạn là gì?
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  LearnFlow sẽ ưu tiên các bài luyện tập và chủ đề tương thích với động lực của bạn.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = selectedGoal === opt.goal
                return (
                  <button
                    key={opt.goal}
                    type="button"
                    onClick={() => setSelectedGoal(opt.goal)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-3xl p-5 text-left transition-all border-2 border-b-4 cursor-pointer',
                      'hover:-translate-y-0.5 active:translate-y-0 active:border-b-2',
                      isSelected
                        ? 'border-[#FF9600] bg-[#FFF5CC] shadow-md dark:border-[#D97706] dark:bg-amber-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#1A262C] dark:hover:bg-[#202F36]',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#162025] text-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {opt.iconEmoji}
                      </span>
                      <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-white">
                          {opt.title}
                        </h4>
                        <p className="text-xs font-bold text-[#FF9600] mt-0.5">{opt.subtitle}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isSelected ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF9600] text-white shadow-xs">
                          <IconCheck size={16} />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Select Daily Time Commitment */}
        {step === 4 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF9600]/15 text-[#FF9600]">
                <IconFlame size={36} className="animate-bounce-playful" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-black text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 mb-1">
                  <IconClock size={13} />
                  <span>Bước 4: Thời Gian Cam Kết Mỗi Ngày</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Bạn muốn dành bao nhiêu phút mỗi ngày?
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Đều đặn mỗi ngày quan trọng hơn học dồn một lần. Bạn có thể thay đổi bất kỳ lúc
                  nào.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {DAILY_TARGET_OPTIONS.map((opt) => {
                const isSelected = selectedDailyMinutes === opt.minutes
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setSelectedDailyMinutes(opt.minutes)}
                    className={cn(
                      'group relative flex flex-col justify-between rounded-3xl p-5 text-left transition-all border-2 border-b-4 cursor-pointer',
                      'hover:-translate-y-0.5 active:translate-y-0 active:border-b-2',
                      isSelected
                        ? 'border-[#58CC02] bg-[#F3FCE8] shadow-md dark:border-[#46A302] dark:bg-emerald-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#1A262C] dark:hover:bg-[#202F36]',
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#58CC02] text-white shadow-xs">
                            <IconCheck size={16} />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {opt.tagline}
                      </p>
                    </div>

                    {opt.recommended && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9600] px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-2xs">
                          ⭐ Khuyên Dùng
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 5: Summary & Celebration */}
        {step === 5 && (
          <div className="w-full space-y-6 text-center animate-scale-in">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-[#1A262C] border-4 border-b-8 border-slate-200 dark:border-[#2B3940] shadow-xl">
              <FlowyHappy size={70} className="animate-bounce-playful" />
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC800] text-white border-2 border-white shadow-sm">
                ⭐
              </span>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2">
                <IconSparkles size={14} />
                <span>Tuyệt Vời! Hồ Sơ Của Bạn Đã Sẵn Sàng</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                Chào Mừng Bạn Đến Với LearnFlow!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Lộ trình học tập đã được tùy biến riêng cho bạn. Cùng bắt đầu hành trình chinh phục
                ngôn ngữ ngay hôm nay!
              </p>
            </div>

            {/* Summary Card */}
            <Card className="mx-auto max-w-lg p-5 rounded-3xl border-2 border-b-4 border-slate-200 dark:border-[#2B3940] bg-white dark:bg-[#1A262C] text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Khóa Học:</span>
                <div className="flex items-center gap-2">
                  <LanguageFlagBadge code={activeCourse.code} size={20} />
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    {activeCourse.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Trình Độ Bắt Đầu:
                </span>
                <span className="rounded-full bg-sky-100 dark:bg-sky-950/60 px-2.5 py-0.5 text-xs font-black text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {selectedLevel} -{' '}
                  {activeCourse.levels.find((l) => l.code === selectedLevel)?.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Mục Tiêu:</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {GOAL_OPTIONS.find((g) => g.goal === selectedGoal)?.title}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Cam Kết:</span>
                <span className="text-xs font-black text-[#58CC02]">
                  {selectedDailyMinutes} phút mỗi ngày
                </span>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="sticky bottom-0 z-20 border-t-2 border-slate-200 bg-white/95 px-4 sm:px-8 py-4 backdrop-blur-md dark:border-[#2B3940] dark:bg-[#1A262C]/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handlePrevStep}
              className="gap-2"
            >
              <IconArrowLeft size={18} />
              <span>Quay Lại</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNextStep}
              className="gap-2 px-8 min-w-[160px]"
            >
              <span>Tiếp Tục</span>
              <IconArrowRight size={18} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleFinish}
              className="gap-2 px-8 bg-[#58CC02] hover:bg-[#52be02] border-[#46A302] shadow-md animate-pulse-glow"
            >
              <span>🚀 Bắt Đầu Học Ngay!</span>
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
