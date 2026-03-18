import { useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

interface QuizPageHeaderProps {
  /** Progress 0–100; fills the bar with accent color. */
  progressPercent: number
}

/**
 * Quiz page header: back button + continuous progress bar.
 * Matches Figma spec §5 (node 559:2412): 354×36, gap 6px, back 36×36 (6px padding), bar 12px height.
 */
export function QuizPageHeader({ progressPercent }: QuizPageHeaderProps) {
  const router = useRouter()
  const percent = Math.min(100, Math.max(0, progressPercent))

  return (
    <div className="flex w-full items-center gap-1.5">
      {/* Back: 36×36 touch, 6px padding, 24×24 icon */}
      <button
        type="button"
        onClick={() => router.history.back()}
        className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
        aria-label="Go back"
      >
        <ChevronLeft className="size-6" strokeWidth={2} />
      </button>
      {/* Progress bar: 12px height, rounded, track gray, fill accent */}
      <div className="h-3 w-full min-w-0 overflow-hidden rounded-[8px] bg-[rgba(10,10,10,0.1)]">
        <div
          className="h-full rounded-[8px] bg-[var(--onboarding-fill)] transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
