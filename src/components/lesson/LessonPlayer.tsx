import { useReducer, useRef, useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Lesson, AssessmentResult, ContentManifest } from '@/types/content'
import { useScreens, useQuestions, useQuizConfig } from '@/hooks/useContentManifest'
import { useTtsManifest } from '@/hooks/useTtsManifest'
import { ScreenPlayer } from './ScreenPlayer'
import { QuizRunner } from './QuizRunner'
import { LessonComplete } from './LessonComplete'
import { QuestionRenderer } from './questions/QuestionRenderer'
import { useProgressStore, type ProgressStore, makeLessonKey } from '@/store/progress'
import { useSessionStore } from '@/store/session'
import { useRecordUserHistory } from '@/hooks/useRecordUserHistory'
import { X } from 'lucide-react'
import { animate } from 'animejs'
import type { QuestionResult } from '@/types/content'

// ============================================================================
// Types
// ============================================================================

interface LessonPlayerProps {
  milestoneId: string
  levelId: string
  lesson: Lesson
  manifest: ContentManifest
}

type LessonPhase = 'screens' | 'checkpoint' | 'quiz' | 'complete'

interface LessonState {
  phase: LessonPhase
  currentScreenIndex: number
  quizCompleted: boolean
  assessmentResult: AssessmentResult | null
}

type LessonAction =
  | { type: 'NEXT_SCREEN' }
  | { type: 'PREV_SCREEN' }
  | { type: 'SHOW_CHECKPOINT' }
  | { type: 'CHECKPOINT_PASSED' }
  | { type: 'START_QUIZ' }
  | { type: 'COMPLETE_QUIZ'; result: AssessmentResult }
  | { type: 'RESTART_QUIZ' }
  | { type: 'FINISH_LESSON' }
  | { type: 'RESET' }

// ============================================================================
// Reducer
// ============================================================================

function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case 'NEXT_SCREEN':
      return { ...state, phase: 'screens', currentScreenIndex: state.currentScreenIndex + 1 }
    case 'PREV_SCREEN':
      return { ...state, phase: 'screens', currentScreenIndex: Math.max(0, state.currentScreenIndex - 1) }
    case 'SHOW_CHECKPOINT':
      return { ...state, phase: 'checkpoint' }
    case 'CHECKPOINT_PASSED':
      return { ...state, phase: 'screens' }
    case 'START_QUIZ':
      return { ...state, phase: 'quiz' }
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        phase: 'complete',
        quizCompleted: true,
        assessmentResult: action.result,
      }
    case 'RESTART_QUIZ':
      return { ...state, phase: 'quiz' }
    case 'FINISH_LESSON':
      return state
    case 'RESET':
      return {
        phase: 'screens',
        currentScreenIndex: 0,
        quizCompleted: false,
        assessmentResult: null,
      }
    default:
      return state
  }
}

// ============================================================================
// Scroll/swipe thresholds
// ============================================================================

const SWIPE_THRESHOLD = 50
const WHEEL_THRESHOLD = 80
const WHEEL_COOLDOWN_MS = 600

// ============================================================================
// Component
// ============================================================================

