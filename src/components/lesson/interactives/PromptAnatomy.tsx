import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import {
  Check,
  Target,
  User,
  FileText,
  Palette,
  Shield,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface Segment {
  id: string
  color: 'red' | 'yellow' | 'blue' | 'purple' | 'green'
  label: string
  chip_text: string
  icon: string
  description: string
  example: string
}

interface PromptAnatomyProps {
  headline: string
  subline: string
  segments: Segment[]
  points_per_layer: number
  cta_text: string
}

// ============================================================================
// Helpers
// ============================================================================

const colorMap: Record<
  string,
  { border: string; bg: string; label: string; text: string; expandBg: string }
> = {
  red: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    label: 'bg-red-100 text-red-700',
    text: 'text-red-700',
    expandBg: 'bg-red-50/60',
  },
  yellow: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50',
    label: 'bg-yellow-100 text-yellow-700',
    text: 'text-yellow-700',
    expandBg: 'bg-yellow-50/60',
  },
  blue: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    label: 'bg-blue-100 text-blue-700',
    text: 'text-blue-700',
    expandBg: 'bg-blue-50/60',
  },
  purple: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50',
    label: 'bg-purple-100 text-purple-700',
    text: 'text-purple-700',
    expandBg: 'bg-purple-50/60',
  },
  green: {
    border: 'border-l-green-500',
    bg: 'bg-green-50',
    label: 'bg-green-100 text-green-700',
    text: 'text-green-700',
    expandBg: 'bg-green-50/60',
  },
}

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  user: User,
  'file-text': FileText,
  palette: Palette,
  shield: Shield,
  layers: Layers,
}

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Target
}

// ============================================================================
// Component
// ============================================================================

export default function PromptAnatomy(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as PromptAnatomyProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, segments, cta_text } = props

  const [explored, setExplored] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completeFired, setCompleteFired] = useState(false)

  const totalSegments = segments.length

  const handleToggle = useCallback(
    (id: string) => {
      setExpanded((prev) => (prev === id ? null : id))

      setExplored((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)

        // Fire completion when all explored
        if (next.size === totalSegments && !completeFired) {
          setCompleteFired(true)
          onActivityComplete?.()
        }

        return next
      })
    },
    [totalSegments, completeFired, onActivityComplete]
  )

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const heading = node.querySelector('.pa-heading')
    const chips = node.querySelectorAll('.pa-chip')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    chips.forEach((chip, i) => {
      animate(chip, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: 150 + i * 80,
      })
    })
  }, [])

  // CTA animation
  const ctaRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || explored.size < totalSegments) return
      animate(node, {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outBack',
      })
    },
    [explored.size, totalSegments]
  )

  // Expand panel animation
  const panelRefFactory = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      animate(node, {
        opacity: [0, 1],
        height: [0, node.scrollHeight],
        duration: 300,
        ease: 'outQuad',
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expanded]
  )

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="pa-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {headline}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{subline}</p>
          <span className="text-xs font-semibold text-muted-foreground">
            {explored.size}/{totalSegments} explored
          </span>
        </div>
      </div>

      {/* Segment chips */}
      <div className="space-y-2">
        {segments.map((segment) => {
          const colors = colorMap[segment.color] ?? colorMap.blue
          const isExplored = explored.has(segment.id)
          const isExpanded = expanded === segment.id
          const Icon = getIcon(segment.icon)

          return (
            <div key={segment.id} className="pa-chip" style={{ opacity: 0 }}>
              {/* Chip button */}
              <button
                type="button"
                onClick={() => handleToggle(segment.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-left transition-colors duration-200',
                  colors.border,
                  isExpanded ? colors.bg : 'bg-card hover:bg-muted/50'
                )}
              >
                {/* Label badge */}
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    colors.label
                  )}
                >
                  {segment.label}
                </span>

                {/* Chip text */}
                <span className="flex-1 text-sm font-medium text-foreground">
                  {segment.chip_text}
                </span>

                {/* Checkmark if explored */}
                {isExplored && (
                  <Check className="size-4 shrink-0 text-green-600" />
                )}
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div
                  ref={panelRefFactory}
                  className={cn(
                    'overflow-hidden rounded-b-xl border-l-4 px-4 py-3',
                    colors.border,
                    colors.expandBg
                  )}
                >
                  <div className="space-y-3">
                    {/* Icon + description */}
                    <div className="flex items-start gap-2">
                      <Icon className={cn('mt-0.5 size-4 shrink-0', colors.text)} />
                      <p className="text-sm text-foreground">{segment.description}</p>
                    </div>

                    {/* Example */}
                    <div className="rounded-lg bg-white/70 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Example
                      </p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-foreground">
                        &ldquo;{segment.example}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA when all explored */}
      {explored.size >= totalSegments && (
        <div
          ref={ctaRef}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3"
          style={{ opacity: 0 }}
        >
          <Check className="size-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{cta_text}</span>
        </div>
      )}
    </div>
  )
}
