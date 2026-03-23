import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import {
  ChevronDown,
  Zap,
  Brain,
  ListChecks,
  MessageSquare,
  Repeat,
  Sparkles,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface Technique {
  id: string
  icon: string
  label: string
  power: number
  tagline: string
  when_to_use: string
  example: string
  best_for: string
}

interface TechniqueExplorerProps {
  headline: string
  subline: string
  min_to_proceed: number
  techniques: Technique[]
  points_per_technique: number
  cta_text: string
}

// ============================================================================
// Helpers
// ============================================================================

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  brain: Brain,
  'list-checks': ListChecks,
  'message-square': MessageSquare,
  repeat: Repeat,
  sparkles: Sparkles,
}

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Zap
}

function PowerDots({ power, max = 5 }: { power: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            'size-2 rounded-full',
            i < power ? 'bg-primary' : 'bg-muted'
          )}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export default function TechniqueExplorer(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as TechniqueExplorerProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    min_to_proceed,
    techniques,
    cta_text,
  } = props

  const [opened, setOpened] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completeFired, setCompleteFired] = useState(false)

  const remaining = Math.max(0, min_to_proceed - opened.size)
  const allUnlocked = remaining === 0

  const handleToggle = useCallback(
    (id: string) => {
      setExpanded((prev) => (prev === id ? null : id))

      setOpened((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)

        // Fire completion when min_to_proceed reached
        if (next.size >= min_to_proceed && !completeFired) {
          setCompleteFired(true)
          onActivityComplete?.()
        }

        return next
      })
    },
    [min_to_proceed, completeFired, onActivityComplete]
  )

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const heading = node.querySelector('.te-heading')
    const cards = node.querySelectorAll('.te-card')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    cards.forEach((card, i) => {
      animate(card, {
        translateY: [24, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: 150 + i * 80,
      })
    })
  }, [])

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

  // CTA animation
  const ctaRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !allUnlocked) return
      animate(node, {
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outBack',
      })
    },
    [allUnlocked]
  )

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="te-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {headline}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{subline}</p>
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            {allUnlocked ? (
              <>
                <Sparkles className="size-3 text-green-600" />
                <span className="text-green-700">All unlocked!</span>
              </>
            ) : (
              <>
                <Lock className="size-3" />
                {remaining} remaining
              </>
            )}
          </span>
        </div>
      </div>

      {/* Technique cards */}
      <div className="space-y-2">
        {techniques.map((technique) => {
          const isOpened = opened.has(technique.id)
          const isExpanded = expanded === technique.id
          const Icon = getIcon(technique.icon)

          return (
            <div key={technique.id} className="te-card" style={{ opacity: 0 }}>
              {/* Card header */}
              <button
                type="button"
                onClick={() => handleToggle(technique.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200',
                  isExpanded
                    ? 'border-primary/30 bg-primary/5'
                    : isOpened
                      ? 'border-green-200 bg-card'
                      : 'border-border bg-card hover:border-primary/20'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    isOpened ? 'bg-green-100' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      isOpened ? 'text-green-600' : 'text-muted-foreground'
                    )}
                  />
                </div>

                {/* Label + tagline + power */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {technique.label}
                    </span>
                    <PowerDots power={technique.power} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {technique.tagline}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  ref={panelRefFactory}
                  className="overflow-hidden rounded-b-xl border-x-2 border-b-2 border-primary/30 bg-primary/5 px-4 py-3"
                >
                  <div className="space-y-3">
                    {/* When to use */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        When to use
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {technique.when_to_use}
                      </p>
                    </div>

                    {/* Example */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Example prompt
                      </p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-foreground">
                        &ldquo;{technique.example}&rdquo;
                      </p>
                    </div>

                    {/* Best for */}
                    <div className="flex items-start gap-2 rounded-lg bg-green-50 p-2">
                      <Sparkles className="mt-0.5 size-3 shrink-0 text-green-600" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">
                          Best for
                        </p>
                        <p className="mt-0.5 text-xs text-green-700">
                          {technique.best_for}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA when min reached */}
      {allUnlocked && (
        <div
          ref={ctaRef}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3"
          style={{ opacity: 0 }}
        >
          <Sparkles className="size-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{cta_text}</span>
        </div>
      )}
    </div>
  )
}
