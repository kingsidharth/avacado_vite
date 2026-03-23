import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Send, Loader2, Sparkles, ArrowRight, Lightbulb, X, MessageSquare } from 'lucide-react'
import { apiUrl } from '@/lib/api/client'
import { useDocumentStore } from '@/store/document'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface ComparisonLabels {
  before: string
  after: string
}

interface PromptUpgradeLabProps {
  headline: string
  subline: string
  initial_prompt: string
  upgrade_hints: string[]
  placeholder: string
  comparison_labels: ComparisonLabels
  points: number
  onActivityComplete?: () => void
}

type LabPhase = 'loading-before' | 'edit' | 'loading-after' | 'compare'

// ============================================================================
// Helpers
// ============================================================================

const FALLBACK_RESPONSE =
  "Sorry, I couldn't get a response from the AI. Please check your connection and try again."

async function fetchRAGResponse(
  documentText: string,
  query: string,
  history: Array<{ query: string; response: string }> = []
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

export default function PromptUpgradeLab(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as PromptUpgradeLabProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    initial_prompt,
    upgrade_hints = [],
    placeholder,
    comparison_labels = { before: 'Basic Prompt', after: 'Your Upgraded Prompt' },
    points,
  } = props

  // Store
  const documentText = useDocumentStore((s) => s.documentText)

  // State
  const [phase, setPhase] = useState<LabPhase>('loading-before')
  const [beforeResponse, setBeforeResponse] = useState<string | null>(null)
  const [editText, setEditText] = useState(initial_prompt || '')
  const [afterResponse, setAfterResponse] = useState<string | null>(null)
  const [upgradedPrompt, setUpgradedPrompt] = useState('')
  const [dismissedHints, setDismissedHints] = useState<Set<number>>(new Set())

  const completedCalledRef = useRef(false)
  const beforeFetchedRef = useRef(false)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.pul-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Auto-fetch initial prompt response on mount
  const autoFetchRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || beforeFetchedRef.current || !documentText) return
      beforeFetchedRef.current = true

      animate(node, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 350,
        ease: 'outQuad',
      })

      // Kick off the "before" API call
      fetchRAGResponse(documentText, initial_prompt).then((response) => {
        setBeforeResponse(response)
        setPhase('edit')
      })
    },
    [documentText, initial_prompt]
  )

  // Edit card animation
  const editRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Compare animation
  const compareRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const cards = node.querySelectorAll('.compare-card')
    animate(cards, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 150,
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Handle upgraded prompt submission
  const handleSubmitUpgrade = useCallback(async () => {
    if (!editText.trim() || !documentText) return

    setUpgradedPrompt(editText)
    setPhase('loading-after')

    const response = await fetchRAGResponse(documentText, editText)
    setAfterResponse(response)
    setPhase('compare')

    if (!completedCalledRef.current) {
      completedCalledRef.current = true
      onActivityComplete?.()
    }
  }, [editText, documentText, onActivityComplete])

  // Dismiss a hint
  const handleDismissHint = useCallback((index: number) => {
    setDismissedHints((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [])

  // Insert hint text into the prompt
  const handleUseHint = useCallback(
    (hint: string) => {
      const trimmed = editText.trimEnd()
      const separator = trimmed.endsWith('.') || trimmed.endsWith('?') || trimmed.endsWith('!') ? ' ' : '. '
      setEditText(trimmed + separator + hint)
    },
    [editText]
  )

  // No document
  if (!documentText) {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="pul-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>
        <div className="pul-animate flex items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-5" style={{ opacity: 0 }}>
          <Sparkles className="size-5 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            Upload a document first to start the prompt upgrade lab.
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Loading before response
  // ---------------------------------------------------------------
  if (phase === 'loading-before') {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="pul-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        {/* Before prompt card */}
        <div ref={autoFetchRef} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              {comparison_labels.before}
            </span>
          </div>
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-foreground">{initial_prompt}</p>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-blue-500" />
            <span className="text-xs text-muted-foreground">Getting AI response to the basic prompt...</span>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Edit phase
  // ---------------------------------------------------------------
  if (phase === 'edit') {
    const visibleHints = upgrade_hints.filter((_, i) => !dismissedHints.has(i))

    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="pul-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        {/* Before card (collapsed) */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              {comparison_labels.before}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{initial_prompt}</p>
          {beforeResponse && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white px-2.5 py-2">
              <MessageSquare className="mt-0.5 size-3 shrink-0 text-gray-400" />
              <p className="line-clamp-2 text-xs text-muted-foreground">{beforeResponse}</p>
            </div>
          )}
        </div>

        {/* Edit area */}
        <div ref={editRef} className="flex flex-col gap-3" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-blue-500" />
            <p className="text-sm font-semibold text-foreground">Now upgrade the prompt</p>
          </div>

          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full resize-none rounded-xl border-2 border-blue-200 bg-white p-3 text-sm leading-relaxed transition-colors focus:border-blue-400 focus:outline-none"
          />

          {/* Hint chips */}
          {visibleHints.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="size-3.5 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Tips to try:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {upgrade_hints.map((hint, i) => {
                  if (dismissedHints.has(i)) return null
                  return (
                    <div
                      key={i}
                      className="group flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/50 py-1 pl-2.5 pr-1"
                    >
                      <button
                        type="button"
                        onClick={() => handleUseHint(hint)}
                        className="text-xs font-medium text-amber-800 hover:text-amber-900"
                      >
                        {hint}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissHint(i)}
                        className="flex size-4 items-center justify-center rounded-full text-amber-400 transition-colors hover:bg-amber-200 hover:text-amber-700"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmitUpgrade}
            disabled={!editText.trim() || editText.trim() === initial_prompt.trim()}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]',
              editText.trim() && editText.trim() !== initial_prompt.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            )}
          >
            <Send className="size-4" />
            Test Upgraded Prompt
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Loading after response
  // ---------------------------------------------------------------
  if (phase === 'loading-after') {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="pul-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
              {comparison_labels.after}
            </span>
          </div>
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-foreground">{upgradedPrompt}</p>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-blue-500" />
            <span className="text-xs text-muted-foreground">Testing your upgraded prompt...</span>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Comparison phase
  // ---------------------------------------------------------------
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      <div className="pul-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      <div ref={compareRef} className="flex flex-col gap-3">
        {/* Before card */}
        <div className="compare-card rounded-xl border border-gray-200 bg-gray-50/50 p-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
              {comparison_labels.before}
            </span>
          </div>
          <div className="mt-3 rounded-lg bg-white px-3 py-2">
            <p className="text-xs font-medium text-foreground">{initial_prompt}</p>
          </div>
          {beforeResponse && (
            <div className="mt-2 rounded-lg bg-white/70 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Response</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{beforeResponse}</p>
            </div>
          )}
        </div>

        {/* Arrow between */}
        <div className="compare-card flex items-center justify-center" style={{ opacity: 0 }}>
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
            <ArrowRight className="size-4 text-blue-600" />
          </div>
        </div>

        {/* After card — highlighted */}
        <div className="compare-card rounded-xl border-2 border-blue-300 bg-blue-50/40 p-4 shadow-sm ring-2 ring-blue-100" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
              {comparison_labels.after}
            </span>
            <Sparkles className="size-3.5 text-blue-500" />
          </div>
          <div className="mt-3 rounded-lg bg-white px-3 py-2">
            <p className="text-xs font-medium text-foreground">{upgradedPrompt}</p>
          </div>
          {afterResponse && (
            <div className="mt-2 rounded-lg bg-white/70 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-500">Response</p>
              <p className="text-xs leading-relaxed text-gray-800">{afterResponse}</p>
            </div>
          )}
        </div>
      </div>

      {/* Points badge */}
      <div className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50/60 py-3">
        <p className="text-sm font-semibold text-green-800">Prompt upgraded!</p>
        <p className="text-xs text-muted-foreground">+{points} points</p>
      </div>
    </div>
  )
}
