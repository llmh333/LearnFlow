import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Avatar, Button, Drawer, Flex, Progress, Tooltip } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  FireFilled,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons'
import { Flowy, IconBook, IconBot, QuestTargetBadge, StreakFlameBadge } from '@/assets'
import { ProfileDialog } from '@/components/account/ProfileDialog'
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
        <Flex align="center" gap={12}>
          <NavLink to="/ai-tutor" className="group flex items-center gap-2.5 select-none">
            <Flex
              align="center"
              justify="center"
              className="h-11 w-11 rounded-2xl bg-white dark:bg-[#1B272C] border-2 border-b-4 border-slate-200 dark:border-[#2B3940] shadow-sm transition-transform group-hover:scale-105 active:scale-95"
            >
              <Flowy size={32} />
            </Flex>
            <div>
              <Flex align="center" gap={4}>
                <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                  LearnFlow
                </span>
                <span className="h-2 w-2 rounded-full bg-[#58CC02]" />
              </Flex>
              <p className="text-[11px] font-extrabold tracking-wide text-[#58CC02] uppercase">
                EN • 中文 • 日本語
              </p>
            </div>
          </NavLink>
        </Flex>

        {/* Center: Language & Stats HUD */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Target Language & Level Switcher */}
          <CourseSwitcher />

          {/* Streak Flame Pill with Ant Design Tooltip */}
          <Tooltip title="Daily study streak!">
            <Flex
              align="center"
              gap={6}
              className="rounded-2xl border-2 border-amber-200 bg-[#FFF5CC] px-3 py-1.5 text-xs font-black text-[#A16800] dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <FireFilled className="text-amber-500 text-sm" />
              <span>7 Days</span>
            </Flex>
          </Tooltip>

          {/* Mock / Live Backend Status Pill */}
          {mockActive ? (
            <Flex
              align="center"
              gap={6}
              className="rounded-2xl border-2 border-emerald-200 bg-[#D7FFB8] px-3 py-1 text-xs font-bold text-[#347800] dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
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
            </Flex>
          ) : (
            <Flex
              align="center"
              gap={6}
              className="rounded-2xl border-2 border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:border-[#2B3940] dark:bg-[#1A262C] dark:text-slate-300"
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  health.data?.status === 'UP' ? 'bg-[#58CC02] animate-pulse' : 'bg-amber-400',
                )}
              />
              <span>{health.data?.status === 'UP' ? 'Live API 🟢' : 'Connecting API…'}</span>
            </Flex>
          )}
        </div>

        {/* Right: Actions, Theme & Profile */}
        <Flex align="center" gap={8}>
          <ThemeToggle />

          {/* Profile Trigger Button with Ant Design Avatar */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-[#2B3940] dark:bg-[#1B272C] dark:text-slate-200 cursor-pointer select-none"
            title="Learning profile settings"
          >
            <Avatar size={26} style={{ backgroundColor: '#1CB0F6', fontWeight: 800, fontSize: 12 }}>
              {userInitial}
            </Avatar>
            <span className="hidden md:inline font-bold max-w-[110px] truncate">
              {user?.displayName || 'Learner'}
            </span>
            <SettingOutlined className="text-slate-400" />
          </button>

          {/* Logout Button */}
          <Button
            type="text"
            danger
            onClick={() => setLogoutConfirmOpen(true)}
            icon={<LogoutOutlined />}
            className="hidden sm:inline-flex !rounded-xl !border-2 !border-slate-200 !h-9 text-xs font-bold dark:!border-[#2B3940]"
            title="Log out"
          />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-2xl border-2 border-slate-200 p-2 text-slate-600 hover:bg-slate-100 sm:hidden dark:border-[#2B3940] dark:text-slate-300 dark:hover:bg-[#1B272C]"
          >
            {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </Flex>
      </header>

      {/* Main 3-Column Learning Playground */}
      <Flex gap={24} className="mx-auto max-w-[1536px] p-4 sm:p-6 lg:p-8">
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
                  <Flex align="center" gap={12}>
                    <span className="text-lg transition-transform group-hover:scale-110">
                      {item.emoji}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="rounded-full bg-[#1CB0F6] px-1.5 py-0.5 text-[10px] font-black text-white">
                        {item.badge}
                      </span>
                    )}
                  </Flex>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Cheerful Mascot Motivational Card */}
          <div className="rounded-3xl border-2 border-b-4 border-amber-200 bg-[#FFF5CC] p-4 text-[#A16800] dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 shadow-xs">
            <Flex align="center" gap={8} className="mb-2">
              <Flowy size={32} className="animate-bounce-playful" />
              <span className="text-xs font-black uppercase tracking-wider">Flowy Companion</span>
            </Flex>
            <p className="text-xs leading-relaxed font-bold">
              &quot;Học ngoại ngữ để kết nối mọi người! Luyện tập 10 phút mỗi ngày cùng cộng đồng
              toàn cầu.&quot;
            </p>
          </div>
        </aside>

        {/* Column 2: Center Main Workspace Outlet */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>

        {/* Column 3: Right Quests & Daily Activity Rail (Visible on xl screens) */}
        <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5">
          {/* Daily Quests Board */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <Flex align="center" justify="space-between" className="mb-3">
              <Flex align="center" gap={8}>
                <QuestTargetBadge size={22} />
                <h3 className="font-black text-slate-800 dark:text-white text-sm">Daily Quests</h3>
              </Flex>
              <span className="text-xs font-bold text-[#58CC02]">2 / 3 Done</span>
            </Flex>

            <Progress percent={66} strokeColor="#58CC02" showInfo={false} className="!mb-3" />

            <div className="space-y-3">
              <Flex
                align="center"
                gap={12}
                className="rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800"
              >
                <Flex
                  align="center"
                  justify="center"
                  className="h-8 w-8 shrink-0 rounded-xl bg-[#58CC02] text-white"
                >
                  <CheckOutlined />
                </Flex>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Daily Check-in
                  </p>
                  <p className="text-[11px] text-slate-400">Completed today</p>
                </div>
              </Flex>

              <Flex
                align="center"
                gap={12}
                className="rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800"
              >
                <Flex
                  align="center"
                  justify="center"
                  className="h-8 w-8 shrink-0 rounded-xl bg-[#58CC02] text-white"
                >
                  <CheckOutlined />
                </Flex>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Conversation Practice
                  </p>
                  <p className="text-[11px] text-slate-400">Practice 1 conversation</p>
                </div>
              </Flex>

              <Flex
                align="center"
                gap={12}
                className="rounded-2xl bg-slate-50 p-3 dark:bg-[#131F24] border border-slate-100 dark:border-slate-800"
              >
                <Flex
                  align="center"
                  justify="center"
                  className="h-8 w-8 shrink-0 rounded-xl bg-[#1CB0F6] text-white"
                >
                  <ThunderboltFilled />
                </Flex>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Grammar Clinic
                  </p>
                  <p className="text-[11px] text-slate-400">Ask 1 grammar question</p>
                </div>
              </Flex>
            </div>
          </div>

          {/* Weekly Habit Tracker */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <Flex align="center" gap={8} className="mb-3">
              <StreakFlameBadge size={22} />
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Weekly Streak</h3>
            </Flex>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEK_DAYS.map((d, index) => (
                <Flex key={index} vertical align="center" gap={4}>
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
                </Flex>
              ))}
            </div>
          </div>

          {/* Language Progress Milestone */}
          <div className="rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-5 dark:border-[#2B3940] dark:bg-[#1B272C] shadow-xs">
            <Flex align="center" justify="space-between" className="mb-2">
              <Flex align="center" gap={8}>
                <TrophyFilled className="text-amber-500 text-base" />
                <h3 className="font-black text-slate-800 dark:text-white text-sm">
                  Target: {currentLevel}
                </h3>
              </Flex>
              <NavLink
                to="/onboarding"
                className="text-[11px] font-bold text-[#1CB0F6] hover:underline"
              >
                Change Level
              </NavLink>
            </Flex>
            <p className="text-xs text-slate-500 mb-3">{langMeta.desc}</p>
            <Progress
              percent={45}
              strokeColor={{ '0%': '#58CC02', '100%': '#1CB0F6' }}
              showInfo={false}
              className="!mb-1"
            />
            <Flex justify="space-between" className="text-[11px] font-bold text-slate-400 mt-1.5">
              <span>Foundation</span>
              <span className="text-[#58CC02]">{langMeta.progress}</span>
            </Flex>
          </div>
        </aside>
      </Flex>

      {/* Mobile Ant Design Drawer Navigation */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={
          <Flex align="center" gap={8} className="font-black text-lg">
            <Flowy size={28} />
            <span>LearnFlow</span>
          </Flex>
        }
        className="dark:!bg-[#1B272C]"
      >
        <Flex vertical gap={16}>
          <CourseSwitcher className="w-full" />

          <nav className="flex flex-col gap-2 my-2">
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
                <Flex align="center" gap={10}>
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </Flex>
              </NavLink>
            ))}
          </nav>

          <Button
            type="primary"
            danger
            size="large"
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileMenuOpen(false)
              setLogoutConfirmOpen(true)
            }}
            className="w-full !rounded-2xl font-bold"
          >
            Log out
          </Button>
        </Flex>
      </Drawer>

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
