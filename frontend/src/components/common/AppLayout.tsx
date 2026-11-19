import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import {
  IconBot,
  IconBook,
  IconFlame,
  IconLogOut,
  IconMenu,
  IconSettings,
  IconTrophy,
  IconZap,
  IconCheck,
  IconX,
  Flowy,
  StreakFlameBadge,
  QuestTargetBadge,
} from '@/assets'
import { ProfileDialog } from '@/components/account/ProfileDialog'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { CourseSwitcher } from '@/components/common/CourseSwitcher'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { cn } from '@/lib/cn'
import { useProfile } from '@/hooks/useAccount'
import { useAuth } from '@/hooks/useAuth'
import { useHealth } from '@/hooks/useHealth'
import { isMockMode, setMockMode } from '@/mock'
import { useUiStore } from '@/stores/uiStore'

const NAV_ITEMS = [
  { to: '/ai-tutor', label: 'AI Tutor', icon: IconBot, emoji: '💬', badge: 'Live' },
  { to: '/sources', label: 'Curriculum & Sources', icon: IconBook, emoji: '📚' },
]

const TARGET_LANG_META: Record<
  string,
  { label: string; level: string; desc: string; progress: string }
> = {
  en: {
    label: 'English',
    level: 'CEFR B1',
    desc: 'Mastering natural conversational phrases, idioms, and everyday English.',
    progress: '45% to B1',
  },
  zh: {
    label: 'Chinese (中文)',
    level: 'HSK 2',
    desc: 'Mastering Pinyin, 300 core Hanzi characters, and daily sentence patterns.',
    progress: '45% to HSK 2',
  },
  ja: {
    label: 'Japanese (日本語)',
    level: 'JLPT N5',
    desc: 'Mastering essential vocabulary, Kana, and core everyday patterns.',
    progress: '45% to N5',
  },
}

