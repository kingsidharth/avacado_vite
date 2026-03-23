import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import {
  GripVertical,
  Lock,
  Mail,
  Target,
  Presentation,
  Database,
  Clock,
  FileText,
  MessageSquare,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLessonWorkspaceStore } from '@/store/lesson-workspace'

// ============================================================================
// Types
// ============================================================================

interface RankingItem {
  id: string
  label: string
  icon: string
}

interface RankingExerciseProps {
  headline: string
  subline: string
  items: RankingItem[]
  top_n: number
  store_key: string
  completion_text: string
  points: number
}

// ============================================================================
// Icon map
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  target: Target,
  presentation: Presentation,
  database: Database,
  clock: Clock,
  'file-text': FileText,
  'message-square': MessageSquare,
  pencil: Pencil,
}

function getIcon(name: string) {
  return ICON_MAP[name] ?? FileText
}

// ============================================================================
// Component
// ============================================================================

export default function RankingExercise(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as RankingExerciseProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const { headline, subline, items: initialItems, top_n, store_key, completion_text, points } = props

  const setWorkspaceData = useLessonWorkspaceStore((s) => s.setWorkspaceData)

  const [items, setItems] = useState<RankingItem[]>(() => [...initialItems])
  const [hasReordered, setHasReordered] = useState(false)
  const [locked, setLocked] = useState(false)
  const [completeFired, setCompleteFired] = useState(false)

  // Drag state
  const dragState = useRef<{
    active: boolean
    index: number
    startY: number
    currentY: number
    cardHeight: number
  } | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const heading = node.querySelector('.rank-heading')
    const cardEls = node.querySelectorAll('.rank-card')

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
        delay: (_el, i: number) => 200 + i * 80,
      })
    }
  }, [])

  // Completion animation
  const completionRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      translateY: [16, 0],
      opacity: [0, 1],
      duration: 400,
      ease: 'outBack',
    })
  }, [])

  // ------ Pointer-based drag-to-reorder ------

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (locked) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const listEl = listRef.current
      if (!listEl) return
      const cards = listEl.querySelectorAll('.rank-card')
      const cardHeight = (cards[0] as HTMLElement)?.getBoundingClientRect().height ?? 60
      // Include the gap (10px = gap-2.5)
      const totalCardHeight = cardHeight + 10

      dragState.current = {
        active: true,
        index,
        startY: e.clientY,
        currentY: e.clientY,
        cardHeight: totalCardHeight,
      }
      setDraggingIndex(index)
      setDragOffset(0)
    },
    [locked]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current
      if (!ds || !ds.active) return

      ds.currentY = e.clientY
      const rawOffset = ds.currentY - ds.startY
      setDragOffset(rawOffset)

      // How many positions to shift
      const shift = Math.round(rawOffset / ds.cardHeight)
      if (shift !== 0) {
        const fromIndex = ds.index
        const toIndex = Math.max(0, Math.min(items.length - 1, fromIndex + shift))
        if (fromIndex !== toIndex) {
          setItems((prev) => {
            const next = [...prev]
            const [moved] = next.splice(fromIndex, 1)
            next.splice(toIndex, 0, moved)
            return next
          })
          setHasReordered(true)
          ds.index = toIndex
          ds.startY = ds.currentY
          setDragOffset(0)
        }
      }
    },
    [items.length]
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    setDraggingIndex(null)
    setDragOffset(0)
  }, [])

  const handleLock = useCallback(() => {
    if (locked) return
    setLocked(true)

    // Save top N items to workspace store
    const topItems = items.slice(0, top_n).map((item) => ({
      id: item.id,
      label: item.label,
    }))
    setWorkspaceData(store_key, topItems)

    if (!completeFired) {
      setCompleteFired(true)
      onActivityComplete?.()
    }
  }, [locked, items, top_n, store_key, setWorkspaceData, completeFired, onActivityComplete])

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-1 py-2">
      {/* Header */}
      <div className="rank-heading space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Ranking list */}
      <div
        ref={listRef}
        className="flex flex-col gap-2.5"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {items.map((item, index) => {
          const Icon = getIcon(item.icon)
          const isDragging = draggingIndex === index
          const isTopN = locked && index < top_n

          return (
            <div
              key={item.id}
              className={cn(
                'rank-card flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all duration-200 select-none',
                isDragging
                  ? 'border-blue-400 bg-blue-50 shadow-lg z-10 scale-[1.02]'
                  : isTopN
                    ? 'border-blue-400 bg-blue-50'
                    : locked
                      ? 'border-border bg-card opacity-50'
                      : 'border-border bg-card'
              )}
              style={
                isDragging
                  ? { opacity: 0, transform: `translateY(${dragOffset}px) scale(1.02)`, position: 'relative', zIndex: 10 }
                  : { opacity: 0 }
              }
            >
              {/* Rank number */}
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isTopN
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1}
              </span>

              {/* Icon */}
              <Icon className="size-5 shrink-0 text-muted-foreground" />

              {/* Label */}
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>

              {/* Grip handle */}
              {!locked && (
                <div
                  className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={(e) => handlePointerDown(e, index)}
                >
                  <GripVertical className="size-5 text-muted-foreground" />
                </div>
              )}
              {locked && isTopN && (
                <Lock className="size-4 shrink-0 text-blue-500" />
              )}
            </div>
          )
        })}
      </div>

      {/* Top N divider hint */}
      {!locked && (
        <p className="text-center text-xs text-muted-foreground">
          Drag to reorder. Your top {top_n} will be locked in.
        </p>
      )}

      {/* Lock button */}
      {!locked && (
        <button
          type="button"
          onClick={handleLock}
          disabled={!hasReordered}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200',
            hasReordered
              ? 'bg-primary text-primary-foreground active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          )}
        >
          Lock In My Top {top_n}
        </button>
      )}

      {/* Completion */}
      {locked && (
        <div ref={completionRef} className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4" style={{ opacity: 0 }}>
          <p className="text-sm font-medium text-green-800">{completion_text}</p>
          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>
      )}
    </div>
  )
}
