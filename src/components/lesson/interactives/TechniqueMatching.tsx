import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { CheckCircle2, Shuffle, RotateCcw } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Term {
  id: string
  text: string
}

interface Definition {
  id: string
  text: string
  matches: string
}

interface TechniqueMatchingProps {
  headline: string
  instruction: string
  terms: Term[]
  definitions: Definition[]
  completion_text: string
  points: number
  onActivityComplete?: () => void
}

// ============================================================================
// Fisher-Yates shuffle (stable, called once via ref)
// ============================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ============================================================================
// Component
// ============================================================================

export default function TechniqueMatching(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as TechniqueMatchingProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    instruction,
    terms = [],
    definitions: rawDefinitions = [],
    completion_text,
  } = props

  // Shuffle definitions only once on mount
  const shuffledDefs = useRef<Definition[]>(shuffle(rawDefinitions))

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedDef, setSelectedDef] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({})
  const [wrongFlash, setWrongFlash] = useState<{
    termId: string
    defId: string
  } | null>(null)
  const [completed, setCompleted] = useState(false)
  const completedCalledRef = useRef(false)

  // Use refs for values needed inside tryMatch to avoid stale closures
  const matchedPairsRef = useRef(matchedPairs)
  matchedPairsRef.current = matchedPairs
  const onActivityCompleteRef = useRef(onActivityComplete)
  onActivityCompleteRef.current = onActivityComplete

  // Callback ref for mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const cards = node.querySelectorAll('.match-card')
    animate(cards, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 60,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  const completionRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    animate(node, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  // Core match logic — reads from refs to always be current
  const tryMatch = useCallback(
    (termId: string, defId: string) => {
      const def = shuffledDefs.current.find((d) => d.id === defId)
      if (!def) return

      const isCorrect = def.matches === termId

      if (isCorrect) {
        const newPairs = { ...matchedPairsRef.current, [termId]: defId }
        setMatchedPairs(newPairs)
        matchedPairsRef.current = newPairs
        setSelectedTerm(null)
        setSelectedDef(null)

        // Check if all matched
        if (Object.keys(newPairs).length === terms.length) {
          setCompleted(true)
          if (!completedCalledRef.current) {
            completedCalledRef.current = true
            onActivityCompleteRef.current?.()
          }
        }
      } else {
        // Wrong match — flash red briefly, then clear
        setWrongFlash({ termId, defId })
        setTimeout(() => {
          setWrongFlash(null)
          setSelectedTerm(null)
          setSelectedDef(null)
        }, 700)
      }
    },
    [terms.length]
  )

  const handleTermTap = useCallback(
    (termId: string) => {
      if (matchedPairs[termId] || wrongFlash) return

      if (selectedTerm === termId) {
        setSelectedTerm(null)
        return
      }

      setSelectedTerm(termId)

      // If a definition is already selected, try to match
      if (selectedDef) {
        tryMatch(termId, selectedDef)
      }
    },
    [selectedTerm, selectedDef, matchedPairs, wrongFlash, tryMatch]
  )

  const handleDefTap = useCallback(
    (defId: string) => {
      const isDefMatched = Object.values(matchedPairs).includes(defId)
      if (isDefMatched || wrongFlash) return

      if (selectedDef === defId) {
        setSelectedDef(null)
        return
      }

      setSelectedDef(defId)

      // If a term is already selected, try to match
      if (selectedTerm) {
        tryMatch(selectedTerm, defId)
      }
    },
    [selectedTerm, selectedDef, matchedPairs, wrongFlash, tryMatch]
  )

  const isTermMatched = (termId: string) => termId in matchedPairs
  const isDefMatched = (defId: string) => Object.values(matchedPairs).includes(defId)

  const getTermClasses = (termId: string) => {
    if (isTermMatched(termId)) return 'border-green-400 bg-green-50 text-green-800 opacity-80'
    if (wrongFlash?.termId === termId) return 'border-red-400 bg-red-50 animate-shake'
    if (selectedTerm === termId) return 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
    return 'border-gray-200 bg-white hover:border-gray-300'
  }

  const getDefClasses = (defId: string) => {
    if (isDefMatched(defId)) return 'border-green-400 bg-green-50 text-green-800 opacity-80'
    if (wrongFlash?.defId === defId) return 'border-red-400 bg-red-50 animate-shake'
    if (selectedDef === defId) return 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
    return 'border-gray-200 bg-white hover:border-gray-300'
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Shuffle className="size-3.5" />
          {instruction}
        </p>
      </div>

      {/* Two-column matching area */}
      <div ref={containerRef} className="grid grid-cols-2 gap-3">
        {/* Left column: Techniques */}
        <div className="flex flex-col gap-2.5">
          {terms.map((term) => (
            <button
              key={term.id}
              onClick={() => handleTermTap(term.id)}
              disabled={isTermMatched(term.id) || !!wrongFlash}
              className={`match-card flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all ${getTermClasses(term.id)}`}
              style={{ opacity: 0 }}
            >
              {isTermMatched(term.id) && (
                <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              )}
              <span>{term.text}</span>
            </button>
          ))}
        </div>

        {/* Right column: Example prompts (shuffled) */}
        <div className="flex flex-col gap-2.5">
          {shuffledDefs.current.map((def) => (
            <button
              key={def.id}
              onClick={() => handleDefTap(def.id)}
              disabled={isDefMatched(def.id) || !!wrongFlash}
              className={`match-card flex min-h-[52px] items-center rounded-xl border-2 px-3 py-2.5 text-left text-xs leading-snug transition-all ${getDefClasses(def.id)}`}
              style={{ opacity: 0 }}
            >
              {isDefMatched(def.id) && (
                <CheckCircle2 className="mr-1.5 size-3.5 shrink-0 text-green-600" />
              )}
              <span>{def.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wrong match hint */}
      {wrongFlash && (
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-600">
          <RotateCcw className="size-3" />
          Not a match — try again!
        </div>
      )}

      {/* Match counter */}
      {!completed && !wrongFlash && (
        <div className="text-center text-xs text-muted-foreground">
          {Object.keys(matchedPairs).length} / {terms.length} matched
        </div>
      )}

      {/* Completion message */}
      {completed && (
        <div
          ref={completionRef}
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-center"
          style={{ opacity: 0 }}
        >
          <CheckCircle2 className="mx-auto mb-2 size-6 text-green-600" />
          <p className="text-sm font-medium text-green-800">{completion_text}</p>
        </div>
      )}
    </div>
  )
}
