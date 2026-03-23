import { useCallback, useRef, forwardRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Lesson } from '@/types/content'
import { Play, Lock, CheckCircle2 } from 'lucide-react'
import { MascotBlob } from '@/components/mascot/MascotBlob'
import { animate } from 'animejs'

interface LessonCardProps {
  milestoneId: string
  levelId: string
  lesson: Lesson
  isLocked: boolean
  isCurrent: boolean
  isComplete: boolean
  progress: number
  thumbnail?: string
  showMascot?: boolean
  mascotExpression?: 'default' | 'excited'
  onHoverChange?: (hovered: boolean) => void
}

export const LessonCard = forwardRef<HTMLDivElement, LessonCardProps>(
  function LessonCard(
    {
      milestoneId,
      levelId,
      lesson,
      isLocked,
      isCurrent,
      isComplete,
      progress,
      thumbnail,
      showMascot = false,
      mascotExpression = 'default',
      onHoverChange,
    },
    ref
  ) {
    const navigate = useNavigate()
    const cardRef = useRef<HTMLDivElement>(null)

    const handleClick = useCallback(() => {
      if (isLocked) return

      if (cardRef.current) {
        animate(cardRef.current, {
          scale: [1, 0.95],
          opacity: [1, 0.6],
          duration: 200,
          ease: 'inQuad',
          onComplete: () => {
            navigate({
              to: '/lesson/$milestoneId/$levelId/$lessonId',
              params: { milestoneId, levelId, lessonId: lesson.id },
            })
          },
        })
      } else {
        navigate({
          to: '/lesson/$milestoneId/$levelId/$lessonId',
          params: { milestoneId, levelId, lessonId: lesson.id },
        })
      }
    }, [isLocked, milestoneId, levelId, lesson.id, navigate])

    // Animate mascot in
    const mascotAnimRef = useCallback((node: HTMLDivElement | null) => {
      if (!node) return
      animate(node, {
        scale: [0.5, 1],
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 400,
        ease: 'outBack',
      })
    }, [])

    // Status badge
    const statusBadge = isComplete ? (
      <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1">
        <CheckCircle2 className="size-4 text-green-500" />
        <span className="text-xs font-medium text-green-600">Complete</span>
      </div>
    ) : isLocked ? (
      <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
        <Lock className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Locked</span>
      </div>
    ) : null

    const isInProgress = progress > 0 && !isComplete

    return (
      <div
        ref={ref}
        className="relative"
        onMouseEnter={() => !isLocked && onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
      >
        {/* Mascot — controlled by parent, only ONE card shows it at a time */}
        {showMascot && (
          <div
            ref={mascotAnimRef}
            className="pointer-events-none absolute -top-8 right-1 z-10 w-24 md:-top-10 md:right-2 md:w-28"
            style={{ opacity: 0 }}
          >
            <div className="aspect-[500/520]">
              <MascotBlob
                bodyMode="static"
                staticBaseScale={1.8}
                staticInnerScale={1.0}
                faceScale={1.3}
                faceOffsetY={-35}
                eyeVariant="regular"
                mouthVariant={mascotExpression === 'excited' ? 'grin' : 'smile'}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={isLocked}
          className="w-full text-left"
        >
          <div
            ref={cardRef}
            className={`overflow-hidden rounded-2xl border transition-shadow ${
              isLocked
                ? 'border-muted bg-muted/30'
                : isCurrent
                  ? 'border-primary/30 bg-card shadow-lg'
                  : 'border-border bg-card shadow-sm hover:shadow-md'
            }`}
          >
            {/* Thumbnail area */}
            <div
              className={`relative flex h-36 items-center justify-center ${
                isLocked ? 'bg-muted' : 'bg-gradient-to-br from-primary/10 to-primary/5'
              }`}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={lesson.title}
                  className={`h-full w-full object-cover ${isLocked ? 'grayscale' : ''}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {isLocked ? (
                    <Lock className="size-10 text-muted-foreground/50" />
                  ) : (
                    <Play className="size-10 text-primary/40" />
                  )}
                </div>
              )}

              {/* Status badge — top-left corner */}
              {statusBadge && (
                <div className="absolute left-3 top-3">
                  {statusBadge}
                </div>
              )}

              {/* Duration — bottom-left, plain text */}
              {lesson.estimated_duration_minutes && (
                <div className="absolute bottom-2 left-2 text-xs font-medium text-foreground/80">
                  {lesson.estimated_duration_minutes}:00
                </div>
              )}
            </div>

            {/* Progress bar below thumbnail */}
            {(isInProgress || isComplete) && (
              <div className="h-1 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${isComplete ? 100 : Math.round(progress * 100)}%` }}
                />
              </div>
            )}

            {/* Title + description */}
            <div className="px-4 py-3">
              <h3 className={`text-base font-medium leading-snug tracking-tight ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                {lesson.title}
              </h3>
              <p className={`mt-1 text-sm leading-relaxed ${isLocked ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                {lesson.description}
              </p>
            </div>
          </div>
        </button>
      </div>
    )
  }
)
