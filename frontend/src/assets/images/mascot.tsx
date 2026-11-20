import type { SVGProps } from 'react'

export interface ImageProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

/**
 * Flowy 🕊️: The official LearnFlow mascot and universal community companion.
 * Symbolism:
 * - A friendly polyglot messenger bird & knowledge flow sprite.
 * - Wearing a modern communication headset: symbolizes active listening, spoken fluency, and AI tutoring.
 * - Tri-color community star badge: represents cultural harmony across English, Chinese, Japanese, and the world.
 * - Culturally neutral, universally warm, welcoming, and community-focused.
 */
export function Flowy({ size = 48, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Flowy - LearnFlow Community Mascot"
      {...props}
    >
      {/* Soft Ambient Glow */}
      <circle cx="50" cy="52" r="44" fill="#58CC02" fillOpacity="0.16" />

      {/* Headset Arch (Behind Head) */}
      <path
        d="M23 48C23 28 35 18 50 18C65 18 77 28 77 48"
        stroke="#1CB0F6"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Playful Top Feather Tuft / Sprout (Symbolizing Growth & Knowledge Flow) */}
      <path
        d="M50 20C47 11 39 12 38 17C43 17 46 22 47 24"
        fill="#58CC02"
        stroke="#46A302"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 20C53 9 62 10 63 15C57 16 54 21 53 24"
        fill="#58CC02"
        stroke="#46A302"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Body / Head Silhouette (Round, Cheerful & Friendly) */}
      <path
        d="M20 52C20 32 33 22 50 22C67 22 80 32 80 52C80 73 67 86 50 86C33 86 20 73 20 52Z"
        fill="#58CC02"
        stroke="#46A302"
        strokeWidth="3.5"
      />

      {/* Cheerful White Belly / Chest */}
      <path d="M30 56C30 42 70 42 70 56C70 74 61 84 50 84C39 84 30 74 30 56Z" fill="#FFFFFF" />

      {/* Left Wing (Waving hello to the community!) */}
      <path
        d="M21 54C13 46 10 37 13 33C17 29 23 37 24 45Z"
        fill="#58CC02"
        stroke="#46A302"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Right Wing (Resting gently) */}
      <path
        d="M79 50C87 53 89 64 85 70C81 75 77 68 76 60Z"
        fill="#58CC02"
        stroke="#46A302"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Communication Headset Ear Cushions (Active Listening / Dialogue) */}
      <rect
        x="15"
        y="42"
        width="10"
        height="18"
        rx="5"
        fill="#1CB0F6"
        stroke="#1899D6"
        strokeWidth="2.5"
      />
      <rect
        x="75"
        y="42"
        width="10"
        height="18"
        rx="5"
        fill="#1CB0F6"
        stroke="#1899D6"
        strokeWidth="2.5"
      />

      {/* Headset Mini Microphone (Voice & Spoken Fluency) */}
      <path d="M20 56C20 66 27 72 37 72" stroke="#1899D6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="72" r="3.5" fill="#FF9600" />

      {/* Big Sparkling Friendly Eyes */}
      <ellipse cx="40" cy="48" rx="4" ry="5.5" fill="#1E293B" />
      <circle cx="38.5" cy="46" r="1.8" fill="#FFFFFF" />
      <ellipse cx="60" cy="48" rx="4" ry="5.5" fill="#1E293B" />
      <circle cx="58.5" cy="46" r="1.8" fill="#FFFFFF" />

      {/* Blushing Cheeks (Warm & Welcoming) */}
      <ellipse cx="33" cy="56" rx="4" ry="2.2" fill="#FF4B4B" fillOpacity="0.4" />
      <ellipse cx="67" cy="56" rx="4" ry="2.2" fill="#FF4B4B" fillOpacity="0.4" />

      {/* Cute Golden Beak / Smile */}
      <path
        d="M45 52C45 50 55 50 55 52C55 58 51 61 50 61C49 61 45 58 45 52Z"
        fill="#FF9600"
        stroke="#D97706"
        strokeWidth="1.5"
      />

      {/* Community Tri-Star Badge on Chest (English • Chinese • Japanese Unity) */}
      <g transform="translate(42, 68) scale(0.65)">
        {/* Star 1 - English (Blue) */}
        <circle cx="4" cy="10" r="3" fill="#1CB0F6" />
        {/* Star 2 - Chinese (Amber/Gold) */}
        <circle cx="12" cy="10" r="3.5" fill="#FFC800" />
        {/* Star 3 - Japanese (Coral/Emerald) */}
        <circle cx="20" cy="10" r="3" fill="#58CC02" />
        {/* Connecting link */}
        <line
          x1="4"
          y1="10"
          x2="20"
          y2="10"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="1 1"
        />
      </g>
    </svg>
  )
}

