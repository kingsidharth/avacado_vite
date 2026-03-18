import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

interface StickyPrimaryCTAProps extends ComponentProps<typeof Button> {
  /** Extra bottom padding matching the CTA safe area token */
  bottomSafe?: boolean
  children: React.ReactNode
}

/**
 * Primary CTA for learning and onboarding screens.
 * Anchors to the bottom of the containing flex column via mt-auto.
 * Height, radius, and padding are fixed to the Figma spec (46px, rounded-xl).
 */
export function StickyPrimaryCTA({
  children,
  bottomSafe = true,
  className,
  ...props
}: StickyPrimaryCTAProps) {
  return (
    <div
      className={cn(
        'mt-auto flex w-full justify-center px-[var(--space-screen-x)]',
        bottomSafe && 'pb-[var(--space-cta-safe)]',
      )}
    >
      <Button
        size="lg"
        className={cn(
          'h-[46px] w-[354px] max-w-full rounded-xl bg-foreground text-background hover:bg-foreground/90',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </div>
  )
}
