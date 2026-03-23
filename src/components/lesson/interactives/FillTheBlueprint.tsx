import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Blank {
  id: string
  label: string
  correct: string
  options: string[]
}

interface FillTheBlueprintProps {
  headline: string
  subline: string
  blanks: Blank[]
  success_message: string
  points_first_try: number
  points_with_correction: number
  onActivityComplete?: () => void
}

// ============================================================================
// Component
// ============================================================================

export default function FillTheBlueprint(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as FillTheBlueprintProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    blanks = [],
    success_message,
  } = props

  const [filledValues, setFilledValues] = useState<Record<string, string>>({})
  const [activeBlankIndex, setActiveBlankIndex] = useState(0)
  const [checkResult, setCheckResult] = useState<Record<string, boolean> | null>(null)
  const [allCorrect, setAllCorrect] = useState(false)
  const completedCalledRef = useRef(false)

  // The currently active blank (for showing options)
  const activeBlank = blanks[activeBlankIndex] as Blank | undefined

  // Are all blanks filled?
  const allFilled = blanks.every((b) => filledValues[b.id])

  // Callback ref for mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const children = node.querySelectorAll('.blueprint-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: (_el, i: number) => i * 80,
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  const successRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    animate(node, {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (!activeBlank) return

      const newFilled = { ...filledValues, [activeBlank.id]: option }
      setFilledValues(newFilled)

      // Clear check result when editing
      if (checkResult) setCheckResult(null)

      // Advance to next unfilled blank
      const nextEmpty = blanks.findIndex(
        (b, i) => i > activeBlankIndex && !newFilled[b.id]
      )
      if (nextEmpty >= 0) {
        setActiveBlankIndex(nextEmpty)
      }
    },
    [activeBlank, filledValues, blanks, activeBlankIndex, checkResult]
  )

  const handleChipTap = useCallback(
    (blankIndex: number) => {
      if (allCorrect) return

      const blank = blanks[blankIndex]
      if (filledValues[blank.id]) {
        // Remove the value and make this the active blank
        const newFilled = { ...filledValues }
        delete newFilled[blank.id]
        setFilledValues(newFilled)
        setActiveBlankIndex(blankIndex)
        if (checkResult) setCheckResult(null)
      } else {
        setActiveBlankIndex(blankIndex)
      }
    },
    [filledValues, blanks, allCorrect, checkResult]
  )

  const handleCheck = useCallback(() => {
    const results: Record<string, boolean> = {}
    let correct = true

    for (const blank of blanks) {
      const isRight = filledValues[blank.id] === blank.correct
      results[blank.id] = isRight
      if (!isRight) correct = false
    }

    setCheckResult(results)

    if (correct) {
      setAllCorrect(true)
      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    }
  }, [blanks, filledValues, onActivityComplete])

  const handleTryAgain = useCallback(() => {
    // Clear wrong answers so their options reappear
    const newFilled = { ...filledValues }
    let firstWrongIndex = 0
    for (let i = 0; i < blanks.length; i++) {
      if (newFilled[blanks[i].id] !== blanks[i].correct) {
        delete newFilled[blanks[i].id]
        if (firstWrongIndex === 0) firstWrongIndex = i
      }
    }
    setFilledValues(newFilled)
    setCheckResult(null)
    setActiveBlankIndex(firstWrongIndex)
  }, [blanks, filledValues])

  const getChipClasses = (blank: Blank, index: number) => {
    const value = filledValues[blank.id]
    const isActive = index === activeBlankIndex && !allCorrect

    if (checkResult) {
      if (checkResult[blank.id]) {
        return 'border-green-400 bg-green-50 text-green-800'
      }
      return 'border-red-400 bg-red-50 text-red-800'
    }

    if (value) {
      if (isActive) return 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
      return 'border-gray-300 bg-gray-50 text-gray-800'
    }

    if (isActive) return 'border-blue-500 bg-blue-50/50 border-dashed ring-2 ring-blue-200'
    return 'border-gray-300 bg-white border-dashed text-gray-400'
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="blueprint-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Prompt template card */}
      <div className="blueprint-animate rounded-2xl border border-gray-200 bg-gray-50/80 p-4" style={{ opacity: 0 }}>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your Prompt Blueprint
        </p>
        <div className="flex flex-wrap gap-2">
          {blanks.map((blank, i) => {
            const value = filledValues[blank.id]
            return (
              <button
                key={blank.id}
                onClick={() => handleChipTap(i)}
                disabled={allCorrect}
                className={`inline-flex min-h-[36px] min-w-[80px] items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${getChipClasses(blank, i)}`}
              >
                {checkResult && checkResult[blank.id] && (
                  <CheckCircle2 className="size-3.5 shrink-0 text-green-600" />
                )}
                {checkResult && !checkResult[blank.id] && (
                  <XCircle className="size-3.5 shrink-0 text-red-500" />
                )}
                {value || blank.label}
              </button>
            )
          })}
        </div>

        {/* Show correct answer for wrong ones after check */}
        {checkResult && !allCorrect && (
          <div className="mt-3 space-y-1">
            {blanks
              .filter((b) => !checkResult[b.id])
              .map((b) => (
                <p key={b.id} className="text-xs text-red-600">
                  {b.label} should be: <span className="font-semibold">{b.correct}</span>
                </p>
              ))}
          </div>
        )}
      </div>

      {/* Options for current blank */}
      {!allCorrect && activeBlank && !filledValues[activeBlank.id] && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Choose the {activeBlank.label}:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {activeBlank.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionSelect(opt)}
                className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-[0.97]"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already filled — show which blank is active for re-editing */}
      {!allCorrect && activeBlank && filledValues[activeBlank.id] && !allFilled && (
        <p className="text-center text-xs text-muted-foreground">
          Tap a chip to edit it, or fill the remaining blanks
        </p>
      )}

      {/* Check button */}
      {allFilled && !allCorrect && !checkResult && (
        <button
          onClick={handleCheck}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <Sparkles className="size-4" />
          Check My Prompt
        </button>
      )}

      {/* Try Again button */}
      {checkResult && !allCorrect && (
        <button
          onClick={handleTryAgain}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:bg-gray-50 active:scale-[0.98]"
        >
          <RotateCcw className="size-4" />
          Try Again
        </button>
      )}

      {/* Success message */}
      {allCorrect && (
        <div
          ref={successRef}
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-center"
          style={{ opacity: 0 }}
        >
          <CheckCircle2 className="mx-auto mb-2 size-6 text-green-600" />
          <p className="text-sm font-medium text-green-800">{success_message}</p>
        </div>
      )}
    </div>
  )
}
