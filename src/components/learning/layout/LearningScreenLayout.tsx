import { cn } from '@/lib/utils'

interface LearningScreenLayoutProps {
  children: React.ReactNode
  /** Reserve space at the bottom for a non-fixed CTA so content never scrolls behind it */
  hasStickyBottom?: boolean
  className?: string
}

/**
 * Full-screen flex column wrapper for learning and onboarding screens.
 * Encapsulates min-h-dvh, flex layout, and optional bottom padding for CTA clearance.
 */
export function LearningScreenLayout({
  children,
  hasStickyBottom = false,
  className,
}: LearningScreenLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col',
        hasStickyBottom && 'pb-[calc(46px+var(--space-cta-safe)*2)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
