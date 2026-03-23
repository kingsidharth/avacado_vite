import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import { Clock, ChevronDown, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLessonWorkspaceStore } from '@/store/lesson-workspace'

// ============================================================================
// Types
// ============================================================================

interface RankedItem {
  id: string
  label: string
}

interface RoutineEntry {
  id: string
  label: string
  time: string
  prompt: string
}

interface RoutineBuilderProps {
  headline: string
  subline: string
  source_store_key: string
  time_options: string[]
  prompt_suggestions: Record<string, string[]>
  points: number
  completion_text: string
}

// ============================================================================
// Component
// ============================================================================

export default function RoutineBuilder(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as RoutineBuilderProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    source_store_key,
    time_options,
    prompt_suggestions,
    points,
    completion_text,
  } = props

  const getWorkspaceData = useLessonWorkspaceStore((s) => s.getWorkspaceData)
  const rankedItems = getWorkspaceData(source_store_key) as RankedItem[] | undefined

  const [entries, setEntries] = useState<RoutineEntry[]>(() => {
    if (!rankedItems || !Array.isArray(rankedItems)) return []
    return rankedItems.map((item) => ({
      id: item.id,
      label: item.label,
      time: '',
      prompt: '',
    }))
  })
  const [saved, setSaved] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.rb-heading')
    const cardEls = node.querySelectorAll('.rb-card')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    if (cardEls.length) {
      animate(cardEls, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: (_el, i: number) => 200 + i * 100,
      })
    }
  }, [])

  // Preview animation
  const previewRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      scale: [0.95, 1],
      opacity: [0, 1],
      duration: 450,
      ease: 'outBack',
    })
  }, [])

  const updateEntry = useCallback((id: string, field: 'time' | 'prompt', value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }, [])

  const handleChipTap = useCallback((id: string, suggestion: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, prompt: suggestion } : e))
    )
  }, [])

  const allFilled = entries.length > 0 && entries.every((e) => e.time && e.prompt.trim())

  const handleSave = useCallback(() => {
    if (!allFilled || saved) return
    setSaved(true)
    if (!completeFired) {
      setCompleteFired(true)
      onActivityComplete?.()
    }
  }, [allFilled, saved, completeFired, onActivityComplete])

  // Fallback when no ranked data exists
  if (!rankedItems || !Array.isArray(rankedItems) || rankedItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-1 py-6 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Complete the ranking exercise first to build your routine.
        </p>
      </div>
    )
  }

  // Preview screen
  if (saved) {
    return (
      <div ref={previewRef} className="flex flex-col gap-4 px-1 py-2" style={{ opacity: 0 }}>
        <div className="space-y-1 text-center">
          <Sparkles className="mx-auto size-7 text-blue-500" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            YOUR AI WORK DAY
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <Clock className="size-4 text-blue-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {entry.time}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{entry.label}</p>
              <p className="mt-1 text-xs text-muted-foreground italic">
                &ldquo;{entry.prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{completion_text}</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      </div>
    )
  }

  // Builder screen
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="rb-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Entry cards */}
      {entries.map((entry, index) => {
        const suggestions = prompt_suggestions[entry.id] ?? []

        return (
          <div
            key={entry.id}
            className="rb-card flex flex-col gap-3 rounded-xl border-2 border-border bg-card p-4"
            style={{ opacity: 0 }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-foreground">{entry.label}</p>
            </div>

            {/* Time dropdown */}
            <div className="relative">
              <select
                value={entry.time}
                onChange={(e) => updateEntry(entry.id, 'time', e.target.value)}
                className={cn(
                  'w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-8 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                  !entry.time && 'text-muted-foreground'
                )}
              >
                <option value="" disabled>
                  When will you do this?
                </option>
                {time_options.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Prompt text field */}
            <textarea
              value={entry.prompt}
              onChange={(e) => updateEntry(entry.id, 'prompt', e.target.value)}
              placeholder="What will you ask AI to help with?"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            {/* Suggestion chips */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleChipTap(entry.id, sug)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      entry.prompt === sug
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!allFilled}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200',
          allFilled
            ? 'bg-primary text-primary-foreground active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
        )}
      >
        Save My Routine
      </button>
    </div>
  )
}
