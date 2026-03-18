import { useNavigate } from '@tanstack/react-router'
import type { Lesson } from '@/types/content'
import {
  DEFAULT_PATH_ASSETS,
  type PathAssets,
} from './learning-path-assets'
import { LessonNode, type LessonNodeState, type LessonNodeSide } from './LessonNode'

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
 */
function PathConnector({
  fromSide,
  segmentState,
  pathAssets,
}: {
  fromSide: LessonNodeSide
  segmentState: PathSegmentState
  pathAssets: PathAssets
}) {
  const src =
    fromSide === 'left'
      ? segmentState === 'completed'
        ? pathAssets.completedPathLtr
        : pathAssets.lockedPathLtr
      : segmentState === 'completed'
        ? pathAssets.completedPathRtl
        : pathAssets.lockedPathRtl

  return (
    <div className="ml-[35px] w-[calc(100%-70px)]">
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

export function LessonPathMap({
  entries,
  pathAssets = DEFAULT_PATH_ASSETS,
}: LessonPathMapProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => {
        const side: LessonNodeSide = i % 2 === 0 ? 'right' : 'left'
        const state = resolveState(entry)
        const segmentState: PathSegmentState =
          state === 'completed' ? 'completed' : 'locked'
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
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
