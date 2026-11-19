import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCheck,
  IconChevronDown,
  IconGraduationCap,
  IconSparkles,
  LanguageFlagBadge,
} from '@/assets'
import { COURSES, COURSES_BY_CODE } from '@/lib/courses'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/stores/uiStore'

interface CourseSwitcherProps {
  className?: string
}

export function CourseSwitcher({ className }: CourseSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const setSelectedLanguageCode = useUiStore((state) => state.setSelectedLanguageCode)
  const userLevels = useUiStore((state) => state.userLevels)
  const setUserLevel = useUiStore((state) => state.setUserLevel)

  const activeCourse = COURSES_BY_CODE[selectedLanguageCode] ?? COURSES[0]
  const currentLevel = userLevels[selectedLanguageCode] ?? activeCourse.defaultLevel

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelectCourse(code: string) {
    setSelectedLanguageCode(code)
  }

  function handleSelectLevel(courseCode: string, levelCode: string) {
    setUserLevel(courseCode, levelCode)
  }

  function handleOpenOnboarding() {
    setIsOpen(false)
    navigate('/onboarding')
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      {/* Tactile 3D Pill Button replacing crude native select */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current course: ${activeCourse.name}, Level: ${currentLevel}. Click to change.`}
        className={cn(
          'group flex items-center gap-2 rounded-2xl border-2 px-3 py-1.5 text-xs font-black transition-all select-none cursor-pointer',
          'border-b-4 active:border-b-2 active:translate-y-[2px]',
          isOpen
            ? 'border-[#1CB0F6] bg-sky-50 text-sky-900 shadow-sm dark:border-[#1899D6] dark:bg-sky-950/40 dark:text-sky-200'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 dark:hover:bg-[#202F36]',
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

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4 shadow-2xl z-50 animate-scale-in dark:border-[#2B3940] dark:bg-[#1A262C]">
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 dark:border-[#25343B]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#58CC02]/15 text-[#58CC02]">
                <IconSparkles size={16} />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Course &amp; Level Switcher
                </h4>
                <p className="text-[11px] text-slate-400">Choose active language or adjust level</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              3 Languages
            </span>
          </div>

          {/* Courses List */}
          <div className="space-y-2.5">
            {COURSES.map((course) => {
              const isCurrentCourse = course.code === selectedLanguageCode
              const courseLevel = userLevels[course.code] ?? course.defaultLevel

              return (
                <div
                  key={course.code}
                  className={cn(
                    'rounded-2xl border-2 p-3 transition-all',
                    isCurrentCourse
                      ? 'border-[#1CB0F6] bg-sky-50/60 dark:border-[#1899D6] dark:bg-sky-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-[#2B3940] dark:bg-[#162025]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCourse(course.code)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <LanguageFlagBadge code={course.code} size={24} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {course.name}
                          </span>
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {course.nativeName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">{course.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white dark:bg-[#1B272C] px-2.5 py-1 text-xs font-black text-[#0284C7] border border-sky-200 dark:border-sky-800 shadow-2xs">
                        {courseLevel}
                      </span>
                      {isCurrentCourse && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#58CC02] text-white">
                          <IconCheck size={14} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Level Pill Quick Switcher (Visible when course is selected) */}
                  {isCurrentCourse && (
                    <div className="mt-3 pt-2.5 border-t border-sky-100 dark:border-sky-900/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 tracking-wider">
                          Select Level:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {course.levels
                            .find((l) => l.code === courseLevel)
                            ?.description.slice(0, 32)}
                          ...
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {course.levels.map((lvl) => {
                          const isLevelActive = lvl.code === courseLevel
                          return (
                            <button
                              key={lvl.code}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectLevel(course.code, lvl.code)
                              }}
                              title={lvl.description}
                              className={cn(
                                'rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer border',
                                isLevelActive
                                  ? 'bg-[#1CB0F6] text-white border-[#1899D6] shadow-xs scale-105'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100 dark:bg-[#1A262C] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                              )}
                            >
                              {lvl.code}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer CTA: Retake Onboarding / Level Placement */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#25343B]">
            <button
              type="button"
              onClick={handleOpenOnboarding}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#58CC02] border-2 border-b-4 border-[#46A302] py-2.5 px-3 text-xs font-black text-white shadow-xs hover:bg-[#52be02] active:border-b-2 active:translate-y-[2px] cursor-pointer transition-all"
            >
              <IconGraduationCap size={16} />
              <span>Full Level Placement &amp; Goal Setup</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
