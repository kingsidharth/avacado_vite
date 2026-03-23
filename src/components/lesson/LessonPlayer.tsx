import { useReducer, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Lesson, AssessmentResult, ContentManifest } from '@/types/content'
import { useScreens, useQuestions, useQuizConfig } from '@/hooks/useContentManifest'
import { useTtsManifest } from '@/hooks/useTtsManifest'
import { ScreenPlayer } from './ScreenPlayer'
import { QuizRunner } from './QuizRunner'
import { LessonComplete } from './LessonComplete'
import { QuestionRenderer } from './questions/QuestionRenderer'
import { useProgressStore, type ProgressStore } from '@/store/progress'
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
  const progressCircleRef = useRef<SVGCircleElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const wheelCooldownRef = useRef(false)
  const [state, dispatch] = useReducer(lessonReducer, {
    phase: 'screens',
    currentScreenIndex: 0,
    quizCompleted: false,
    assessmentResult: null,
  })

  const recordLessonResult = useProgressStore((s: ProgressStore) => s.recordLessonResult)
  const markScreenComplete = useProgressStore((s: ProgressStore) => s.markScreenComplete)
  const updateLastAccessed = useProgressStore((s: ProgressStore) => s.updateLastAccessed)
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

  // Animate circular progress + counter
  const CIRCLE_RADIUS = 16
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

  const animateProgressBar = useCallback((targetPercent: number) => {
    if (!progressCircleRef.current) return
    const targetOffset = CIRCLE_CIRCUMFERENCE * (1 - targetPercent / 100)
    animate(progressCircleRef.current, {
      strokeDashoffset: targetOffset,
      duration: 400,
      ease: 'outQuad',
    })
  }, [CIRCLE_CIRCUMFERENCE])

  const animateCounter = useCallback((direction: 'next' | 'prev') => {
    if (!counterRef.current) return
    const yFrom = direction === 'next' ? -12 : 12
    animate(counterRef.current, {
      translateY: [yFrom, 0],
      opacity: [0, 1],
      duration: 250,
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
      animateCounter('next')
      dispatch({ type: 'SHOW_CHECKPOINT' })
      return
    }

    // No checkpoint — advance to next screen, quiz, or finish
    if (state.currentScreenIndex < screens.length - 1) {
      animateTransition('next')
      animateCounter('next')
      dispatch({ type: 'NEXT_SCREEN' })
      const totalSteps = screens.length + (hasQuiz ? 1 : 0)
      animateProgressBar(((state.currentScreenIndex + 1) / totalSteps) * 100)
    } else if (hasQuiz) {
      dispatch({ type: 'START_QUIZ' })
      const totalSteps = screens.length + 1
      animateProgressBar((screens.length / totalSteps) * 100)
    } else {
      recordLessonResult(milestoneId, levelId, lesson.id, 1, true)
      recordLessonWatched(lessonSlug).catch(() => {})
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
    animateCounter,
    animateProgressBar,
    navigate,
    recordLessonResult,
    recordLessonWatched,
  ])

  // After checkpoint passed — advance to next screen/quiz/finish
  const advanceFromCheckpoint = useCallback(() => {
    dispatch({ type: 'CHECKPOINT_PASSED' })

    if (state.currentScreenIndex < screens.length - 1) {
      animateTransition('next')
      animateCounter('next')
      dispatch({ type: 'NEXT_SCREEN' })
      const totalSteps = screens.length + (hasQuiz ? 1 : 0)
      animateProgressBar(((state.currentScreenIndex + 1) / totalSteps) * 100)
    } else if (hasQuiz) {
      dispatch({ type: 'START_QUIZ' })
      const totalSteps = screens.length + 1
      animateProgressBar((screens.length / totalSteps) * 100)
    } else {
      recordLessonResult(milestoneId, levelId, lesson.id, 1, true)
      recordLessonWatched(lessonSlug).catch(() => {})
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
    animateCounter,
    animateProgressBar,
    navigate,
    recordLessonResult,
    recordLessonWatched,
  ])

  const handleScreenPrev = useCallback(() => {
    if (state.phase === 'checkpoint') {
      // Go back from checkpoint to the screen
      animateTransition('prev')
      animateCounter('prev')
      dispatch({ type: 'CHECKPOINT_PASSED' }) // reset to screens phase
      return
    }
    if (state.currentScreenIndex > 0) {
      animateTransition('prev')
      animateCounter('prev')
      dispatch({ type: 'PREV_SCREEN' })
      const totalSteps = screens.length + (hasQuiz ? 1 : 0)
      animateProgressBar(((state.currentScreenIndex - 1) / totalSteps) * 100)
    }
  }, [state.phase, state.currentScreenIndex, animateTransition, animateCounter, animateProgressBar, screens.length, hasQuiz])

  const handleQuizComplete = useCallback(
    (result: AssessmentResult) => {
      recordLessonResult(milestoneId, levelId, lesson.id, result.score, result.passed)
      recordLessonWatched(lessonSlug).catch(() => {})
      dispatch({ type: 'COMPLETE_QUIZ', result })
      animateProgressBar(100)
    },
    [milestoneId, levelId, lesson.id, lessonSlug, recordLessonResult, recordLessonWatched, animateProgressBar]
  )

  const handleRetryQuiz = useCallback(() => {
    dispatch({ type: 'RESTART_QUIZ' })
  }, [])

  const handleFinish = useCallback(() => {
    navigate({ to: '/dashboard' })
  }, [navigate])

  const handleClose = useCallback(() => {
    navigate({ to: '/dashboard' })
  }, [navigate])

  const handleMascotCta = useCallback(() => {
    advanceFromScreen()
  }, [advanceFromScreen])

  const handleCheckpointSubmit = useCallback(
    (result: QuestionResult) => {
      if (result.correct) {
        setTimeout(() => {
          advanceFromCheckpoint()
        }, 400)
      }
    },
    [advanceFromCheckpoint]
  )

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

    if (deltaY > 0) {
      // Swipe up → next (blocked for interactive screens — user must click Continue)
      if (state.phase === 'screens') {
        const currentScreen = screens[state.currentScreenIndex]
        if (currentScreen?.hero?.type === 'interactive') return
        advanceFromScreen()
      }
    } else {
      // Swipe down → prev or home
      if (state.phase === 'screens' || state.phase === 'checkpoint') {
        if (state.phase === 'screens' && state.currentScreenIndex === 0) {
          navigate({ to: '/dashboard' })
        } else {
          handleScreenPrev()
        }
      }
    }
  }, [state.phase, state.currentScreenIndex, advanceFromScreen, handleScreenPrev, navigate])

  // ---- Wheel/scroll handling for desktop ----
  useEffect(() => {
    const el = containerRef.current?.closest('.lesson-player-root')
    if (!el) return

    const handleWheel = (e: Event) => {
      const we = e as WheelEvent
      if (wheelCooldownRef.current) return
      if (Math.abs(we.deltaY) < WHEEL_THRESHOLD) return

    if (e.deltaY > 0) {
      // Scroll down → next (blocked for interactive screens — user must click Continue)
      if (state.phase === 'screens') {
        const currentScreen = screens[state.currentScreenIndex]
        if (currentScreen?.hero?.type === 'interactive') return
        advanceFromScreen()
      }
    } else {
      // Scroll up → prev or home
      if (state.phase === 'screens' || state.phase === 'checkpoint') {
        if (state.phase === 'screens' && state.currentScreenIndex === 0) {
          navigate({ to: '/dashboard' })
        } else {
          handleScreenPrev()
        }
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [state.phase, state.currentScreenIndex, advanceFromScreen, handleScreenPrev, navigate])

  // Calculate progress
  const totalSteps = screens.length + (hasQuiz ? 1 : 0)
  const currentStep = state.phase === 'screens' || state.phase === 'checkpoint'
    ? state.currentScreenIndex
    : state.phase === 'quiz'
      ? screens.length
      : totalSteps
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  // Completed screens count
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
            onGoBack={state.currentScreenIndex > 0 ? handleScreenPrev : undefined}
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
          <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
            <div className="w-full max-w-lg">
              <p className="mb-6 text-lg font-medium text-foreground">
                Quick check before continuing
              </p>
              <QuestionRenderer
                question={checkpointQuestion}
                onSubmit={handleCheckpointSubmit}
              />
            </div>
          </div>
        )
      }

      case 'quiz':
        if (!hasQuiz) return null

        return (
          <div className="flex h-full flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-medium">Lesson Quiz</h2>
              <p className="text-sm text-muted-foreground">
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
      className="lesson-player-root flex h-dvh flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        {/* Left: Close button */}
        <button
          onClick={handleClose}
          className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="size-5" />
        </button>

        {/* Center: Lesson title */}
        <h1 className="max-w-[60%] truncate text-sm font-medium">
          {lesson.title}
        </h1>

        {/* Right: Circular progress with counter */}
        <div className="relative flex size-10 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-muted"
            />
            <circle
              ref={progressCircleRef}
              cx="20"
              cy="20"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - progressPercent / 100)}
            />
          </svg>
          <span
            ref={counterRef}
            className="relative text-[10px] font-semibold text-muted-foreground"
          >
            {completedScreens}/{screens.length}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-hidden p-4">
        <div ref={containerRef} className="h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
