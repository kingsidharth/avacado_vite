import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import { Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface PromptSide {
  label: string
  text: string
  output: string
  annotation: string
  annotation_type: 'bad' | 'good'
}

interface PromptComparisonProps {
  headline: string
  instruction: string
  weak_prompt: PromptSide
  pro_prompt: PromptSide
  cta_text: string
  points: number
}

// ============================================================================
// Component
// ============================================================================

export default function PromptComparison(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as PromptComparisonProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    instruction,
    weak_prompt,
    pro_prompt,
    cta_text,
  } = props

  const [revealedCards, setRevealedCards] = useState<Set<'weak' | 'pro'>>(new Set())
  const [completeFired, setCompleteFired] = useState(false)

  const handleReveal = useCallback(
    (side: 'weak' | 'pro') => {
      setRevealedCards((prev) => {
        if (prev.has(side)) return prev
        const next = new Set(prev)
        next.add(side)

        // Fire completion when both revealed
        if (next.size === 2 && !completeFired) {
          setCompleteFired(true)
          onActivityComplete?.()
        }

        return next
      })
    },
    [completeFired, onActivityComplete]
  )

  // Mount animation via useCallback ref
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const heading = node.querySelector('.pc-heading')
    const cards = node.querySelectorAll('.pc-card')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    cards.forEach((card, i) => {
      animate(card, {
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
        delay: 150 + i * 120,
      })
    })
  }, [])

  const renderCard = (side: 'weak' | 'pro', prompt: PromptSide) => {
    const isRevealed = revealedCards.has(side)
    const isBad = prompt.annotation_type === 'bad'
    const AnnotationIcon = isBad ? X : Check

    return (
      <button
        type="button"
        onClick={() => handleReveal(side)}
        style={{ opacity: 0 }}
        className={cn(
          'pc-card w-full rounded-2xl border-2 p-4 text-left transition-colors duration-200',
          isRevealed
            ? isBad
              ? 'border-red-300 bg-red-50'
              : 'border-green-300 bg-green-50'
            : 'border-border bg-card hover:border-primary/40 active:scale-[0.98]'
        )}
      >
        {/* Label badge */}
        <span
          className={cn(
            'mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold',
            isBad
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          )}
        >
          {prompt.label}
        </span>

        {/* Prompt text */}
        <p className="text-sm font-medium leading-snug text-foreground">
          &ldquo;{prompt.text}&rdquo;
        </p>

        {/* Reveal section */}
        {isRevealed && (
          <div className="mt-3 space-y-2">
            {/* AI output */}
            <div className="rounded-lg bg-white/70 p-3">
              <p className="text-xs font-medium text-muted-foreground">AI Output</p>
              <p className="mt-1 text-sm text-foreground">{prompt.output}</p>
            </div>

            {/* Annotation */}
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-2',
                isBad ? 'bg-red-100' : 'bg-green-100'
              )}
            >
              <AnnotationIcon
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  isBad ? 'text-red-600' : 'text-green-600'
                )}
              />
              <p
                className={cn(
                  'text-xs font-medium',
                  isBad ? 'text-red-700' : 'text-green-700'
                )}
              >
                {prompt.annotation}
              </p>
            </div>
          </div>
        )}

        {/* Tap hint */}
        {!isRevealed && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tap to reveal AI response
          </p>
        )}
      </button>
    )
  }

  // CTA ref for animation
  const ctaRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || revealedCards.size < 2) return
      animate(node, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outBack',
      })
    },
    [revealedCards.size]
  )

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="pc-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {headline}
        </h2>
        <p className="text-sm text-muted-foreground">{instruction}</p>
      </div>

      {/* Cards */}
      {renderCard('weak', weak_prompt)}
      {renderCard('pro', pro_prompt)}

      {/* CTA after both revealed */}
      {revealedCards.size >= 2 && (
        <div ref={ctaRef} className="flex items-center justify-center gap-2 pt-2" style={{ opacity: 0 }}>
          <Sparkles className="size-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{cta_text}</span>
        </div>
      )}
    </div>
  )
}
