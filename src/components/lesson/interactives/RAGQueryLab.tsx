import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Send, Loader2, Star, MessageSquare, AlertCircle, ChevronRight, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { apiUrl } from '@/lib/api/client'
import { useDocumentStore } from '@/store/document'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface RatingOption {
  id: string
  label: string
  value: number
}

interface RAGQueryLabProps {
  headline: string
  subline: string
  rounds: number
  suggested_queries: string[]
  placeholder: string
  rating_prompt: string
  rating_options: RatingOption[]
  points_per_round: number
  onActivityComplete?: () => void
}

type RoundPhase = 'input' | 'loading' | 'response' | 'rating'

interface RoundState {
  query: string
  response: string
  rating: number | null
}

// ============================================================================
// Helpers
// ============================================================================

const FALLBACK_RESPONSE =
  "Sorry, I couldn't get a response from the AI. Please check your connection and try again."

async function fetchRAGResponse(
  documentText: string,
  query: string,
  history: Array<{ query: string; response: string }>
): Promise<string> {
  try {
    const res = await fetch(apiUrl('/api/rag-query'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ document_text: documentText, query, history }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('RAG API error:', res.status, errorBody)
      throw new Error(`API error ${res.status}`)
    }

    const json = (await res.json()) as { text?: string; error?: string }
    return json.text || FALLBACK_RESPONSE
  } catch (err) {
    console.error('RAG fetch error:', err)
    return FALLBACK_RESPONSE
  }
}

// ============================================================================
// Component
// ============================================================================

