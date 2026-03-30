import type { CSSProperties } from 'react'

interface OnboardingProgressBarProps {
  totalSteps: number
  currentStep: number
}

/** Figma 842:38 — track `rgba(10,10,10,0.08)`; fill matches lesson header bar (`--onboarding-fill`, LessonPlayer). */
export function OnboardingProgressBar({ totalSteps, currentStep }: OnboardingProgressBarProps) {
  /** 0-based step index → fill reflects “step 1 of N” (Figma 842:41 ≈ 16% for first of ~6) */
  const pct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  return (
    <div
      className="h-[6px] w-full overflow-hidden rounded-full bg-[rgba(10,10,10,0.08)]"
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full w-[var(--onboarding-progress-pct,0%)] rounded-br-[20px] rounded-tr-[20px] bg-[var(--onboarding-fill)] transition-[width] duration-300 ease-out"
        style={{ '--onboarding-progress-pct': `${pct}%` } as CSSProperties}
      />
    </div>
  )
}