export function LessonPlayer({
  milestoneId,
  levelId,
  lesson,
  manifest,
}: LessonPlayerProps) {
  const navigate = useNavigate()
  const screens = useScreens(milestoneId, levelId, lesson.id)
  const questions = useQuestions(milestoneId, levelId, lesson.id)
  const quizConfig = useQuizConfig(milestoneId, levelId, lesson.id)
  const { data: ttsManifest } = useTtsManifest()

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ y: number; time: number } | null>(null)
  const wheelCooldownRef = useRef(false)
  const [state, dispatch] = useReducer(lessonReducer, {
    phase: 'screens',
    currentScreenIndex: 0,
    quizCompleted: false,
    assessmentResult: null,
  })
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)

  const recordLessonResult = useProgressStore((s: ProgressStore) => s.recordLessonResult)
  const markScreenComplete = useProgressStore((s: ProgressStore) => s.markScreenComplete)
  const updateLastAccessed = useProgressStore((s: ProgressStore) => s.updateLastAccessed)
  const setNewlyCompleted = useSessionStore((s) => s.setNewlyCompleted)
  const { recordLessonWatched, recordQuizAnswer } = useRecordUserHistory()
  const lessonSlug = `${milestoneId}/${levelId}/${lesson.id}`

  // Track lesson access
  useEffect(() => {
    updateLastAccessed(milestoneId, levelId, lesson.id)
  }, [milestoneId, levelId, lesson.id, updateLastAccessed])

  const hasQuiz = questions.length > 0 && quizConfig

  // Animation for screen transitions (bottom-to-top / top-to-bottom)
  const animateTransition = useCallback((direction: 'next' | 'prev') => {
    if (!containerRef.current) return

    const yOffset = direction === 'next' ? 40 : -40

    animate(containerRef.current, {
      translateY: [yOffset, 0],
      opacity: [0, 1],
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  // Advance from current screen (called when transcript finishes)
  const advanceFromScreen = useCallback(() => {
    const currentScreen = screens[state.currentScreenIndex]
    if (currentScreen) {
      markScreenComplete(milestoneId, levelId, lesson.id, currentScreen.id)
    }

    // Check if this screen has a checkpoint quiz
    const checkpointQuestion = currentScreen?.checkpoint_quiz
      ? manifest.questions[currentScreen.checkpoint_quiz.question_ref]
      : undefined

    if (checkpointQuestion) {
      // Show checkpoint as separate step
      animateTransition('next')
      dispatch({ type: 'SHOW_CHECKPOINT' })
      return
    }

    // No checkpoint — advance to next screen, quiz, or finish
    if (state.currentScreenIndex < screens.length - 1) {
      animateTransition('next')
      dispatch({ type: 'NEXT_SCREEN' })
    } else if (hasQuiz) {
      dispatch({ type: 'START_QUIZ' })
    } else {
      recordLessonResult(milestoneId, levelId, lesson.id, 1, true)
      recordLessonWatched(lessonSlug).catch(() => {})
      setNewlyCompleted(makeLessonKey(milestoneId, levelId, lesson.id))
      dispatch({ type: 'FINISH_LESSON' })
      navigate({ to: '/dashboard' })
    }
  }, [
    screens,
    state.currentScreenIndex,
    hasQuiz,
    milestoneId,
    levelId,
    lesson.id,
    lessonSlug,
    manifest.questions,
    markScreenComplete,
    animateTransition,
    navigate,
    recordLessonResult,
    recordLessonWatched,
    setNewlyCompleted,
  ])

  // After checkpoint passed — advance to next screen/quiz/finish
  const advanceFromCheckpoint = useCallback(() => {
    dispatch({ type: 'CHECKPOINT_PASSED' })

    if (state.currentScreenIndex < screens.length - 1) {
      animateTransition('next')
      dispatch({ type: 'NEXT_SCREEN' })
    } else if (hasQuiz) {
      dispatch({ type: 'START_QUIZ' })
    } else {
      recordLessonResult(milestoneId, levelId, lesson.id, 1, true)
      recordLessonWatched(lessonSlug).catch(() => {})
      setNewlyCompleted(makeLessonKey(milestoneId, levelId, lesson.id))
      dispatch({ type: 'FINISH_LESSON' })
      navigate({ to: '/dashboard' })
    }
  }, [
    state.currentScreenIndex,
    screens.length,
    hasQuiz,
    milestoneId,
    levelId,
    lesson.id,
    lessonSlug,
    animateTransition,
    navigate,
    recordLessonResult,
    recordLessonWatched,
    setNewlyCompleted,
  ])

  const handleScreenPrev = useCallback(() => {
    if (state.phase === 'checkpoint') {
      // Go back from checkpoint to the screen
      animateTransition('prev')
      dispatch({ type: 'CHECKPOINT_PASSED' }) // reset to screens phase
      return
    }
    if (state.currentScreenIndex > 0) {
      animateTransition('prev')
      dispatch({ type: 'PREV_SCREEN' })
    }
  }, [state.phase, state.currentScreenIndex, animateTransition, screens.length, hasQuiz])

  const handleQuizComplete = useCallback(
    (result: AssessmentResult) => {
      recordLessonResult(milestoneId, levelId, lesson.id, result.score, result.passed)
      recordLessonWatched(lessonSlug).catch(() => {})
      dispatch({ type: 'COMPLETE_QUIZ', result })
    },
    [milestoneId, levelId, lesson.id, lessonSlug, recordLessonResult, recordLessonWatched]
  )

  const handleRetryQuiz = useCallback(() => {
    dispatch({ type: 'RESTART_QUIZ' })
  }, [])

  const handleFinish = useCallback(() => {
    if (state.assessmentResult?.passed) {
      setNewlyCompleted(makeLessonKey(milestoneId, levelId, lesson.id))
    }
    navigate({ to: '/dashboard' })
  }, [navigate, state.assessmentResult, milestoneId, levelId, lesson.id, setNewlyCompleted])

  const handleClose = useCallback(() => {
    navigate({ to: '/dashboard' })
  }, [navigate])

  // ---- Adjacent-lesson navigation ----
  // Find the current lesson's position within the level's ordered lesson list.
  const lessonRefs = manifest.levels[levelId]?.lesson_refs ?? []
  const currentLessonIdx = lessonRefs.indexOf(lesson.id)
  const prevLessonId = currentLessonIdx > 0 ? lessonRefs[currentLessonIdx - 1] : null
  const nextLessonId = currentLessonIdx < lessonRefs.length - 1 ? lessonRefs[currentLessonIdx + 1] : null

  const navigateToPrevLesson = useCallback(() => {
    if (prevLessonId) {
      navigate({
        to: '/lesson/$milestoneId/$levelId/$lessonId',
        params: { milestoneId, levelId, lessonId: prevLessonId },
      })
    } else {
      navigate({ to: '/dashboard' })
    }
  }, [prevLessonId, milestoneId, levelId, navigate])

  const navigateToNextLesson = useCallback(() => {
    if (nextLessonId) {
      navigate({
        to: '/lesson/$milestoneId/$levelId/$lessonId',
        params: { milestoneId, levelId, lessonId: nextLessonId },
      })
    } else {
      navigate({ to: '/dashboard' })
    }
  }, [nextLessonId, milestoneId, levelId, navigate])

  const handleMascotCta = useCallback(() => {
    advanceFromScreen()
  }, [advanceFromScreen])

  const handleCheckpointSubmit = useCallback((_result: QuestionResult) => {
    // Don't auto-advance; user clicks Continue (onContinue) to move to next step
  }, [])

  // ---- Swipe handling ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY
    touchStartRef.current = null

    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return

    // Lesson-complete phase: swipe navigates between lessons
    if (state.phase === 'complete') {
      if (deltaY > 0) navigateToNextLesson()
      else navigateToPrevLesson()
      return
    }

    if (deltaY > 0) {
      // Swipe up → advance to next screen (only during screen playback)
      if (state.phase === 'screens') {
        advanceFromScreen()
      }
    } else {
      // Swipe down → go back (only during screen playback or checkpoint)
      if (state.phase === 'screens' || state.phase === 'checkpoint') {
        if (state.phase === 'screens' && state.currentScreenIndex === 0) {
          navigate({ to: '/dashboard' })
        } else {
          handleScreenPrev()
        }
      }
    }
  }, [state.phase, state.currentScreenIndex, advanceFromScreen, handleScreenPrev, navigate, navigateToPrevLesson, navigateToNextLesson])

  // ---- Wheel/scroll + keyboard handling for desktop ----
  useEffect(() => {
    const el = containerRef.current?.closest('.lesson-player-root')
    if (!el) return

    const handleWheel = (e: Event) => {
      const we = e as WheelEvent
      if (wheelCooldownRef.current) return
      if (Math.abs(we.deltaY) < WHEEL_THRESHOLD) return

      wheelCooldownRef.current = true
      setTimeout(() => {
        wheelCooldownRef.current = false
      }, WHEEL_COOLDOWN_MS)

      // Lesson-complete phase: scroll navigates between lessons
      if (state.phase === 'complete') {
        if (we.deltaY > 0) navigateToNextLesson()
        else navigateToPrevLesson()
        return
      }

      if (we.deltaY > 0) {
        // Scroll down → advance screen (only during screen playback)
        if (state.phase === 'screens') {
          advanceFromScreen()
        }
      } else {
        // Scroll up → go back (only during screen playback or checkpoint)
        if (state.phase === 'screens' || state.phase === 'checkpoint') {
          if (state.phase === 'screens' && state.currentScreenIndex === 0) {
            navigate({ to: '/dashboard' })
          } else {
            handleScreenPrev()
          }
        }
      }
    }

    // Arrow-key navigation between lessons (only when lesson is complete)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.phase !== 'complete') return
      if (e.key === 'ArrowDown') navigateToNextLesson()
      else if (e.key === 'ArrowUp') navigateToPrevLesson()
    }

    el.addEventListener('wheel', handleWheel, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      el.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.phase, state.currentScreenIndex, advanceFromScreen, handleScreenPrev, navigate, navigateToPrevLesson, navigateToNextLesson])

  // Calculate progress
  const totalSteps = screens.length + (hasQuiz ? 1 : 0)
  const currentStep = state.phase === 'screens' || state.phase === 'checkpoint'
    ? state.currentScreenIndex
    : state.phase === 'quiz'
      ? screens.length
      : totalSteps
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  // Completed steps count (for header progress bar and label)
  const completedScreens = state.phase === 'screens' || state.phase === 'checkpoint'
    ? state.currentScreenIndex
    : screens.length

  // Render based on phase
  const renderContent = () => {
    switch (state.phase) {
      case 'screens': {
        const currentScreen = screens[state.currentScreenIndex]

        if (!currentScreen) {
          return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No screens available
            </div>
          )
        }

        // Use content manifest screen key (path-based), not screen.id — TTS manifest uses same key as generate-tts (from file path)
        const screenKey = lesson.screen_refs[state.currentScreenIndex]
        const ttsUrl = (screenKey && ttsManifest?.[screenKey]) ?? null

        return (
          <ScreenPlayer
            key={screenKey ?? currentScreen.id}
            screen={currentScreen}
            onComplete={advanceFromScreen}
            onMascotCta={handleMascotCta}
            ttsUrl={ttsUrl}
          />
        )
      }

      case 'checkpoint': {
        const currentScreen = screens[state.currentScreenIndex]
        const checkpointQuestion = currentScreen?.checkpoint_quiz
          ? manifest.questions[currentScreen.checkpoint_quiz.question_ref]
          : undefined

        if (!checkpointQuestion) return null

        return (
          <QuestionRenderer
            question={checkpointQuestion}
            onSubmit={handleCheckpointSubmit}
            onContinue={advanceFromCheckpoint}
            continueLabel="Continue"
          />
        )
      }

      case 'quiz':
        if (!hasQuiz) return null

        return (
          <div className="flex h-full flex-col gap-3">
            <div className="mb-4 flex flex-col gap-1.5">
              <div className="flex flex-col gap-1.5">
                <p className="text-caption text-[#6c6c6c] px-1.5">
                  QUESTION {quizQuestionIndex + 1} OF {questions.length}
                </p>
              </div>
              <h2 className="text-[18px] font-medium px-1.5">Lesson Quiz</h2>
              <p className="text-sm text-muted-foreground px-1.5">
                Test your knowledge from this lesson
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <QuizRunner
                questions={questions}
                config={quizConfig}
                onComplete={handleQuizComplete}
                onRetry={handleRetryQuiz}
                onAnswerRecord={(correct) => recordQuizAnswer(lessonSlug, correct)}
                onQuestionIndexChange={setQuizQuestionIndex}
              />
            </div>
          </div>
        )

      case 'complete': {
        // Find the next level title for the CTA
        const currentMilestone = manifest.milestones[milestoneId]
        let nextLevelTitle: string | undefined
        if (currentMilestone) {
          const levelRefs = currentMilestone.level_refs
          const currentIdx = levelRefs.indexOf(levelId)
          if (currentIdx >= 0 && currentIdx < levelRefs.length - 1) {
            const nextLevelRef = levelRefs[currentIdx + 1]
            nextLevelTitle = manifest.levels[nextLevelRef]?.title
          }
        }

        return (
          <LessonComplete
            assessmentResult={state.assessmentResult}
            passed={state.assessmentResult?.passed ?? true}
            allowRetry={!!lesson.quiz?.allow_retry}
            nextLevelTitle={nextLevelTitle}
            onRetry={handleRetryQuiz}
            onFinish={handleFinish}
          />
        )
      }

      default:
        return null
    }
  }

  return (
    <div
      className="lesson-player-root flex h-dvh flex-col justify-start items-start bg-background pt-3 pb-3"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header — design spec 559:4084: close, title, progress label, segmented bar */}
      <header className="mx-auto flex w-full max-w-[400px] flex-col gap-[11px] px-4 py-[5.5px]">
        {/* Top row: close, title, progress label */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 shrink-0 items-center justify-center p-1.5 hover:bg-muted rounded-md"
            aria-label="Close lesson"
          >
            <X className="size-6 shrink-0 text-foreground" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-medium leading-[1.32] tracking-[-0.45px] text-[#0a0a0a]">
            {lesson.title}
          </h1>
          <span className="shrink-0 text-[16px] font-medium leading-[1.1] tracking-[-1px] text-[rgba(10,10,10,0.3)] whitespace-nowrap">
            {currentStep}/{totalSteps}
          </span>
        </div>
        {/* Segmented progress bar — segment count = totalSteps */}
        <div className="flex w-full items-center justify-between gap-0.5">
          {Array.from({ length: totalSteps }, (_, i) => {
            // Fully filled: past segments OR current segment when not actively playing (checkpoint/quiz/complete)
            const filled = i < currentStep || (i === currentStep && state.phase !== 'screens')
            // Slowly animating: only the segment currently being narrated
            const isCurrent = i === currentStep && state.phase === 'screens'
            const screenDuration = screens[state.currentScreenIndex]?.estimated_duration_seconds ?? 8

            return (
              <div
                key={i}
                className="h-[6px] min-w-[10px] flex-1 overflow-hidden rounded-[8px] bg-[rgba(10,10,10,0.08)]"
              >
                {filled && (
                  <div className="h-full w-full bg-[var(--onboarding-fill)]" />
                )}
                {isCurrent && (
                  // key changes every time currentScreenIndex changes → remount → animation restarts
                  <div
                    key={`seg-fill-${state.currentScreenIndex}`}
                    className="lesson-segment-active h-full bg-[var(--onboarding-fill)]"
                    style={{ animationDuration: `${screenDuration}s` }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </header>

      {/* Content — 400px max width for lessons */}
      <main className="mx-auto w-full max-w-[400px] flex-1 overflow-hidden p-4">
        <div ref={containerRef} className="h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
