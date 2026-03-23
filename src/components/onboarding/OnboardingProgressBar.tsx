interface OnboardingProgressBarProps {
  totalSteps: number
  currentStep: number
}

export function OnboardingProgressBar({ totalSteps, currentStep }: OnboardingProgressBarProps) {
  const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-[var(--onboarding-fill)] transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
