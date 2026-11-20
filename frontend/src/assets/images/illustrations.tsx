import type { ImageProps } from './mascot'

/**
 * Japanese Hinomaru Flag Badge (Clean, rounded 3D badge)
 */
export function JapanFlagBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Japanese Flag"
      {...props}
    >
      <rect width="28" height="20" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <circle cx="14" cy="10" r="5" fill="#BC002D" />
    </svg>
  )
}

/**
 * English Flag Badge (Union Jack stylized / Clean rounded 3D badge)
 */
export function EnglishFlagBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="English Flag"
      {...props}
    >
      <rect width="28" height="20" rx="4" fill="#012169" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* White Diagonals */}
      <path d="M0 0L28 20M28 0L0 20" stroke="#FFFFFF" strokeWidth="3" />
      {/* Red Diagonals */}
      <path d="M0 0L28 20M28 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
      {/* White Cross */}
      <path d="M14 0V20M0 10H28" stroke="#FFFFFF" strokeWidth="6" />
      {/* Red Cross */}
      <path d="M14 0V20M0 10H28" stroke="#C8102E" strokeWidth="3.6" />
    </svg>
  )
}

/**
 * Chinese Flag Badge (Clean rounded 3D badge)
 */
export function ChinaFlagBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Chinese Flag"
      {...props}
    >
      <rect width="28" height="20" rx="4" fill="#DE2910" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* Big Gold Star */}
      <polygon
        points="6.5,4 7.4,6.7 10.2,6.7 8,8.4 8.8,11.1 6.5,9.5 4.2,11.1 5,8.4 2.8,6.7 5.6,6.7"
        fill="#FFDE00"
      />
      {/* Small Stars */}
      <circle cx="12" cy="4.5" r="1.1" fill="#FFDE00" />
      <circle cx="14" cy="6.5" r="1.1" fill="#FFDE00" />
      <circle cx="14" cy="9.5" r="1.1" fill="#FFDE00" />
      <circle cx="12" cy="11.5" r="1.1" fill="#FFDE00" />
    </svg>
  )
}

/**
 * Unified Language Flag Badge for en, zh, ja
 */
export function LanguageFlagBadge({
  code,
  size = 20,
  className,
}: {
  code: string
  size?: number | string
  className?: string
}) {
  const norm = code.toLowerCase().trim()
  if (norm.startsWith('zh') || norm === 'chinese') {
    return <ChinaFlagBadge size={size} className={className} />
  }
  if (norm.startsWith('en') || norm === 'english') {
    return <EnglishFlagBadge size={size} className={className} />
  }
  return <JapanFlagBadge size={size} className={className} />
}

/**
 * 3D High-contrast Streak Flame Badge
 */
export function StreakFlameBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Streak Flame"
      {...props}
    >
      <path
        d="M12 2C9.5 5.5 10 8 8 10C6.5 11.5 5 13.5 5 16C5 19.866 8.134 23 12 23C15.866 23 19 19.866 19 16C19 11.5 15.5 8 14 5C13.5 7 12 8 11.5 7C11.5 5.5 12 3 12 2Z"
        fill="#FF9600"
      />
      <path
        d="M12 8C10.5 10.5 10.8 12 9.5 13.5C8.5 14.5 7.5 15.5 7.5 17C7.5 19.485 9.515 21.5 12 21.5C14.485 21.5 16.5 19.485 16.5 17C16.5 14 14.5 12 13.5 10C13 11 12 11.5 12 8Z"
        fill="#FFC800"
      />
    </svg>
  )
}

/**
 * Daily Quest Target Badge
 */
export function QuestTargetBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Daily Quests Target"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#FF4B4B"
        fillOpacity="0.15"
        stroke="#FF4B4B"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="6" fill="#FFFFFF" stroke="#FF4B4B" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="#FF4B4B" />
    </svg>
  )
}

/**
 * Golden Achievement Trophy
 */
export function TrophyBadge({ size = 20, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Achievement Trophy"
      {...props}
    >
      <path
        d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5A2.5 2.5 0 0 1 4.5 4H6"
        stroke="#E5A500"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 9H19.5A2.5 2.5 0 0 0 22 6.5A2.5 2.5 0 0 0 19.5 4H18"
        stroke="#E5A500"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M4 22H20" stroke="#E5A500" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M10 14.66V17C10 17.55 9.53 17.98 9.03 18.21C7.85 18.75 7 20.24 7 22"
        stroke="#E5A500"
        strokeWidth="2"
      />
      <path
        d="M14 14.66V17C14 17.55 14.47 17.98 14.97 18.21C16.15 18.75 17 20.24 17 22"
        stroke="#E5A500"
        strokeWidth="2"
      />
      <path
        d="M18 2H6V9C6 12.314 8.686 15 12 15C15.314 15 18 12.314 18 9V2Z"
        fill="#FFC800"
        stroke="#E5A500"
        strokeWidth="2"
      />
    </svg>
  )
}

/**
 * Ramen Scenario Badge
 */
export function RamenBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      role="img"
      aria-label="Ramen"
    >
      🍜
    </span>
  )
}

/**
 * Train Station Scenario Badge
 */
export function TrainBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      role="img"
      aria-label="Train Station"
    >
      🚆
    </span>
  )
}

/**
 * Self Introduction Scenario Badge
 */
export function HandshakeBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className ?? ''}`}
      role="img"
      aria-label="Handshake"
    >
      🤝
    </span>
  )
}
