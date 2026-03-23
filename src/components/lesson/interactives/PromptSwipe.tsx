import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { ThumbsDown, ThumbsUp, Trophy, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface PromptItem {
  id: string
  text: string
  is_good: boolean
  explanation: string
}

interface ScoreMessages {
  perfect: string
  good: string
  needs_work: string
}

interface PromptSwipeProps {
  headline: string
  subline: string
  prompts: PromptItem[]
  score_messages: ScoreMessages
  points_per_correct: number
  bad_label?: string
  good_label?: string
}

interface AnswerRecord {
  prompt: PromptItem
  userSaidGood: boolean
  correct: boolean
}

// ============================================================================
// Component
// ============================================================================

export default function PromptSwipe(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as PromptSwipeProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    prompts,
    score_messages,
    points_per_correct,
    bad_label = 'Bad Prompt',
    good_label = 'Good Prompt',
  } = props

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<AnswerRecord | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPrompt = prompts[currentIndex] as PromptItem | undefined

  const handleAnswer = useCallback(
    (userSaidGood: boolean) => {
      if (!currentPrompt || showFeedback) return

      const correct = userSaidGood === currentPrompt.is_good
      const record: AnswerRecord = {
        prompt: currentPrompt,
        userSaidGood,
        correct,
      }

      setLastAnswer(record)
      setShowFeedback(true)

      const newAnswers = [...answers, record]
      setAnswers(newAnswers)

      // Clear any pending timeout
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)

      feedbackTimeoutRef.current = setTimeout(() => {
        setShowFeedback(false)
        setLastAnswer(null)

        if (currentIndex + 1 >= prompts.length) {
          setShowResults(true)
          if (!completeFired) {
            setCompleteFired(true)
            onActivityComplete?.()
          }
        } else {
          setCurrentIndex((prev) => prev + 1)
        }
      }, 1800)
    },
    [currentPrompt, showFeedback, answers, currentIndex, prompts.length, completeFired, onActivityComplete]
  )

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const heading = node.querySelector('.ps-heading')
    const card = node.querySelector('.ps-card')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    if (card) {
      animate(card, {
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 350,
        ease: 'outBack',
        delay: 200,
      })
    }
  }, [])

  // Card entrance animation per prompt
  const cardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || showFeedback || showResults) return
      animate(node, {
        translateX: [40, 0],
        opacity: [0, 1],
        duration: 300,
        ease: 'outQuad',
      })
    },
    // Re-run when currentIndex changes and not in feedback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, showFeedback, showResults]
  )

  // Results mount animation
  const resultsRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  const score = answers.filter((a) => a.correct).length
  const total = prompts.length
  const scoreMessage =
    score === total
      ? score_messages.perfect
      : score >= Math.ceil(total * 0.6)
        ? score_messages.good
        : score_messages.needs_work

  // ---- Results screen ----
  if (showResults) {
    return (
      <div ref={resultsRef} className="flex flex-col gap-4 px-1 py-2" style={{ opacity: 0 }}>
        {/* Score header */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Trophy className="size-10 text-yellow-500" />
          <h2 className="text-xl font-bold text-foreground">
            {score}/{total}
          </h2>
          <p className="text-center text-sm text-muted-foreground">{scoreMessage}</p>
          <p className="text-xs text-muted-foreground">
            +{score * points_per_correct} points earned
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {answers.map((a, i) => (
            <div
              key={a.prompt.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3',
                a.correct
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                  a.correct ? 'bg-green-500' : 'bg-red-500'
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  &ldquo;{a.prompt.text}&rdquo;
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    a.correct ? 'text-green-700' : 'text-red-700'
                  )}
                >
                  {a.correct ? 'Correct' : `Answer: ${a.prompt.is_good ? good_label : bad_label}`}
                  {' — '}{a.prompt.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- Game screen ----
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="ps-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {headline}
        </h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {prompts.map((_, i) => (
          <div
            key={i}
            className={cn(
              'size-2 rounded-full transition-colors duration-200',
              i < currentIndex
                ? answers[i]?.correct
                  ? 'bg-green-500'
                  : 'bg-red-400'
                : i === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Prompt card */}
      {currentPrompt && (
        <div
          ref={cardRef}
          key={currentPrompt.id}
          className={cn(
            'ps-card relative rounded-2xl border-2 p-5 transition-colors duration-200',
            showFeedback && lastAnswer
              ? lastAnswer.correct
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
              : 'border-border bg-card'
          )}
        >
          <p className="text-center text-sm font-medium leading-relaxed text-foreground">
            &ldquo;{currentPrompt.text}&rdquo;
          </p>

          {/* Feedback overlay */}
          {showFeedback && lastAnswer && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {lastAnswer.correct ? (
                  <span className="flex items-center gap-1 text-sm font-bold text-green-700">
                    <ThumbsUp className="size-4" /> Correct!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-bold text-red-700">
                    <RotateCcw className="size-4" />
                    {lastAnswer.prompt.is_good ? `Actually: ${good_label}` : `Actually: ${bad_label}`}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-center text-xs',
                  lastAnswer.correct ? 'text-green-700' : 'text-red-700'
                )}
              >
                {lastAnswer.prompt.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!showFeedback && currentPrompt && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 active:scale-[0.97]"
          >
            <ThumbsDown className="size-4" />
            {bad_label}
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 active:scale-[0.97]"
          >
            <ThumbsUp className="size-4" />
            {good_label}
          </button>
        </div>
      )}

      {/* Counter */}
      <p className="text-center text-xs text-muted-foreground">
        {currentIndex + 1} of {total}
      </p>
    </div>
  )
}