/**
 * Excited / Celebrating Flowy with golden sparkles and victory pose.
 * Used in Onboarding completion, streak milestones, and quiz celebrations.
 */
export function FlowyHappy({ size = 56, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Celebrating Flowy Mascot"
      {...props}
    >
      {/* Golden Celebration Aura */}
      <circle cx="50" cy="50" r="46" fill="#FFC800" fillOpacity="0.18" />

      {/* Sparkles of Achievement */}
      <path
        d="M14 26L16.5 31.5L22 34L16.5 36.5L14 42L11.5 36.5L6 34L11.5 31.5L14 26Z"
        fill="#FFC800"
      />
      <path
        d="M86 20L87.5 24.5L92 26L87.5 27.5L86 32L84.5 27.5L80 26L84.5 24.5L86 20Z"
        fill="#FFC800"
      />
      <path d="M84 76L85 79L88 80L85 81L84 84L83 81L80 80L83 79L84 76Z" fill="#58CC02" />

      {/* Base Flowy Mascot */}
      <Flowy size="100%" />
    </svg>
  )
}

/**
 * LearnFlow Official Brand Logo Badge
 * Two intersecting conversation bubbles forming the infinity flow of knowledge and community.
 */
export function LearnFlowLogo({ size = 48, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="LearnFlow Community Logo"
      {...props}
    >
      {/* Background Crisp White 3D App Icon Badge */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="26"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="3.5"
      />
      {/* 3D Bottom Lip */}
      <path
        d="M6 70C6 82 16 92 28 92H72C84 92 94 82 94 70V74C94 86 84 96 72 96H28C16 96 6 86 6 74V70Z"
        fill="#CBD5E1"
      />

      {/* Inside: Integrated Flowy on crisp white background */}
      <g transform="translate(10, 8) scale(0.8)">
        <Flowy size="100%" />
      </g>
    </svg>
  )
}

/** Aliases for complete backwards compatibility */
export const SenseiFox = Flowy
export const FlowyFox = Flowy
export const CoachFox = Flowy
export const SenseiFoxHappy = FlowyHappy
export const CoachFlowy = Flowy

/**
 * Student Learner Avatar: Cheerful character with headphones / study vibe.
 */
export function StudentAvatar({ size = 48, className, ...props }: ImageProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Student Learner Avatar"
      {...props}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill="#1CB0F6" fillOpacity="0.15" />

      {/* Hair back */}
      <circle cx="50" cy="45" r="26" fill="#3D2314" />

      {/* Face */}
      <circle cx="50" cy="50" r="22" fill="#FFDFBD" />

      {/* Hair front */}
      <path d="M28 42C32 30 68 30 72 42C68 38 58 37 50 41C42 37 32 38 28 42Z" fill="#3D2314" />

      {/* Glasses */}
      <rect
        x="34"
        y="45"
        width="13"
        height="10"
        rx="3"
        fill="#E8F7FF"
        stroke="#1CB0F6"
        strokeWidth="2.5"
      />
      <rect
        x="53"
        y="45"
        width="13"
        height="10"
        rx="3"
        fill="#E8F7FF"
        stroke="#1CB0F6"
        strokeWidth="2.5"
      />
      <line x1="47" y1="50" x2="53" y2="50" stroke="#1CB0F6" strokeWidth="2.5" />

      {/* Eyes behind glasses */}
      <circle cx="40.5" cy="50" r="2" fill="#2E1B00" />
      <circle cx="59.5" cy="50" r="2" fill="#2E1B00" />

      {/* Cheerful Smile */}
      <path d="M44 60C47 63 53 63 56 60" stroke="#D95C00" strokeWidth="2" strokeLinecap="round" />

      {/* Clothes / Collar */}
      <path
        d="M26 86C26 74 36 70 50 70C64 70 74 74 74 86H26Z"
        fill="#1CB0F6"
        stroke="#1899D6"
        strokeWidth="2.5"
      />
    </svg>
  )
}
