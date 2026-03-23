import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  useContentManifest,
  useMilestones,
  useLessons,
} from '@/hooks/useContentManifest'
import { useGating, useProgressStore, type ProgressStore } from '@/store/progress'
import { LessonCard } from '@/components/dashboard/LessonCard'
import { CategoryRow } from '@/components/explore/CategoryRow'
import { Lock } from 'lucide-react'

// ============================================================================
// Level Lessons
// ============================================================================

function LevelLessons({
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
  const isScreenComplete = useProgressStore((s: ProgressStore) => s.isScreenComplete)

  const currentLessonId = isActiveLevel
    ? lessons.find((l) => !isLessonComplete(milestoneId, levelId, l.id))?.id
    : undefined

  // Track which card is hovered — only ONE mascot at a time
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null)

  // Mascot shows on hovered card (priority) or current card (default)
  const mascotLessonId = hoveredLessonId ?? currentLessonId ?? null
  const isHoveringNonCurrent = hoveredLessonId !== null && hoveredLessonId !== currentLessonId

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {lessons.map((lesson) => {
        const unlocked = isLessonUnlocked(milestoneId, levelId, lesson.id)
        const complete = isLessonComplete(milestoneId, levelId, lesson.id)

        let progress = 0
        if (unlocked && !complete && lesson.screen_refs.length > 0) {
          const completedCount = lesson.screen_refs.filter((ref) => {
            const screen = manifest.screens[ref]
            return screen && isScreenComplete(milestoneId, levelId, lesson.id, screen.id)
          }).length
          progress = completedCount / lesson.screen_refs.length
        }

        const isMascotCard = mascotLessonId === lesson.id

        return (
          <LessonCard
            key={lesson.id}
            milestoneId={milestoneId}
            levelId={levelId}
            lesson={lesson}
            isLocked={!unlocked}
            isCurrent={lesson.id === currentLessonId}
            isComplete={complete}
            progress={progress}
            showMascot={isMascotCard}
            mascotExpression={isMascotCard && isHoveringNonCurrent ? 'excited' : 'default'}
            onHoverChange={(hovered) =>
              setHoveredLessonId(hovered ? lesson.id : null)
            }
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// Level Section
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
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Level {levelNumber}
        </p>
        <h2 className="mt-2 text-xl font-medium text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {isLocked ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/20 px-4 py-6">
          <Lock className="size-5 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground/60">
            Complete the previous level to unlock
          </p>
        </div>
      ) : (
        <LevelLessons
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

  const activeMilestone = milestones.find((m) => {
    if (!isMilestoneUnlocked(m.id)) return false
    const levels = m.level_refs
      .map((ref) => manifest.levels[ref])
      .filter(Boolean)
    return levels.some((level) =>
      level.lesson_refs.some((lessonRef) => {
        const lesson = manifest.lessons[lessonRef]
        return lesson && !isLessonComplete(m.id, level.id, lesson.id)
      })
    )
  }) ?? milestones[0]

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 px-5 py-6">
      <CategoryRow />
      {milestones.map((milestone) => {
        const isActive = milestone.id === activeMilestone?.id
        const unlocked = isMilestoneUnlocked(milestone.id)

        const levels = milestone.level_refs
          .map((ref) => manifest.levels[ref])
          .filter(Boolean)
          .sort((a, b) => a.order - b.order)

        return (
          <div key={milestone.id} className="space-y-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Milestone
              </p>
              <h1 className="mt-2 text-2xl font-medium text-foreground">
                {milestone.title}
              </h1>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                {milestone.description}
              </p>
            </div>

            {levels.map((level, i) => {
              const levelUnlocked = unlocked && isLevelUnlocked(milestone.id, level.id)
              const isActiveLevel = isActive && levelUnlocked && level.lesson_refs.some((ref) => {
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
