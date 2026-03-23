import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import { Check, X, Square, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface QuizOption {
  id: string
  text: string
  is_correct: boolean
  explanation: string
}

interface MultiSelectQuizProps {
  headline: string
  subline: string
  context_card: { label: string; content: string }
  options: QuizOption[]
  success_message: string
  points: number
}

// ============================================================================
// Component
// ============================================================================

export default function MultiSelectQuiz(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as MultiSelectQuizProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, context_card, options, success_message, points } = props

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [revealed, setRevealed] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.msq-heading')
    const contextEl = node.querySelector('.msq-context')
    const optionEls = node.querySelectorAll('.msq-option')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    if (contextEl) {
      animate(contextEl, {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: 150,
      })
    }

    if (optionEls.length) {
      animate(optionEls, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: (_el, i: number) => 300 + i * 80,
      })
    }
  }, [])

  // Reveal animation
  const revealRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      translateY: [16, 0],
      opacity: [0, 1],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  const handleToggle = useCallback(
    (id: string) => {
      if (revealed) return
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [revealed]
  )

  const handleCheck = useCallback(() => {
    if (selectedIds.size === 0 || revealed) return
    setRevealed(true)
    if (!completeFired) {
      setCompleteFired(true)
      onActivityComplete?.()
    }
  }, [selectedIds.size, revealed, completeFired, onActivityComplete])

  // Scoring logic
  const correctIds = new Set(options.filter((o) => o.is_correct).map((o) => o.id))
  const selectedCorrectAll =
    revealed &&
    [...correctIds].every((id) => selectedIds.has(id)) &&
    [...selectedIds].every((id) => correctIds.has(id))
  const earnedPoints = selectedCorrectAll ? points : Math.floor(points / 2)

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="msq-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Context card */}
      <div className="msq-context rounded-xl border-2 border-gray-200 bg-gray-50 p-4" style={{ opacity: 0 }}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {context_card.label}
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {context_card.content}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((option) => {
          const isSelected = selectedIds.has(option.id)
          const isCorrect = option.is_correct

          let optionStyle = 'border-border bg-card'
          if (revealed) {
            if (isCorrect && isSelected) {
              optionStyle = 'border-green-400 bg-green-50'
            } else if (!isCorrect && isSelected) {
              optionStyle = 'border-red-400 bg-red-50'
            } else if (isCorrect && !isSelected) {
              optionStyle = 'border-green-300 bg-card border-dashed'
            } else {
              optionStyle = 'border-border bg-card opacity-60'
            }
          } else if (isSelected) {
            optionStyle = 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
          }

          const CheckboxIcon = isSelected ? CheckSquare : Square

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggle(option.id)}
              disabled={revealed}
              className={cn(
                'msq-option flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200',
                optionStyle,
                !revealed && 'active:scale-[0.98]'
              )}
              style={{ opacity: 0 }}
            >
              {/* Checkbox icon */}
              {!revealed && (
                <CheckboxIcon
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    isSelected ? 'text-blue-500' : 'text-muted-foreground'
                  )}
                />
              )}
              {revealed && isCorrect && (
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
              )}
              {revealed && isSelected && !isCorrect && (
                <X className="mt-0.5 size-5 shrink-0 text-red-500" />
              )}
              {revealed && !isCorrect && !isSelected && (
                <Square className="mt-0.5 size-5 shrink-0 text-muted-foreground opacity-40" />
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{option.text}</p>
                {revealed && (isCorrect || (isSelected && !isCorrect)) && (
                  <p
                    className={cn(
                      'text-xs',
                      isCorrect ? 'text-green-700' : 'text-red-700'
                    )}
                  >
                    {option.explanation}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Check Answers button */}
      {!revealed && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={selectedIds.size === 0}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200',
            selectedIds.size > 0
              ? 'bg-primary text-primary-foreground active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          )}
        >
          Check Answers
        </button>
      )}

      {/* Reveal section */}
      {revealed && (
        <div
          ref={revealRef}
          className={cn(
            'space-y-2 rounded-xl border p-4',
            selectedCorrectAll
              ? 'border-green-200 bg-green-50'
              : 'border-amber-200 bg-amber-50'
          )}
          style={{ opacity: 0 }}
        >
          <p
            className={cn(
              'text-sm font-medium',
              selectedCorrectAll ? 'text-green-800' : 'text-amber-800'
            )}
          >
            {selectedCorrectAll ? success_message : 'Close! Review the explanations above.'}
          </p>
          <p className="text-xs text-muted-foreground">+{earnedPoints} points</p>
        </div>
      )}
    </div>
  )
}
