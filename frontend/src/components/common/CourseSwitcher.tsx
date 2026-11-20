import { Flex, Popover, Radio } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCheck,
  IconChevronDown,
  IconGraduationCap,
  IconSparkles,
  LanguageFlagBadge,
} from '@/assets'
import { Button } from '@/components/ui/Button'
import { COURSES, COURSES_BY_CODE, type CourseDefinition } from '@/lib/courses'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/stores/uiStore'

interface CourseSwitcherProps {
  className?: string
}

export function CourseSwitcher({ className }: CourseSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const userLevels = useUiStore((state) => state.userLevels)
  const setUserLevel = useUiStore((state) => state.setUserLevel)

  const activeCourse = COURSES_BY_CODE[selectedLanguageCode] ?? COURSES[0]
  const currentLevel = userLevels[selectedLanguageCode] ?? activeCourse.defaultLevel

  // antd Popover closes on outside click but not on Escape.
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function handleOpenOnboarding() {
    setIsOpen(false)
    navigate('/onboarding')
  }

  const content = (
    <div className="w-80 sm:w-96">
      {/* Popover Header */}
      <Flex
        align="center"
        justify="space-between"
        className="border-b border-slate-100 pb-3 mb-3 dark:border-[#25343B]"
      >
        <Flex align="center" gap={8}>
          <Flex
            component="span"
            align="center"
            justify="center"
            className="h-7 w-7 rounded-xl bg-[#58CC02]/15 text-[#58CC02]"
          >
            <IconSparkles size={16} />
          </Flex>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Course &amp; Level Switcher
            </h4>
            <p className="text-[11px] text-slate-400">Choose active language or adjust level</p>
          </div>
        </Flex>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          3 Languages
        </span>
      </Flex>

      {/* Courses: a radio group, so arrow keys move between them */}
      <Radio.Group
        value={selectedLanguageCode}
        onChange={(event) => setSelectedLanguageCode(event.target.value as string)}
        aria-label="Course"
        className="w-full"
      >
        <Flex vertical gap={10}>
          {COURSES.map((course) => (
            <CourseOption
              key={course.code}
              course={course}
              isCurrent={course.code === selectedLanguageCode}
              level={userLevels[course.code] ?? course.defaultLevel}
              onSelectLevel={(levelCode) => setUserLevel(course.code, levelCode)}
            />
          ))}
        </Flex>
      </Radio.Group>

      {/* Footer CTA: Retake Onboarding / Level Placement */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#25343B]">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenOnboarding}
          className="w-full py-2.5 font-black"
        >
          <IconGraduationCap size={16} />
          <span>Full Level Placement &amp; Goal Setup</span>
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      content={content}
      classNames={{
        container:
          'rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4 shadow-2xl dark:border-[#2B3940] dark:bg-[#1A262C]',
      }}
    >
      {/* Tactile 3D Pill Button replacing crude native select */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Current course: ${activeCourse.name}, Level: ${currentLevel}. Click to change.`}
        className={cn(
          'group inline-flex items-center gap-2 rounded-2xl border-2 px-3 py-1.5 text-xs font-black transition-all select-none cursor-pointer',
          'border-b-4 active:border-b-2 active:translate-y-[2px]',
          isOpen
            ? 'border-[#1CB0F6] bg-sky-50 text-sky-900 shadow-sm dark:border-[#1899D6] dark:bg-sky-950/40 dark:text-sky-200'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 dark:hover:bg-[#202F36]',
          className,
        )}
      >
        <LanguageFlagBadge code={selectedLanguageCode} size={20} />
        <span className="font-extrabold text-slate-800 dark:text-slate-100">
          {activeCourse.name.split(' ')[0]}
        </span>
        <span className="rounded-full bg-[#E5F6FD] px-2 py-0.5 text-[11px] font-black text-[#0284C7] dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          {currentLevel}
        </span>
        <IconChevronDown
          size={14}
          className={cn(
            'text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-[#1CB0F6]',
          )}
        />
      </button>
    </Popover>
  )
}

interface CourseOptionProps {
  course: CourseDefinition
  isCurrent: boolean
  level: string
  onSelectLevel: (levelCode: string) => void
}

function CourseOption({ course, isCurrent, level, onSelectLevel }: CourseOptionProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-3 transition-all',
        isCurrent
          ? 'border-[#1CB0F6] bg-sky-50/60 dark:border-[#1899D6] dark:bg-sky-950/30'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#162025]',
      )}
    >
      {/* The radio dot is hidden; the whole row is the clickable label. */}
      <Radio
        value={course.code}
        className="m-0 flex w-full cursor-pointer [&_.ant-radio]:sr-only [&>span:last-child]:w-full [&>span:last-child]:p-0"
      >
        <Flex align="center" justify="space-between" component="span" className="w-full">
          <Flex align="center" gap={10} component="span">
            <LanguageFlagBadge code={course.code} size={24} />
            <span className="block">
              <Flex align="center" gap={8} component="span">
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {course.name}
                </span>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {course.nativeName}
                </span>
              </Flex>
              <span className="block text-[11px] text-slate-400 font-medium">{course.tagline}</span>
            </span>
          </Flex>

          <Flex align="center" gap={8} component="span">
            <span className="rounded-full bg-white dark:bg-[#1B272C] px-2.5 py-1 text-xs font-black text-[#0284C7] border border-sky-200 dark:border-sky-800 shadow-2xs">
              {level}
            </span>
            {isCurrent && (
              <Flex
                component="span"
                align="center"
                justify="center"
                className="h-6 w-6 rounded-full bg-[#58CC02] text-white"
              >
                <IconCheck size={14} />
              </Flex>
            )}
          </Flex>
        </Flex>
      </Radio>

      {/* Level Pill Quick Switcher (Visible when course is selected) */}
      {isCurrent && (
        <div className="mt-3 pt-2.5 border-t border-sky-100 dark:border-sky-900/50">
          <Flex align="center" justify="space-between" className="mb-1.5">
            <span className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 tracking-wider">
              Select Level:
            </span>
            <span className="text-[10px] text-slate-400">
              {course.levels.find((l) => l.code === level)?.description.slice(0, 32)}...
            </span>
          </Flex>
          <Radio.Group
            value={level}
            onChange={(event) => onSelectLevel(event.target.value as string)}
            aria-label={`${course.name} level`}
            className="flex flex-wrap gap-1.5"
          >
            {course.levels.map((lvl) => {
              const isLevelActive = lvl.code === level
              return (
                <Radio.Button
                  key={lvl.code}
                  value={lvl.code}
                  title={lvl.description}
                  className={cn(
                    'h-auto rounded-xl border px-2.5 py-1 text-xs leading-normal font-black transition-all before:hidden',
                    isLevelActive
                      ? 'bg-[#1CB0F6] text-white hover:text-white border-[#1899D6] shadow-xs scale-105'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:bg-[#1A262C] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                  )}
                >
                  {lvl.code}
                </Radio.Button>
              )
            })}
          </Radio.Group>
        </div>
      )}
    </div>
  )
}
