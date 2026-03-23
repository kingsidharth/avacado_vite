import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import { Check, X } from 'lucide-react'
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

interface ColdOpenQuizProps {
  headline: string
  subline: string
  options: QuizOption[]
  correct_reveal: string
  points: number
}

// ============================================================================
// Component
// ============================================================================

export default function ColdOpenQuiz(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as ColdOpenQuizProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, options, correct_reveal, points } = props

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.coq-heading')
    const optionEls = node.querySelectorAll('.coq-option')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    if (optionEls.length) {
      animate(optionEls, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: (_el, i: number) => 200 + i * 80,
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

  const handleSelect = useCallback(
    (id: string) => {
      if (revealed) return
      setSelectedId(id)
    },
    [revealed]
  )

  const handleCheck = useCallback(() => {
    if (!selectedId || revealed) return
    setRevealed(true)
    if (!completeFired) {
      setCompleteFired(true)
      onActivityComplete?.()
    }
  }, [selectedId, revealed, completeFired, onActivityComplete])

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="coq-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((option) => {
          const isSelected = selectedId === option.id
          const isCorrect = option.is_correct

          let optionStyle = 'border-border bg-card'
          if (revealed) {
            if (isCorrect) {
              optionStyle = 'border-green-400 bg-green-50'
            } else if (isSelected && !isCorrect) {
              optionStyle = 'border-red-400 bg-red-50'
            } else {
              optionStyle = 'border-border bg-card opacity-60'
            }
          } else if (isSelected) {
            optionStyle = 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={revealed}
              className={cn(
                'coq-option flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-200',
                optionStyle,
                !revealed && 'active:scale-[0.98]'
              )}
              style={{ opacity: 0 }}
            >
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
              {revealed && isCorrect && (
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
              )}
              {revealed && isSelected && !isCorrect && (
                <X className="mt-0.5 size-5 shrink-0 text-red-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Check Answer button */}
      {!revealed && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!selectedId}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200',
            selectedId
              ? 'bg-primary text-primary-foreground active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          )}
        >
          Check Answer
        </button>
      )}

      {/* Reveal section */}
      {revealed && (
        <div ref={revealRef} className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4" style={{ opacity: 0 }}>
          <p className="text-sm font-medium text-green-800">{correct_reveal}</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      )}
    </div>
  )
}
