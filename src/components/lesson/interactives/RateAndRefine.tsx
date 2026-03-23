import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Loader2, Copy, Check, AlertCircle, RefreshCw, Star } from 'lucide-react'
import { apiUrl } from '@/lib/api/client'
import { useLessonWorkspaceStore } from '@/store/lesson-workspace'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface SectionDef {
  id: string
  label: string
}

interface RateAndRefineProps {
  headline: string
  subline: string
  source_store_key: string
  sections: SectionDef[]
  system_prompt: string
  points: number
  onActivityComplete?: () => void
}

type RatingValue = 'keep' | 'tweak' | 'rewrite'

interface SectionState {
  id: string
  label: string
  text: string
  rating: RatingValue | null
  rewriteInstruction: string
  isRegenerating: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function splitIntoSections(text: string, sectionDefs: SectionDef[]): SectionState[] {
  // Split by double newlines, or fall back to single newlines if not enough parts
  let parts = text.split(/\n\n+/).filter((p) => p.trim())

  if (parts.length < sectionDefs.length) {
    // Try splitting by single newlines
    parts = text.split(/\n/).filter((p) => p.trim())
  }

  return sectionDefs.map((def, i) => ({
    id: def.id,
    label: def.label,
    text: i < parts.length ? parts[i].trim() : '',
    rating: null,
    rewriteInstruction: '',
    isRegenerating: false,
  }))
}

function reassembleText(sections: SectionState[]): string {
  return sections.map((s) => s.text).filter(Boolean).join('\n\n')
}

async function fetchLessonGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(apiUrl('/api/lesson-generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ system_prompt: systemPrompt, user_prompt: userPrompt }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('lesson-generate API error:', res.status, errorBody)
    throw new Error(`API error ${res.status}`)
  }

  const json = (await res.json()) as { text?: string; error?: string }
  if (json.error) throw new Error(json.error)
  if (!json.text) throw new Error('No text in response')
  return json.text
}

// ============================================================================
// Rating Button
// ============================================================================

const RATING_CONFIG: Record<RatingValue, { label: string; color: string; border: string; bg: string; activeBg: string }> = {
  keep: {
    label: 'Keep',
    color: 'text-green-700',
    border: 'border-green-300',
    bg: 'bg-green-50',
    activeBg: 'bg-green-100 border-green-400 ring-2 ring-green-200',
  },
  tweak: {
    label: 'Tweak',
    color: 'text-yellow-700',
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    activeBg: 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-200',
  },
  rewrite: {
    label: 'Rewrite',
    color: 'text-red-700',
    border: 'border-red-300',
    bg: 'bg-red-50',
    activeBg: 'bg-red-100 border-red-400 ring-2 ring-red-200',
  },
}

// ============================================================================
// Component
// ============================================================================

export default function RateAndRefine(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as RateAndRefineProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    source_store_key,
    sections: sectionDefs = [],
    system_prompt,
    points,
  } = props

  // Store
  const sourceText = useLessonWorkspaceStore((s) => s.data[source_store_key]) as string | undefined
  const setWorkspaceData = useLessonWorkspaceStore((s) => s.setWorkspaceData)

  // State
  const [sectionStates, setSectionStates] = useState<SectionState[]>(() => {
    if (!sourceText) return []
    return splitIntoSections(sourceText, sectionDefs)
  })
  const [copied, setCopied] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const completedCalledRef = useRef(false)

  // Check states
  const allRated = sectionStates.length > 0 && sectionStates.every((s) => s.rating !== null)
  const hasRewriteWithInstruction = sectionStates.some(
    (s) => s.rating === 'rewrite' && s.rewriteInstruction.trim().length > 0
  )
  const hasRewriteNeeded = sectionStates.some((s) => s.rating === 'rewrite')
  const anyRegenerating = sectionStates.some((s) => s.isRegenerating)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.rar-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Section card animation
  const sectionAnimRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const cards = node.querySelectorAll('.rar-section')
    animate(cards, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: (_el, i: number) => i * 120,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Update rating
  const handleRate = useCallback((sectionId: string, rating: RatingValue) => {
    setSectionStates((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, rating, rewriteInstruction: rating !== 'rewrite' ? '' : s.rewriteInstruction }
          : s
      )
    )
  }, [])