export default function RAGQueryLab(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as RAGQueryLabProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    rounds = 3,
    suggested_queries = [],
    placeholder,
    rating_prompt,
    rating_options = [],
    points_per_round,
  } = props

  // Store
  const documentText = useDocumentStore((s) => s.documentText)
  const documentType = useDocumentStore((s) => s.documentType)
  const documentName = useDocumentStore((s) => s.documentName)
  const addRagExchange = useDocumentStore((s) => s.addRagExchange)
  const setRatingForExchange = useDocumentStore((s) => s.setRatingForExchange)
  const setLastRound3Rating = useDocumentStore((s) => s.setLastRound3Rating)
  const ragHistoryLength = useDocumentStore((s) => s.ragHistory.length)

  // State
  const [currentRound, setCurrentRound] = useState(0)
  const [phase, setPhase] = useState<RoundPhase>('input')
  const [inputText, setInputText] = useState('')
  const [roundStates, setRoundStates] = useState<RoundState[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [allDone, setAllDone] = useState(false)
  const [docPreviewOpen, setDocPreviewOpen] = useState(false)

  const completedCalledRef = useRef(false)

  // Only show suggested queries for the sample document
  const showSuggestions = documentType === 'sample' && currentRound === 0 && suggested_queries.length > 0

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.rql-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Response card animation
  const responseRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Rating animation
  const ratingRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  // Done animation
  const doneRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Build history from previous rounds
  const buildHistory = useCallback((): Array<{ query: string; response: string }> => {
    return roundStates.map((rs) => ({ query: rs.query, response: rs.response }))
  }, [roundStates])

  // Submit a query
  const handleSubmit = useCallback(
    async (queryText?: string) => {
      const query = (queryText || inputText).trim()
      if (!query || !documentText || phase !== 'input') return

      setPhase('loading')
      setCurrentResponse('')

      const history = buildHistory()
      const response = await fetchRAGResponse(documentText, query, history)

      setCurrentResponse(response)
      setInputText(query)
      addRagExchange(query, response)
      setPhase('response')

      // Brief delay then show rating
      setTimeout(() => {
        setPhase('rating')
      }, 600)
    },
    [inputText, documentText, phase, buildHistory, addRagExchange]
  )

  // Handle suggestion chip click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputText(suggestion)
      handleSubmit(suggestion)
    },
    [handleSubmit]
  )

  // Handle rating selection
  const handleRate = useCallback(
    (ratingValue: number) => {
      const exchangeIndex = ragHistoryLength - 1
      setRatingForExchange(exchangeIndex, ratingValue)

      const updatedRound: RoundState = {
        query: inputText,
        response: currentResponse,
        rating: ratingValue,
      }

      const newRoundStates = [...roundStates, updatedRound]
      setRoundStates(newRoundStates)

      // Check if this was the last round
      if (currentRound + 1 >= rounds) {
        setLastRound3Rating(ratingValue)
        setAllDone(true)

        if (!completedCalledRef.current) {
          completedCalledRef.current = true
          onActivityComplete?.()
        }
      } else {
        // Advance to next round
        setCurrentRound((r) => r + 1)
        setPhase('input')
        setInputText('')
        setCurrentResponse('')
      }
    },
    [
      ragHistoryLength,
      setRatingForExchange,
      inputText,
      currentResponse,
      roundStates,
      currentRound,
      rounds,
      setLastRound3Rating,
      onActivityComplete,
    ]
  )

  // Document preview (truncated)
  const docPreview = documentText
    ? documentText.length > 500
      ? documentText.slice(0, 500) + '...'
      : documentText
    : ''

  // ---------------------------------------------------------------
  // Render: No document loaded
  // ---------------------------------------------------------------
  if (!documentText) {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="rql-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>
        <div className="rql-animate flex items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-5" style={{ opacity: 0 }}>
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">No document loaded</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Go back and upload a document first to start querying.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: All rounds complete
  // ---------------------------------------------------------------
  if (allDone) {
    const totalPoints = rounds * points_per_round
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="rql-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        {/* Previous rounds summary */}
        <div className="flex flex-col gap-2">
          {roundStates.map((rs, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {i + 1}
                </span>
                <p className="text-xs font-medium text-foreground truncate">{rs.query}</p>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{rs.response}</p>
            </div>
          ))}
        </div>

        <div ref={doneRef} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50/60 p-5" style={{ opacity: 0 }}>
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <Star className="size-5 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-green-800">All {rounds} rounds complete!</p>
          <p className="text-xs text-muted-foreground">+{totalPoints} points</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Active round
  // ---------------------------------------------------------------
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="rql-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Round counter */}
      <div className="rql-animate flex items-center gap-2" style={{ opacity: 0 }}>
        {Array.from({ length: rounds }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
              i < currentRound
                ? 'bg-green-100 text-green-700'
                : i === currentRound
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                  : 'bg-gray-100 text-gray-400'
            )}
          >
            {i + 1}
          </div>
        ))}
        <span className="ml-2 text-xs font-medium text-muted-foreground">
          Round {currentRound + 1} of {rounds}
        </span>
      </div>

      {/* Document preview toggle */}
      <button
        type="button"
        onClick={() => setDocPreviewOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
      >
        <FileText className="size-4 shrink-0 text-gray-500" />
        <span className="flex-1 truncate text-xs font-medium text-gray-700">
          {documentName || 'Your Document'}
        </span>
        {docPreviewOpen ? (
          <ChevronUp className="size-3.5 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-gray-400" />
        )}
      </button>

      {docPreviewOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600">
            {docPreview}
          </p>
          {documentText.length > 500 && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Showing first 500 of {documentText.length.toLocaleString()} characters
            </p>
          )}
        </div>
      )}

      {/* Previous rounds (collapsed) */}
      {roundStates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {roundStates.map((rs, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <MessageSquare className="size-3 shrink-0 text-gray-400" />
              <p className="truncate text-xs text-muted-foreground">{rs.query}</p>
            </div>
          ))}
        </div>
      )}

      {/* Input phase */}
      {phase === 'input' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputText.trim()) handleSubmit()
              }}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!inputText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              <Send className="size-4" />
            </button>
          </div>

          {/* Suggestion chips — only show for sample document in round 1 */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-2">
              {suggested_queries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(sq)}
                  className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:bg-blue-50 active:scale-[0.97]"
                >
                  {sq}
                  <ChevronRight className="size-3" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading phase */}
      {phase === 'loading' && (
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-4">
          <Loader2 className="size-4 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">Searching your document...</span>
        </div>
      )}

      {/* Response phase */}
      {(phase === 'response' || phase === 'rating') && currentResponse && (
        <div ref={responseRef} className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-blue-100">
              <MessageSquare className="size-3 text-blue-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">AI Response</p>
          </div>
          <p className="text-sm leading-relaxed text-gray-800">{currentResponse}</p>
          <div className="mt-1 rounded-lg bg-white/60 px-2.5 py-1.5">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Your query:</span> {inputText}
            </p>
          </div>
        </div>
      )}

      {/* Rating phase */}
      {phase === 'rating' && (
        <div ref={ratingRef} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4" style={{ opacity: 0 }}>
          <p className="text-sm font-medium text-foreground">{rating_prompt}</p>
          <div className="flex gap-2">
            {rating_options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleRate(opt.value)}
                className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-foreground transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-[0.97]"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            +{points_per_round} points per round
          </p>
        </div>
      )}
    </div>
  )
}