const WEEK_DAYS = [
  { label: 'M', done: true },
  { label: 'T', done: true },
  { label: 'W', done: true },
  { label: 'T', done: true },
  { label: 'F', done: true },
  { label: 'S', done: false, current: true },
  { label: 'S', done: false },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const selectedLanguageCode = useUiStore((state) => state.selectedLanguageCode)
  const userLevels = useUiStore((state) => state.userLevels)
  const isOnboarded = useUiStore((state) => state.isOnboarded)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mockActive, setMockActive] = useState(() => isMockMode())
  const health = useHealth(!mockActive)

  // If newly registered user has not completed onboarding, redirect to onboarding wizard
  if (!isProfileLoading && profile && profile.onboardedAt === null && !isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  function toggleMockMode() {
    const next = !mockActive
    setMockMode(next)
    setMockActive(next)
    window.location.reload()
  }

  const langMeta = TARGET_LANG_META[selectedLanguageCode] ?? TARGET_LANG_META.en
  const currentLevel = userLevels[selectedLanguageCode] ?? langMeta.level
  const userInitial =
    user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#374151] dark:bg-[#131F24] dark:text-[#E5E7EB]">
      {/* Top Gaming HUD Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-[#2B3940] dark:bg-[#1B272C]/95">
        {/* Left: Brand Logo & Mascot */}
        <div className="flex items-center gap-3">
          <NavLink to="/ai-tutor" className="group flex items-center gap-2.5 select-none">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-[#1B272C] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-sm transition-transform group-hover:scale-105 active:scale-95">
              <Flowy size={32} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                  LearnFlow
                </span>
                <span className="h-2 w-2 rounded-full bg-[#58CC02]" />
              </div>
              <p className="text-[11px] font-extrabold tracking-wide text-[#58CC02] uppercase">
                EN • 中文 • 日本語
              </p>
            </div>
          </NavLink>
        </div>

        {/* Center: Language & Stats HUD */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Target Language & Level Switcher (Gamified popover replacing crude OS select) */}
          <CourseSwitcher />

          {/* Streak Flame Pill */}
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-amber-200 bg-[#FFF5CC] px-3 py-1.5 text-xs font-black text-[#A16800] dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
            <IconFlame size={16} className="text-[#FF9600] animate-bounce-playful" />
            <span>7 Days</span>
          </div>

          {/* Mock / Live Backend Status Pill */}
          {mockActive ? (
            <div className="flex items-center gap-1.5 rounded-2xl border-2 border-emerald-200 bg-[#D7FFB8] px-3 py-1 text-xs font-bold text-[#347800] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-[#58CC02] animate-pulse" />
              <span>Mock Data</span>
              <button
                type="button"
                onClick={toggleMockMode}
                className="ml-1 text-[10px] font-extrabold underline opacity-80 hover:opacity-100 cursor-pointer"
                title="Switch to Real Backend"
              >
                Off
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:border-[#2B3940] dark:bg-[#1A262C] dark:text-slate-300">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  health.data?.status === 'UP' ? 'bg-[#58CC02] animate-pulse' : 'bg-amber-400',
                )}
              />
              <span>{health.data?.status === 'UP' ? 'Live API 🟢' : 'Connecting API…'}</span>
            </div>
          )}
        </div>

        {/* Right: Actions, Theme & Profile */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Profile Trigger Button */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 cursor-pointer select-none"
            title="Learning profile settings"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1CB0F6] text-xs font-black text-white">
              {userInitial}
            </div>
            <span className="hidden md:inline font-bold max-w-[110px] truncate">
              {user?.displayName || 'Learner'}
            </span>
            <IconSettings size={15} className="text-slate-400" />
          </button>

          {/* Logout Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLogoutConfirmOpen(true)}
            className="hidden sm:inline-flex text-rose-600 hover:text-rose-700"
            title="Log out"
          >
            <IconLogOut size={16} />
          </Button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-2xl border-2 border-slate-200 p-2 text-slate-600 hover:bg-slate-100 sm:hidden dark:border-[#2B3940] dark:text-slate-300 dark:hover:bg-[#1B272C]"
          >
            {mobileMenuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </header>

      {/* Main 3-Column Learning Playground */}
      <div className="mx-auto flex max-w-[1536px] gap-6 p-4 sm:p-6 lg:p-8">
        {/* Column 1: Left Navigation Rail (Desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold transition-all duration-100 select-none cursor-pointer border-2 border-b-4',
                    isActive
                      ? 'border-[#46A302] bg-[#58CC02] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px] dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 dark:hover:bg-[#223238]',
                  )
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3">
                    <span className="text-lg transition-transform group-hover:scale-110">
                      {item.emoji}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="rounded-full bg-[#1CB0F6] px-1.5 py-0.5 text-[10px] font-black text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Cheerful Mascot Motivational Card */}
          <div className="rounded-3xl border-2 border-b-4 border-amber-200 bg-[#FFF5CC] p-4 text-[#A16800] dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Flowy size={32} className="animate-bounce-playful" />
              <span className="text-xs font-black uppercase tracking-wider">Flowy Companion</span>
            </div>
            <p className="text-xs leading-relaxed font-bold">
              &quot;Học ngoại ngữ để kết nối mọi người! Luyện tập 10 phút mỗi ngày cùng cộng đồng
              toàn cầu.&quot;
            </p>
          </div>

          {/* Quick Mock Mode Switcher if in live mode */}
          {!mockActive && (
            <button
              type="button"
              onClick={toggleMockMode}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-3 text-xs font-bold text-slate-500 hover:border-[#1CB0F6] hover:text-[#1CB0F6] transition-colors dark:border-slate-700 dark:text-slate-400"
            >
              <span>⚡ Switch to Mock Mode</span>
            </button>
          )}
        </aside>

        {/* Column 2: Center Learning Stage */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

        {/* Column 3: Right Quests & Daily Activity Rail (Visible on xl screens) */}
        <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5">
          {/* Daily Quests Board */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QuestTargetBadge size={22} />
                <h3 className="font-black text-slate-800 dark:text-white text-sm">Daily Quests</h3>
              </div>
              <span className="text-xs font-bold text-[#58CC02]">2 / 3 Done</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#58CC02] text-white">
                  <IconCheck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Daily Check-in
                  </p>
                  <p className="text-[11px] text-slate-400">Completed today</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#58CC02] text-white">
                  <IconCheck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Conversation Practice
                  </p>
                  <p className="text-[11px] text-slate-400">Practice 1 conversation</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1CB0F6] text-white">
                  <IconZap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Grammar Clinic
                  </p>
                  <p className="text-[11px] text-slate-400">Ask 1 grammar question</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Habit Tracker */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <StreakFlameBadge size={22} />
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Weekly Streak</h3>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEK_DAYS.map((d, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-400">{d.label}</span>
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-xl font-black text-xs transition-transform',
                      d.done
                        ? 'bg-[#FF9600] text-white border-b-2 border-[#D97706]'
                        : d.current
                          ? 'border-2 border-dashed border-[#FF9600] text-[#FF9600]'
                          : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600',
                    )}
                  >
                    {d.done ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Progress Milestone */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconTrophy size={18} className="text-[#FFC800]" />
                <h3 className="font-black text-slate-800 dark:text-white text-sm">
                  Target: {currentLevel}
                </h3>
              </div>
              <NavLink
                to="/onboarding"
                className="text-[11px] font-bold text-[#1CB0F6] hover:underline"
              >
                Change Level
              </NavLink>
            </div>
            <p className="text-xs text-slate-500 mb-3">{langMeta.desc}</p>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="h-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] rounded-full w-[45%]" />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1.5">
              <span>Foundation</span>
              <span className="text-[#58CC02]">{langMeta.progress}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white p-5 shadow-2xl dark:bg-[#1B272C] animate-scale-in overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 font-black text-lg">
                <Flowy size={28} />
                <span>LearnFlow</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Mobile Course Switcher */}
            <div className="mb-4">
              <CourseSwitcher className="w-full" />
            </div>

            <nav className="flex flex-col gap-2 mb-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-extrabold border-2 border-b-4',
                      isActive
                        ? 'border-[#46A302] bg-[#58CC02] text-white'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-[#2B3940] dark:bg-[#131F24] dark:text-slate-200',
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setLogoutConfirmOpen(true)
                }}
                className="w-full"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false)
          void logout()
        }}
        title="Xác nhận đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản LearnFlow không?"
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
        variant="danger"
        icon="logout"
      />

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}
