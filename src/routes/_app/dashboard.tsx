import { createFileRoute } from '@tanstack/react-router'
import {
  useContentManifest,
  useMilestones,
  useLessons,
} from '@/hooks/useContentManifest'
import { useGating, useProgressStore, type ProgressStore } from '@/store/progress'
import { Lock } from 'lucide-react'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { LessonPathMap } from '@/components/dashboard/LessonPathMap'

// ============================================================================
// Level Path — resolves gating state for all lessons in a level
// ============================================================================

function LevelPath({
  milestoneId,
  levelId,
  isActiveLevel,
}: {
  milestoneId: string
  levelId: string
  isActiveLevel: boolean
}) {
  const manifest = useContentManifest()
  const lessons = useLessons(milestoneId, levelId)
  const { isLessonUnlocked } = useGating(manifest)
  const isLessonComplete = useProgressStore((s: ProgressStore) => s.isLessonComplete)

  const currentLessonId = isActiveLevel
    ? lessons.find((l) => !isLessonComplete(milestoneId, levelId, l.id))?.id
    : undefined

  const entries = lessons.map((lesson) => {
    const unlocked = isLessonUnlocked(milestoneId, levelId, lesson.id)
    const complete = isLessonComplete(milestoneId, levelId, lesson.id)
    return {
      lesson,
      milestoneId,
      levelId,
      isLocked: !unlocked,
      isComplete: complete,
      isCurrent: lesson.id === currentLessonId,
    }
  })

  return <LessonPathMap entries={entries} />
}

// ============================================================================
// Level Section — header + path map, or locked state
// ============================================================================

function LevelSection({
  milestoneId,
  levelId,
  levelNumber,
  title,
  description,
  isActive,
  isLocked,
}: {
  milestoneId: string
  levelId: string
  levelNumber: number
  title: string
  description: string
  isActive: boolean
  isLocked: boolean
}) {
  return (
    <section className="space-y-6">
      {/* Level header */}
      <div className="flex flex-col gap-1">
        <p className="text-caption text-ui-muted-strong">Level {levelNumber}</p>
        <h2 className="text-level-title text-foreground">{title}</h2>
        <p className="text-body text-ui-muted font-normal leading-[1.4]">
          {description}
        </p>
      </div>

      {isLocked ? (
        <div className="border-ui-locked flex items-center gap-2 rounded-xl border border-dashed px-4 py-6">
          <Lock className="text-ui-locked size-5" />
          <p className="text-body text-ui-muted-subtle font-normal">
            Complete the previous level to unlock
          </p>
        </div>
      ) : (
        <LevelPath
          milestoneId={milestoneId}
          levelId={levelId}
          isActiveLevel={isActive}
        />
      )}
    </section>
  )
}

// ============================================================================
// Dashboard Page
// ============================================================================

function DashboardPage() {
  const manifest = useContentManifest()
  const milestones = useMilestones()
  const { isMilestoneUnlocked, isLevelUnlocked } = useGating(manifest)
  const isLessonComplete = useProgressStore((s: ProgressStore) => s.isLessonComplete)

  const activeMilestone =
    milestones.find((m) => {
      if (!isMilestoneUnlocked(m.id)) return false
      const levels = m.level_refs.map((ref) => manifest.levels[ref]).filter(Boolean)
      return levels.some((level) =>
        level.lesson_refs.some((lessonRef) => {
          const lesson = manifest.lessons[lessonRef]
          return lesson && !isLessonComplete(m.id, level.id, lesson.id)
        }),
      )
    }) ?? milestones[0]

  return (
    <div className="mx-auto w-full max-w-[450px] space-y-10 px-6 py-6">
      {/* Stats row — XP / Streak / Coins / Avo Cash */}
      <StatsRow />

      {milestones.map((milestone) => {
        const isActive = milestone.id === activeMilestone?.id
        const unlocked = isMilestoneUnlocked(milestone.id)

        const levels = milestone.level_refs
          .map((ref) => manifest.levels[ref])
          .filter(Boolean)
          .sort((a, b) => a.order - b.order)

        return (
          <div key={milestone.id} className="space-y-10">
            {levels.map((level, i) => {
              const levelUnlocked = unlocked && isLevelUnlocked(milestone.id, level.id)
              const isActiveLevel =
                isActive &&
                levelUnlocked &&
                level.lesson_refs.some((ref) => {
                  const lesson = manifest.lessons[ref]
                  return lesson && !isLessonComplete(milestone.id, level.id, lesson.id)
                })

              return (
                <LevelSection
                  key={level.id}
                  milestoneId={milestone.id}
                  levelId={level.id}
                  levelNumber={i + 1}
                  title={level.title}
                  description={level.description}
                  isActive={isActiveLevel}
                  isLocked={!levelUnlocked}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Route
// ============================================================================

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})