  // Update rewrite instruction
  const handleRewriteInstruction = useCallback((sectionId: string, instruction: string) => {
    setSectionStates((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, rewriteInstruction: instruction } : s))
    )
  }, [])

  // Regenerate sections marked as "rewrite"
  const handleRegenerate = useCallback(async () => {
    setRegenerateError(null)

    const sectionsToRewrite = sectionStates.filter(
      (s) => s.rating === 'rewrite' && s.rewriteInstruction.trim()
    )

    if (sectionsToRewrite.length === 0) return

    // Mark regenerating
    setSectionStates((prev) =>
      prev.map((s) =>
        s.rating === 'rewrite' && s.rewriteInstruction.trim()
          ? { ...s, isRegenerating: true }
          : s
      )
    )

    try {
      // Regenerate each section sequentially
      const updatedSections = [...sectionStates]

      for (const section of sectionsToRewrite) {
        const userPrompt = `Here is the original "${section.label}" section:\n\n"${section.text}"\n\nThe user wants you to rewrite this section with this instruction: "${section.rewriteInstruction}"\n\nRewrite ONLY this section. Return just the rewritten text, nothing else.`

        const newText = await fetchLessonGenerate(system_prompt, userPrompt)
        const idx = updatedSections.findIndex((s) => s.id === section.id)
        if (idx !== -1) {
          updatedSections[idx] = {
            ...updatedSections[idx],
            text: newText.trim(),
            rating: 'keep',
            rewriteInstruction: '',
            isRegenerating: false,
          }
        }
      }

      setSectionStates(updatedSections)

      // Update workspace store with full updated text
      const fullText = reassembleText(updatedSections)
      setWorkspaceData(source_store_key, fullText)
    } catch (err) {
      console.error('Regenerate error:', err)
      setRegenerateError(err instanceof Error ? err.message : 'Failed to regenerate. Please try again.')
      // Clear regenerating flags
      setSectionStates((prev) => prev.map((s) => ({ ...s, isRegenerating: false })))
    }
  }, [sectionStates, system_prompt, source_store_key, setWorkspaceData])

  // Copy full text
  const handleCopy = useCallback(async () => {
    const fullText = reassembleText(sectionStates)
    if (!fullText) return
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }, [sectionStates, onActivityComplete])

  // ---------------------------------------------------------------
  // Render: No source data
  // ---------------------------------------------------------------
  if (!sourceText) {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="rar-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="rar-animate flex items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-5" style={{ opacity: 0 }}>
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">No content to refine</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete the previous screen first to generate content to refine.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Rate and Refine
  // ---------------------------------------------------------------
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="rar-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Section cards */}
      <div ref={sectionAnimRef} className="flex flex-col gap-3">
        {sectionStates.map((section) => (
          <div
            key={section.id}
            style={{ opacity: 0 }}
            className={cn(
              'rar-section flex flex-col gap-3 rounded-xl border p-4 transition-colors',
              section.rating === 'keep' && 'border-green-200 bg-green-50/30',
              section.rating === 'tweak' && 'border-yellow-200 bg-yellow-50/30',
              section.rating === 'rewrite' && 'border-red-200 bg-red-50/30',
              !section.rating && 'border-gray-200 bg-white'
            )}
          >
            {/* Section label */}
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {section.label}
            </p>

            {/* Section text */}
            {section.isRegenerating ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="size-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">Rewriting...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                {section.text || '(empty section)'}
              </p>
            )}

            {/* Rating buttons */}
            {!section.isRegenerating && (
              <div className="flex gap-2">
                {(Object.entries(RATING_CONFIG) as [RatingValue, typeof RATING_CONFIG.keep][]).map(
                  ([value, config]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRate(section.id, value)}
                      className={cn(
                        'flex-1 rounded-lg border-2 py-2 text-xs font-semibold transition-all active:scale-[0.97]',
                        section.rating === value
                          ? config.activeBg + ' ' + config.color
                          : config.border + ' ' + config.bg + ' ' + config.color + ' hover:opacity-80'
                      )}
                    >
                      {config.label}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Rewrite instruction input */}
            {section.rating === 'rewrite' && !section.isRegenerating && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-red-600">Tell AI what to change</label>
                <input
                  type="text"
                  value={section.rewriteInstruction}
                  onChange={(e) => handleRewriteInstruction(section.id, e.target.value)}
                  placeholder="e.g. Make it more formal..."
                  className="w-full rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-sm transition-colors focus:border-red-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Regenerate error */}
      {regenerateError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
          <AlertCircle className="size-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700">{regenerateError}</p>
        </div>
      )}

      {/* Regenerate button */}
      {hasRewriteNeeded && hasRewriteWithInstruction && (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={anyRegenerating}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]',
            anyRegenerating
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {anyRegenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {anyRegenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      )}

      {/* Copy button — appears after all sections are rated */}
      {allRated && !hasRewriteNeeded && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.97]',
            copied
              ? 'border-2 border-green-300 bg-green-50 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied!' : 'Copy Email'}
        </button>
      )}

      {/* Points badge — show after copy */}
      {copied && (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50/60 py-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
            <Star className="size-4 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-green-800">Refined!</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      )}
    </div>
  )
}
