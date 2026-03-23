import { useState, useCallback, useRef, useMemo } from 'react'
import { animate } from 'animejs'
import { Copy, Check, AlertCircle, Eye } from 'lucide-react'
import { useLessonWorkspaceStore } from '@/store/lesson-workspace'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface PersonaliseGap {
  id: string
  marker: string
  label: string
  placeholder: string
  hint: string
}

interface PersonaliseMessageProps {
  headline: string
  subline: string
  source_store_key: string
  gaps: PersonaliseGap[]
  points: number
  onActivityComplete?: () => void
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * If the message doesn't contain any gap markers, insert them at reasonable positions.
 * [A] after the first sentence, [B] after a middle sentence, [C] at the end.
 */
function ensureGapMarkers(text: string, gaps: PersonaliseGap[]): string {
  // Check if any markers exist
  const hasMarkers = gaps.some((g) => text.includes(g.marker))
  if (hasMarkers) return text

  // Fallback: insert markers at positions
  const sentences = text.split(/(?<=[.!?])\s+/)
  if (sentences.length <= 1) {
    // Can't split into sentences, just append markers
    return text + ' ' + gaps.map((g) => g.marker).join(' ')
  }

  // Insert markers at distributed positions
  const result = [...sentences]
  const positions = gaps.map((_, i) => {
    if (i === 0) return Math.min(1, result.length - 1)
    if (i === gaps.length - 1) return result.length - 1
    return Math.min(Math.floor((result.length * (i + 1)) / (gaps.length + 1)), result.length - 1)
  })

  // Insert from end to avoid index shifting
  const sorted = [...positions].map((p, i) => ({ pos: p, gap: gaps[i] })).sort((a, b) => b.pos - a.pos)
  for (const { pos, gap } of sorted) {
    result.splice(pos + 1, 0, gap.marker)
  }

  return result.join(' ')
}

// ============================================================================
// Component
// ============================================================================

export default function PersonaliseMessage(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as PersonaliseMessageProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    source_store_key,
    gaps = [],
    points,
  } = props

  // Store
  const sourceText = useLessonWorkspaceStore((s) => s.data[source_store_key]) as string | undefined

  // Process the source text to ensure gap markers
  const processedText = useMemo(() => {
    if (!sourceText) return ''
    return ensureGapMarkers(sourceText, gaps)
  }, [sourceText, gaps])

  // State
  const [gapValues, setGapValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const completedCalledRef = useRef(false)

  // All gaps filled?
  const allFilled = gaps.every((g) => (gapValues[g.id] || '').trim().length > 0)

  // Build the personalized message
  const personalizedMessage = useMemo(() => {
    let result = processedText
    for (const gap of gaps) {
      const value = (gapValues[gap.id] || '').trim()
      if (value) {
        result = result.replaceAll(gap.marker, value)
      }
    }
    return result
  }, [processedText, gaps, gapValues])

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.pm-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Preview animation
  const previewRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Update a gap value
  const updateGap = useCallback((id: string, value: string) => {
    setGapValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!allFilled) return
    try {
      await navigator.clipboard.writeText(personalizedMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }, [allFilled, personalizedMessage, onActivityComplete])

  // ---------------------------------------------------------------
  // Render: No source data
  // ---------------------------------------------------------------
  if (!sourceText) {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="pm-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="pm-animate flex items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-5" style={{ opacity: 0 }}>
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">No message to personalise</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete the previous screen first to generate a message to personalise.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Main UI
  // ---------------------------------------------------------------

  // Render the message text with gap markers highlighted
  const renderHighlightedMessage = () => {
    const parts: Array<{ type: 'text' | 'marker'; content: string; gapId?: string }> = []
    let remaining = processedText

    // Build a regex that matches any marker
    const markerPattern = gaps.map((g) => g.marker.replace(/[[\]]/g, '\\$&')).join('|')
    if (!markerPattern) {
      return <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{processedText}</p>
    }

    const regex = new RegExp(`(${markerPattern})`, 'g')
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(remaining)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: remaining.slice(lastIndex, match.index) })
      }
      // The marker
      const matchedMarker = match[1]
      const gap = gaps.find((g) => g.marker === matchedMarker)
      const value = gap ? (gapValues[gap.id] || '').trim() : ''

      if (value) {
        parts.push({ type: 'marker', content: value, gapId: gap?.id })
      } else {
        parts.push({ type: 'marker', content: matchedMarker, gapId: gap?.id })
      }

      lastIndex = match.index + match[0].length
    }

    // Remaining text
    if (lastIndex < remaining.length) {
      parts.push({ type: 'text', content: remaining.slice(lastIndex) })
    }

    return (
      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i}>{part.content}</span>
          }
          const isFilled = part.gapId ? (gapValues[part.gapId] || '').trim().length > 0 : false
          return (
            <span
              key={i}
              className={cn(
                'inline rounded px-1 py-0.5 font-semibold transition-colors',
                isFilled
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-blue-200/60 text-blue-600'
              )}
            >
              {part.content}
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="pm-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Message card with highlighted markers */}
      <div className="pm-animate rounded-xl border border-blue-200 bg-blue-50/30 p-4" style={{ opacity: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-blue-100">
            <span className="text-[10px] font-bold text-blue-600">AI</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Message Template</p>
        </div>
        {renderHighlightedMessage()}
      </div>

      {/* Gap input cards */}
      <div className="pm-animate flex flex-col gap-3" style={{ opacity: 0 }}>
        {gaps.map((gap) => (
          <div
            key={gap.id}
            className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-[10px] font-bold text-blue-700">
                {gap.marker.replace(/[[\]]/g, '')}
              </span>
              <p className="text-xs font-semibold text-foreground">{gap.label}</p>
            </div>

            <input
              type="text"
              value={gapValues[gap.id] || ''}
              onChange={(e) => updateGap(gap.id, e.target.value)}
              placeholder={gap.placeholder}
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50/50 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
            />

            <p className="text-[11px] text-muted-foreground">{gap.hint}</p>
          </div>
        ))}
      </div>

      {/* Preview toggle */}
      {allFilled && (
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="pm-animate flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50/50 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-50 active:scale-[0.97]"
          style={{ opacity: 0 }}
        >
          <Eye className="size-4" />
          {showPreview ? 'Hide Preview' : 'Preview Message'}
        </button>
      )}

      {/* Live preview */}
      {showPreview && allFilled && (
        <div ref={previewRef} className="rounded-xl border-2 border-blue-300 bg-white p-4 shadow-sm" style={{ opacity: 0 }}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-blue-600">Final Message</p>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{personalizedMessage}</p>
        </div>
      )}

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={!allFilled}
        style={{ opacity: 0 }}
        className={cn(
          'pm-animate flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.97]',
          !allFilled
            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            : copied
              ? 'border-2 border-green-300 bg-green-50 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? 'Copied!' : 'Copy Message'}
      </button>

      {/* Points badge — show after copy */}
      {copied && (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50/60 py-3">
          <p className="text-sm font-semibold text-green-800">Personalised!</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      )}
    </div>
  )
}
