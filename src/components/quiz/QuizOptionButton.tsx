import { cn } from '@/lib/utils'

export type QuizOptionVariant = 'default' | 'selected' | 'correct' | 'wrong'

// ── Outer ring path (shared across all variants) ───────────────────────────
const RING_PATH =
  'M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM12 20.25C10.3683 20.25 8.77326 19.7661 7.41655 18.8596C6.05984 17.9531 5.00242 16.6646 4.378 15.1571C3.75358 13.6496 3.5902 11.9908 3.90853 10.3905C4.22685 8.79016 5.01259 7.32015 6.16637 6.16637C7.32016 5.01259 8.79017 4.22685 10.3905 3.90852C11.9909 3.59019 13.6497 3.75357 15.1571 4.37799C16.6646 5.00242 17.9531 6.05984 18.8596 7.41655C19.7662 8.77325 20.25 10.3683 20.25 12C20.2475 14.1873 19.3775 16.2843 17.8309 17.8309C16.2843 19.3775 14.1873 20.2475 12 20.25Z'

// ── Inner filled dot path (used for selected / correct / wrong) ────────────
const DOT_PATH =
  'M17.25 12C17.25 13.0384 16.9421 14.0534 16.3652 14.9167C15.7883 15.7801 14.9684 16.453 14.0091 16.8504C13.0498 17.2477 11.9942 17.3517 10.9758 17.1491C9.95738 16.9466 9.02192 16.4465 8.28769 15.7123C7.55347 14.9781 7.05345 14.0426 6.85088 13.0242C6.64831 12.0058 6.75228 10.9502 7.14964 9.99091C7.547 9.0316 8.2199 8.21166 9.08326 7.63478C9.94662 7.05791 10.9617 6.75 12 6.75C13.3919 6.75149 14.7264 7.30509 15.7107 8.28933C16.6949 9.27358 17.2485 10.6081 17.25 12Z'

// ── Icon fill colors per variant ───────────────────────────────────────────
const ICON_COLOR: Record<QuizOptionVariant, string> = {
  default:  '#B5B5B5',
  selected: '#05ABD6',
  correct:  '#30C047',
  wrong:    '#F38552',
}

interface RadioIconProps {
  variant: QuizOptionVariant
}

function RadioIcon({ variant }: RadioIconProps) {
  const fill = ICON_COLOR[variant]
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <path d={RING_PATH} fill={fill} />
      {variant !== 'default' && <path d={DOT_PATH} fill={fill} />}
    </svg>
  )
}

interface QuizOptionButtonProps {
  label: string
  variant: QuizOptionVariant
  onClick?: () => void
  disabled?: boolean
  className?: string
  role?: 'checkbox' | 'radio' | 'button'
  'aria-checked'?: boolean
  'aria-disabled'?: boolean
}

/**
 * Quiz option button — four states per Figma spec (docs/figma-design-spec-quiz-page-559-2395.md §9).
 *
 * default  → white bg, gray ring icon
 * selected → teal bg, teal filled-dot icon
 * correct  → green bg, green filled-dot icon
 * wrong    → peach bg, orange filled-dot icon
 */
export function QuizOptionButton({
  label,
  variant,
  onClick,
  disabled = false,
  className,
  role,
  'aria-checked': ariaChecked,
  'aria-disabled': ariaDisabled,
}: QuizOptionButtonProps) {
  // ── Background + border ────────────────────────────────────────────────────
  const containerVariant = {
    default:
      'bg-white border border-[var(--quiz-option-default-border)] shadow-[var(--quiz-option-shadow-default)]',
    selected:
      'bg-[var(--quiz-option-selected-bg)] border border-[var(--quiz-option-selected-border)] shadow-[var(--quiz-option-shadow-state)]',
    correct:
      'bg-[var(--quiz-option-correct-bg)] border border-[var(--quiz-option-correct-border)] shadow-[var(--quiz-option-shadow-state)]',
    wrong:
      'bg-[var(--quiz-option-wrong-bg)] border border-dashed border-[var(--quiz-option-wrong-border)] shadow-[var(--quiz-option-shadow-state)]',
  }[variant]

  // ── Label color ────────────────────────────────────────────────────────────
  const labelColor =
    variant === 'wrong' ? 'text-[#0a0a0a]' : 'text-[rgba(10,10,10,0.8)]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role={role}
      aria-checked={ariaChecked}
      aria-disabled={ariaDisabled}
      className={cn(
        'flex w-full cursor-pointer items-center gap-1.5 rounded-xl px-3 py-4 text-left transition-colors',
        'disabled:cursor-default',
        containerVariant,
        className,
      )}
    >
      <RadioIcon variant={variant} />
      <span className={cn('text-sm font-medium leading-normal tracking-[-0.45px]', labelColor)}>
        {label}
      </span>
    </button>
  )
}
