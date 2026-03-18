import { cn } from '@/lib/utils'

type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const gapMap: Record<StackGap, string> = {
  xs: 'gap-2',   // 8px — tight vertical rhythm
  sm: 'gap-3',   // 12px — card internal spacing
  md: 'gap-4',   // 16px — between option items
  lg: 'gap-5',   // 20px — question → options
  xl: 'gap-6',   // 24px — between major sections
}

interface StackProps {
  children: React.ReactNode
  /** Vertical rhythm gap between direct children */
  gap?: StackGap
  className?: string
}

/**
 * Vertical rhythm helper — replaces scattered space-y-* classes.
 * Always renders a flex column; gap is driven by semantic tokens.
 */
export function Stack({ children, gap = 'xl', className }: StackProps) {
  return (
    <div className={cn('flex flex-col', gapMap[gap], className)}>
      {children}
    </div>
  )
}
