import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import {
  UserCheck,
  Link,
  Paperclip,
  Search,
  FileText,
  Zap,
  Check,
  Lock,
  ArrowRight,
  BookOpen,
  Target,
  Shield,
  LayoutGrid,
  Repeat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Technique {
  id: string
  icon: string
  label: string
  description: string
}

interface TechniqueToolkitProps {
  headline: string
  subline: string
  max_selections: number
  techniques: Technique[]
  points: number
  onActivityComplete?: () => void
}

// ============================================================================
// Icon mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  'user-check': UserCheck,
  link: Link,
  paperclip: Paperclip,
  telescope: Search,
  'file-text': FileText,
  zap: Zap,
  book: BookOpen,
  target: Target,
  shield: Shield,
  lock: Lock,
  layout: LayoutGrid,
  repeat: Repeat,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Zap
}

// ============================================================================
// Component
// ============================================================================

export default function TechniqueToolkit(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as TechniqueToolkitProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    max_selections = 3,
    techniques = [],
  } = props

  const [selected, setSelected] = useState<string[]>([])
  const completedCalledRef = useRef(false)

  const isMaxed = selected.length >= max_selections

  // Callback ref for mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const cards = node.querySelectorAll('.toolkit-card')
    animate(cards, {
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.96, 1],
      delay: (_el, i: number) => i * 70,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  const handleToggle = useCallback(
    (id: string) => {
      setSelected((prev) => {
        if (prev.includes(id)) {
          return prev.filter((s) => s !== id)
        }
        if (prev.length >= max_selections) return prev
        return [...prev, id]
      })
    },
    [max_selections]
  )

  const handleCta = useCallback(() => {
    if (completedCalledRef.current) return
    completedCalledRef.current = true
    onActivityComplete?.()
  }, [onActivityComplete])

  const getCardClasses = (id: string) => {
    const isSelected = selected.includes(id)
    const isDimmed = isMaxed && !isSelected

    if (isSelected) {
      return 'border-green-400 bg-green-50/80 ring-2 ring-green-200'
    }
    if (isDimmed) {
      return 'border-gray-200 bg-white opacity-35'
    }
    return 'border-gray-200 bg-white hover:border-gray-300'
  }

  const getCtaLabel = () => {
    if (selected.length === 0) return 'Skip'
    return 'Lock In My Toolkit'
  }

  const getCtaIcon = () => {
    if (selected.length === 0) return <ArrowRight className="size-4" />
    if (selected.length >= max_selections) return <Lock className="size-4" />
    return null
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* 2x3 grid */}
      <div ref={containerRef} className="grid grid-cols-2 gap-3">
        {techniques.map((tech) => {
          const Icon = getIcon(tech.icon)
          const isSelected = selected.includes(tech.id)
          const isDimmed = isMaxed && !isSelected

          return (
            <button
              key={tech.id}
              onClick={() => handleToggle(tech.id)}
              disabled={isDimmed}
              style={{ opacity: 0 }}
              className={`toolkit-card relative flex flex-col items-start gap-2 rounded-xl border-2 p-3.5 text-left transition-all active:scale-[0.97] ${getCardClasses(tech.id)}`}
            >
              {/* Checkmark badge */}
              {isSelected && (
                <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-green-500">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Icon */}
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Icon
                  className={`size-5 ${
                    isSelected ? 'text-green-700' : 'text-gray-600'
                  }`}
                />
              </div>

              {/* Label + description */}
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-snug">{tech.label}</p>
                <p className="text-xs leading-snug text-muted-foreground">
                  {tech.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Summary bar */}
      {selected.length > 0 && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-muted-foreground">
          <span className="font-medium text-gray-800">Your toolkit: </span>
          {selected
            .map((id) => techniques.find((t) => t.id === id)?.label)
            .filter(Boolean)
            .join(' \u00b7 ')}
        </div>
      )}

      {/* Selection counter */}
      <p className="text-center text-xs text-muted-foreground">
        {selected.length} / {max_selections} selected
      </p>

      {/* CTA button */}
      <button
        onClick={handleCta}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
          selected.length > 0
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {getCtaLabel()}
        {getCtaIcon()}
      </button>
    </div>
  )
}
