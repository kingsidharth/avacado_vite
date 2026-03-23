import { useState, useCallback } from 'react'
import { animate } from 'animejs'
import { Upload, Scissors, Search, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface PipelineNode {
  id: string
  icon: string
  label: string
  title: string
  description: string
  analogy: string
}

interface RAGPipelineExplorerProps {
  headline: string
  subline: string
  nodes: PipelineNode[]
  min_to_proceed: number
  cta_text: string
  points: number
}

// ============================================================================
// Icon mapping
// ============================================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  upload: Upload,
  scissors: Scissors,
  search: Search,
  sparkles: Sparkles,
}

function getIcon(name: string) {
  return iconMap[name.toLowerCase()] ?? Sparkles
}

// ============================================================================
// Component
// ============================================================================

export default function RAGPipelineExplorer(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as RAGPipelineExplorerProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, nodes, min_to_proceed, cta_text, points } = props

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [explored, setExplored] = useState<Set<string>>(new Set())
  const [completeFired, setCompleteFired] = useState(false)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.rpe-heading')
    const nodeEls = node.querySelectorAll('.rpe-node')

    if (heading) {
      animate(heading, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })
    }

    if (nodeEls.length) {
      animate(nodeEls, {
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outQuad',
        delay: (_el, i: number) => 250 + i * 100,
      })
    }
  }, [])

  // Expand animation
  const expandRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      translateY: [-8, 0],
      opacity: [0, 1],
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  // CTA animation
  const ctaRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      translateY: [12, 0],
      opacity: [0, 1],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  const handleToggleNode = useCallback(
    (id: string) => {
      const isOpening = expandedId !== id
      setExpandedId(isOpening ? id : null)

      if (isOpening && !explored.has(id)) {
        const newExplored = new Set(explored)
        newExplored.add(id)
        setExplored(newExplored)

        if (newExplored.size >= min_to_proceed && !completeFired) {
          setCompleteFired(true)
          onActivityComplete?.()
        }
      }
    },
    [expandedId, explored, min_to_proceed, completeFired, onActivityComplete]
  )

  const exploredCount = explored.size
  const totalNodes = nodes.length
  const allExplored = exploredCount >= totalNodes
  const canProceed = exploredCount >= min_to_proceed

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="rpe-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${(exploredCount / totalNodes) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {exploredCount}/{totalNodes} explored
        </span>
      </div>

      {/* Pipeline */}
      <div className="relative flex flex-col">
        {/* Vertical connecting line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-muted" />
        <div
          className="absolute left-5 top-6 w-0.5 bg-green-500 transition-all duration-500 ease-out"
          style={{
            height: allExplored
              ? 'calc(100% - 48px)'
              : `${(exploredCount / totalNodes) * 100}%`,
          }}
        />

        {nodes.map((pNode, i) => {
          const Icon = getIcon(pNode.icon)
          const isExpanded = expandedId === pNode.id
          const isExplored = explored.has(pNode.id)
          const isLast = i === nodes.length - 1

          return (
            <div key={pNode.id} className={cn('rpe-node relative', !isLast && 'pb-3')} style={{ opacity: 0 }}>
              <button
                type="button"
                onClick={() => handleToggleNode(pNode.id)}
                className={cn(
                  'relative z-10 flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.98]',
                  isExpanded
                    ? 'border-blue-400 bg-blue-50'
                    : isExplored
                      ? 'border-green-300 bg-green-50'
                      : 'border-border bg-card'
                )}
              >
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    isExplored ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isExplored ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{pNode.label}</span>
                <ChevronDown
                  className={cn(
                    'size-4 text-muted-foreground transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  ref={expandRef}
                  className="relative z-10 ml-5 mt-1 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
                  style={{ opacity: 0 }}
                >
                  <h3 className="text-sm font-bold text-foreground">{pNode.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {pNode.description}
                  </p>
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                    <p className="text-xs font-medium text-amber-800">
                      {pNode.analogy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {canProceed && (
        <div ref={ctaRef} className="flex flex-col items-center gap-1 pt-1" style={{ opacity: 0 }}>
          <p className="text-sm font-semibold text-green-700">{cta_text}</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      )}
    </div>
  )
}
