import { cn } from '@/lib/utils'

interface ContentColumnProps {
  children: React.ReactNode
  /**
   * narrow — onboarding/lesson column (max-w-md ≈ 448px)
   * default — app-wide max width (max-w-[900px])
   */
  narrow?: boolean
  /** Strip the default horizontal padding when you need edge-to-edge content */
  noPadding?: boolean
  className?: string
}

/**
 * Horizontal centering column that enforces the design's max-readable-width
 * and screen-edge padding. Use narrow for question / onboarding flows.
 */
export function ContentColumn({
  children,
  narrow = false,
  noPadding = false,
  className,
}: ContentColumnProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        narrow ? 'max-w-md' : 'max-w-[900px]',
        !noPadding && 'px-[var(--space-screen-x)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
