import { cn } from '@/lib/utils'

interface LearningOptionButtonProps {
  label: string
  /** Secondary line shown below the label (makes card taller to match Figma two-line variant) */
  sublabel?: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Selectable option card for learning and onboarding question screens.
 * Built on a plain button element (not shadcn Button) to avoid ghost/outline
 * variant collisions, while respecting the project's design tokens.
 *
 * Single-line: 50px tall (Figma screen 407)
 * Two-line:    74px tall (Figma screen 408)
 */
export function LearningOptionButton({
  label,
  sublabel,
  selected = false,
  onClick,
  className,
}: LearningOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer flex-col justify-center rounded-xl border bg-background',
        'px-[var(--space-card-px)] py-[var(--space-card-py)]',
        'shadow-level-1 transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border/40 hover:border-border',
        sublabel ? 'min-h-[74px]' : 'min-h-[50px]',
        className,
      )}
    >
      <span className={cn('text-body text-left', selected ? 'text-foreground' : 'text-[#3b3b3b]')}>
        {label}
      </span>
      {sublabel && (
        <span className="mt-0.5 text-left text-[13px] leading-snug text-[#6c6c6c]">
          {sublabel}
        </span>
      )}
    </button>
  )
}
