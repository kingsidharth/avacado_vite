import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { animate, createScope, createTimeline } from 'animejs'

// ============================================================================
// Lesson Loading Screen
// ============================================================================

function LessonLoadingPage() {
  const { milestoneId, levelId, lessonId } = Route.useParams()
  const navigate = useNavigate()

  const rootRef = useRef<HTMLDivElement>(null)
  const scope = useRef<ReturnType<typeof createScope> | null>(null)

  useEffect(() => {
    scope.current = createScope({ root: rootRef }).add(() => {
      // Entry: fade in the whole scene
      animate('.loading-scene', {
        opacity: [0, 1],
        duration: 400,
        ease: 'outQuad',
      })

      // Mascot float loop
      animate('.loading-mascot', {
        translateY: [0, -14, 0],
        duration: 2400,
        ease: 'inOutSine',
        loop: true,
      })

      // Glow pulse (scale + opacity)
      animate('.loading-glow', {
        scaleX: [1, 1.06, 1],
        opacity: [0.85, 1, 0.85],
        duration: 2400,
        ease: 'inOutSine',
        loop: true,
      })

      // "Loading…" dots stagger
      const tl = createTimeline({ loop: true })
      tl.add('.dot-1', { opacity: [0.2, 1, 0.2], duration: 600, ease: 'inOutSine' }, 0)
        .add('.dot-2', { opacity: [0.2, 1, 0.2], duration: 600, ease: 'inOutSine' }, 200)
        .add('.dot-3', { opacity: [0.2, 1, 0.2], duration: 600, ease: 'inOutSine' }, 400)
    })

    // Navigate to lesson after 6 seconds
    const timer = setTimeout(() => {
      void navigate({
        to: '/lesson/$milestoneId/$levelId/$lessonId',
        params: { milestoneId, levelId, lessonId },
      })
    }, 6 * 1000)

    return () => {
      scope.current?.revert()
      clearTimeout(timer)
    }
  }, [navigate, milestoneId, levelId, lessonId])

  return (
    <div
      ref={rootRef}
      className="relative mx-auto flex h-dvh w-[400px] max-w-full flex-col items-center justify-center overflow-hidden bg-white"
    >
      {/* Glow — centered in root, behind mascot; beam aligned to character + platform */}
      <div
        className="loading-glow pointer-events-none absolute left-[194px] top-[420px] z-0 blur-[8px]"
        aria-hidden
      >
        <img
          src="/lesson-loading/loading-glow.svg"
          alt=""
          width={420}
          height={434}
          className="h-[434px] w-[420px] object-contain"
        />
      </div>

      {/* Mascot — floats above glow */}
      <div className="loading-mascot relative z-10">
        <img
          src="/lesson-loading/avocado-loading.svg"
          alt="Avocado mascot"
          width={200}
          height={196}
          className="h-[196px] w-[200px] object-contain"
        />
      </div>

      {/* Full scene — fades in on mount (platform only) */}
      <div
        className="loading-scene relative flex flex-col items-center"
        style={{ opacity: 0 }}
      >
        {/* Gap between mascot and platform */}
        <div className="h-8" />

        {/* Platform */}
        <div className="relative z-10">
          <img
            src="/lesson-loading/loading-platform.svg"
            alt=""
            width={260}
            height={170}
            className="h-[170px] w-[260px] object-contain"
          />
        </div>
      </div>

      {/* Loading indicator */}
      <div
        className="loading-scene absolute bottom-16 flex items-center gap-1"
        style={{ opacity: 0 }}
      >
        <span className="text-sm font-medium tracking-[-0.4px] text-[rgba(255,255,255,0.5)]">
          Preparing your lesson
        </span>
        <span className="flex items-end gap-[3px] pb-[1px]">
          <span className="dot-1 inline-block h-[5px] w-[5px] rounded-full bg-[rgba(255,255,255,0.4)]" />
          <span className="dot-2 inline-block h-[5px] w-[5px] rounded-full bg-[rgba(255,255,255,0.4)]" />
          <span className="dot-3 inline-block h-[5px] w-[5px] rounded-full bg-[rgba(255,255,255,0.4)]" />
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Route
// ============================================================================

export const Route = createFileRoute(
  '/lesson-loading/$milestoneId/$levelId/$lessonId',
)({
  component: LessonLoadingPage,
})
