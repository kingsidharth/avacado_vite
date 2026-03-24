import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { animate } from 'animejs'
import type { Lesson } from '@/types/content'
import {
  DEFAULT_PATH_ASSETS,
  type PathAssets,
} from './learning-path-assets'
import { LessonNode, type LessonNodeState, type LessonNodeSide } from './LessonNode'
import { useSessionStore } from '@/store/session'
import { makeLessonKey } from '@/store/progress'

interface LessonPathEntry {
  lesson: Lesson
  isLocked: boolean
  isComplete: boolean
  isCurrent: boolean
  milestoneId: string
  levelId: string
}

/** Path segment state: completed (green) or locked (blue). */
export type PathSegmentState = 'completed' | 'locked'

export type { PathAssets } from './learning-path-assets'

interface LessonPathMapProps {
  entries: LessonPathEntry[]
  pathAssets?: PathAssets
}

function resolveState(entry: LessonPathEntry): LessonNodeState {
  if (entry.isComplete) return 'completed'
  if (entry.isCurrent || (!entry.isLocked && !entry.isComplete)) return 'active'
  return 'locked'
}

// ============================================================================
// PathConnector
// ============================================================================

/**
 * Connector between two nodes.
 *
 * Geometry:
 *   – Left node circle (76px wide) is always at the left edge  → center at x = 38px
 *   – Right node circle (76px wide) is always at the right edge → center at x = containerWidth - 38px
 *   – Path SVG stems are 6px wide; left stem spans x=0–6 (center 3px), right stem x=276.864–282.864 (center ~280px)
 *
 * Positioning so stems hit node centers:
 *   marginLeft = 38 - 3 = 35px   (left stem centre aligns with left node centre)
 *   width = calc(100% - 70px)    (right edge at containerWidth-35; right stem centre at containerWidth-38 ✓)
 *
 * SVGs use preserveAspectRatio="none" so they stretch horizontally to any container width.
 * Only the src changes between LTR (after left node) and RTL (after right node).
 *
 * When animatePath=true the green completed path sweeps in from left → right over the
 * locked (grey) path. Once the sweep finishes, onAnimationComplete is called so the
 * parent can transition the next module node from "locked" to "active".
 */
function PathConnector({
  fromSide,
  segmentState,
  pathAssets,
  animatePath = false,
  onAnimationComplete,
}: {
  fromSide: LessonNodeSide
  segmentState: PathSegmentState
  pathAssets: PathAssets
  animatePath?: boolean
  onAnimationComplete?: () => void
}) {
  const completedSrc =
    fromSide === 'left' ? pathAssets.completedPathLtr : pathAssets.completedPathRtl
  const lockedSrc =
    fromSide === 'left' ? pathAssets.lockedPathLtr : pathAssets.lockedPathRtl
  const src = segmentState === 'completed' ? completedSrc : lockedSrc

  // Triggered once when the overlay image mounts (animatePath=true path only).
  // Uses useCallback-as-ref pattern (same as LessonComplete) so no useEffect needed.
  const overlayRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !animatePath) return
      const animationConfig = {
        clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
        duration: 900,
        ease: 'outQuad',
        delay: 400,
      }

      animate(
        node,
        onAnimationComplete
          ? { ...animationConfig, onComplete: onAnimationComplete }
          : animationConfig,
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animatePath],
  )

  if (animatePath) {
    return (
      <div className="relative ml-[35px] w-[calc(100%_-_70px)]">
        {/* Locked path sits underneath as the "before" state */}
        <img
          src={lockedSrc}
          alt=""
          className="h-[116px] w-full"
          width={283}
          height={116}
        />
        {/* Completed path sweeps in left → right on top */}
        <img
          ref={overlayRef}
          src={completedSrc}
          alt=""
          className="path-anim-hidden absolute inset-0 h-[116px] w-full"
          width={283}
          height={116}
        />
      </div>
    )
  }

  return (
    <div className="ml-[35px] w-[calc(100%_-_70px)]">
      <img
        src={src}
        alt=""
        className="h-[116px] w-full"
        width={283}
        height={116}
      />
    </div>
  )
}

// ============================================================================
// LessonPathMap
// ============================================================================

export function LessonPathMap({
  entries,
  pathAssets = DEFAULT_PATH_ASSETS,
}: LessonPathMapProps) {
  const navigate = useNavigate()
  const { newlyCompletedLessonKey, clearNewlyCompleted } = useSessionStore()

  // Once the path sweep animation finishes, flip this to true so the next
  // module node transitions from "locked" to "active".
  const [pathAnimDone, setPathAnimDone] = useState(false)

  // Find which entry (if any) was just completed so we know which connector to animate.
  const newlyCompletedIdx = entries.findIndex(
    (e) => makeLessonKey(e.milestoneId, e.levelId, e.lesson.id) === newlyCompletedLessonKey,
  )

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => {
        const side: LessonNodeSide = i % 2 === 0 ? 'right' : 'left'
        const rawState = resolveState(entry)

        // While the path animation is in progress, hold the node immediately
        // after the newly completed one at "locked" so it appears to be reached
        // by the sweeping path. Once the animation completes it flips to "active".
        const isNextPendingReveal =
          !pathAnimDone && newlyCompletedIdx >= 0 && i === newlyCompletedIdx + 1
        const state: LessonNodeState =
          isNextPendingReveal && rawState === 'active' ? 'locked' : rawState

        // Segment state is based on raw (actual) state, not the deferred visual state.
        const segmentState: PathSegmentState = rawState === 'completed' ? 'completed' : 'locked'

        // Animate the connector that immediately follows the newly completed node.
        const animatePath = !pathAnimDone && newlyCompletedIdx >= 0 && i === newlyCompletedIdx

        const moduleNumber = i + 1
        const durationLabel = entry.lesson.estimated_duration_minutes
          ? `${entry.lesson.estimated_duration_minutes} Min`
          : 'Quick'
        const meta = `${durationLabel} • Module ${moduleNumber}`

        return (
          <div key={entry.lesson.id}>
            <LessonNode
              state={state}
              side={side}
              title={entry.lesson.title}
              meta={meta}
              onClick={() => {
                void navigate({
                  to: '/lesson-loading/$milestoneId/$levelId/$lessonId',
                  params: {
                    milestoneId: entry.milestoneId,
                    levelId: entry.levelId,
                    lessonId: entry.lesson.id,
                  },
                })
              }}
            />
            {i < entries.length - 1 && (
              <PathConnector
                fromSide={side}
                segmentState={segmentState}
                pathAssets={pathAssets}
                animatePath={animatePath}
                onAnimationComplete={() => {
                  setPathAnimDone(true)
                  clearNewlyCompleted()
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
