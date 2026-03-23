import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { AlertTriangle, CheckCircle2, XCircle, Quote, ArrowRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface RoundOption {
  id: string
  text: string
  is_correct: boolean
}

interface Round {
  id: string
  ai_claim: string
  question: string
  options: RoundOption[]
  explanation: string
  doc_excerpt?: string
}

interface SpotTheGapProps {
  headline: string
  subline: string
  rounds: Round[]
  completion_text: string
  points_per_correct: number
}

interface RoundResult {
  roundId: string
  correct: boolean
}

// ============================================================================
// Component
// ============================================================================

export default function SpotTheGap(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as SpotTheGapProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, rounds, completion_text, points_per_correct } = props

  const [currentRound, setCurrentRound] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<RoundResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const round = rounds[currentRound] as Round | undefined
  const totalRounds = rounds.length

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.stg-heading')
    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }
  }, [])

  // Round card animation
  const roundRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || showFeedback || showSummary) return
      animate(node, {
        translateX: [30, 0],
        opacity: [0, 1],
        duration: 300,
        ease: 'outQuad',
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRound, showFeedback, showSummary]
  )

  // Feedback animation
  const feedbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      translateY: [12, 0],
      opacity: [0, 1],
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  // Summary animation
  const summaryRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  const advanceToNext = useCallback(() => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)

    const nextRound = currentRound + 1
    if (nextRound >= totalRounds) {
      setShowSummary(true)
      if (!completeFired) {
        setCompleteFired(true)
        onActivityComplete?.()
      }
    } else {
      setCurrentRound(nextRound)
      setSelectedId(null)
      setShowFeedback(false)
    }
  }, [currentRound, totalRounds, completeFired, onActivityComplete])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (showFeedback || !round) return
      setSelectedId(optionId)
      setShowFeedback(true)

      const chosen = round.options.find((o) => o.id === optionId)
      const isCorrect = chosen?.is_correct ?? false
      const newResults = [...results, { roundId: round.id, correct: isCorrect }]
      setResults(newResults)

      // Auto-advance after 1.5s
      advanceTimeoutRef.current = setTimeout(advanceToNext, 1500)
    },
    [showFeedback, round, results, advanceToNext]
  )

  const handleManualNext = useCallback(() => {
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    advanceToNext()
  }, [advanceToNext])

  const score = results.filter((r) => r.correct).length

  // ---- Summary screen ----
  if (showSummary) {
    return (
      <div ref={summaryRef} className="flex flex-col gap-4 px-1 py-2" style={{ opacity: 0 }}>
        <div className="flex flex-col items-center gap-2 pt-2">
          <Trophy className="size-10 text-yellow-500" />
          <h2 className="text-xl font-bold text-foreground">
            {score}/{totalRounds}
          </h2>
          <p className="text-center text-sm text-muted-foreground">{completion_text}</p>
          <p className="text-xs text-muted-foreground">
            +{score * points_per_correct} points earned
          </p>
        </div>

        {/* Round breakdown */}
        <div className="space-y-2">
          {rounds.map((r, i) => {
            const result = results[i]
            return (
              <div
                key={r.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3',
                  result?.correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                    result?.correct ? 'bg-green-500' : 'bg-red-500'
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground line-clamp-2">
                    {r.ai_claim}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      result?.correct ? 'text-green-700' : 'text-red-700'
                    )}
                  >
                    {result?.correct ? 'Correct' : 'Incorrect'} &mdash; {r.explanation}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- Round screen ----
  if (!round) return null

  const selectedOption = round.options.find((o) => o.id === selectedId)
  const wasCorrect = selectedOption?.is_correct ?? false

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="stg-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {rounds.map((_, i) => (
          <div
            key={i}
            className={cn(
              'size-2 rounded-full transition-colors duration-200',
              i < currentRound
                ? results[i]?.correct
                  ? 'bg-green-500'
                  : 'bg-red-400'
                : i === currentRound
                  ? 'bg-primary'
                  : 'bg-muted'
            )}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {currentRound + 1}/{totalRounds}
        </span>
      </div>

      {/* AI claim card */}
      <div ref={roundRef} key={round.id} style={{ opacity: 0 }}>
        <div className="flex items-start gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              AI says:
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{round.ai_claim}</p>
          </div>
        </div>

        {/* Question */}
        <p className="mt-3 text-sm font-semibold text-foreground">{round.question}</p>

        {/* Options */}
        <div className="mt-2.5 flex flex-col gap-2">
          {round.options.map((option) => {
            let optionStyle = 'border-border bg-card'
            if (showFeedback) {
              if (option.is_correct) {
                optionStyle = 'border-green-400 bg-green-50'
              } else if (option.id === selectedId && !option.is_correct) {
                optionStyle = 'border-red-400 bg-red-50'
              } else {
                optionStyle = 'border-border bg-card opacity-50'
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                disabled={showFeedback}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200',
                  optionStyle,
                  !showFeedback && 'active:scale-[0.98]'
                )}
              >
                <span className="flex-1 text-sm font-medium text-foreground">{option.text}</span>
                {showFeedback && option.is_correct && (
                  <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                )}
                {showFeedback && option.id === selectedId && !option.is_correct && (
                  <XCircle className="size-5 shrink-0 text-red-500" />
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div ref={feedbackRef} className="mt-3 space-y-2.5" style={{ opacity: 0 }}>
            <div
              className={cn(
                'rounded-xl border p-3',
                wasCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              )}
            >
              <p
                className={cn(
                  'text-sm font-semibold',
                  wasCorrect ? 'text-green-700' : 'text-red-700'
                )}
              >
                {wasCorrect ? 'Correct!' : 'Not quite'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {round.explanation}
              </p>
            </div>

            {/* Doc excerpt */}
            {round.doc_excerpt && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Quote className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <p className="text-xs italic leading-relaxed text-slate-600">
                  {round.doc_excerpt}
                </p>
              </div>
            )}

            {/* Next button */}
            <button
              type="button"
              onClick={handleManualNext}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98]"
            >
              {currentRound + 1 < totalRounds ? 'Next' : 'See Results'}
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
