import { useReducer, useCallback, useEffect } from 'react'
import type { Question, QuestionResult, QuizConfig, AssessmentResult } from '@/types/content'
import { QuestionRenderer } from './questions/QuestionRenderer'
import { Assessment } from './Assessment'
import { ChevronRight } from 'lucide-react'
import { assessQuiz } from '@/lib/scoring'

// ============================================================================
// Types
// ============================================================================

interface QuizRunnerProps {
  questions: Question[]
  config: QuizConfig
  onComplete: (result: AssessmentResult) => void
  onRetry?: () => void
  onAnswerRecord?: (correct: boolean) => void
  /** Called when the current question index changes (for parent to show "QUESTION X OF Y" in header). */
  onQuestionIndexChange?: (index: number) => void
}

interface QuizState {
  currentIndex: number
  answers: Record<string, unknown>
  submittedQuestions: Set<string>
  results: Record<string, QuestionResult>
  isComplete: boolean
  assessmentResult: AssessmentResult | null
}

type QuizAction =
  | { type: 'SUBMIT_ANSWER'; questionId: string; answer: unknown; result: QuestionResult }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'COMPLETE_QUIZ'; result: AssessmentResult }
  | { type: 'RESET_QUIZ' }

// ============================================================================
// Reducer
// ============================================================================

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
        submittedQuestions: new Set([...Array.from(state.submittedQuestions), action.questionId]),
        results: { ...state.results, [action.questionId]: action.result },
      }
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, Object.keys(state.answers).length),
      }
    case 'PREV_QUESTION':
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      }
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isComplete: true,
        assessmentResult: action.result,
      }
    case 'RESET_QUIZ':
      return {
        currentIndex: 0,
        answers: {},
        submittedQuestions: new Set<string>(),
        results: {},
        isComplete: false,
        assessmentResult: null,
      }
    default:
      return state
  }
}

// ============================================================================
// Component
// ============================================================================

export function QuizRunner({
  questions,
  config,
  onComplete,
  onRetry,
  onAnswerRecord,
  onQuestionIndexChange,
}: QuizRunnerProps) {
  const [state, dispatch] = useReducer(quizReducer, {
    currentIndex: 0,
    answers: {},
    submittedQuestions: new Set<string>(),
    results: {},
    isComplete: false,
    assessmentResult: null,
  })

  useEffect(() => {
    onQuestionIndexChange?.(state.currentIndex)
  }, [state.currentIndex, onQuestionIndexChange])

  const currentQuestion = questions[state.currentIndex]
  const isLastQuestion = state.currentIndex === questions.length - 1
  const hasSubmittedCurrent = currentQuestion
    ? state.submittedQuestions.has(currentQuestion.id)
    : false

  const handleSubmit = useCallback(
    (result: QuestionResult, answer: unknown) => {
      if (!currentQuestion) return

      onAnswerRecord?.(result.correct)
      dispatch({
        type: 'SUBMIT_ANSWER',
        questionId: currentQuestion.id,
        answer,
        result,
      })
    },
    [currentQuestion, onAnswerRecord]
  )

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      // Calculate assessment and complete
      const assessment = assessQuiz(questions, state.answers, config.minimum_passing_score)
      dispatch({ type: 'COMPLETE_QUIZ', result: assessment })
      onComplete(assessment)
    } else {
      dispatch({ type: 'NEXT_QUESTION' })
    }
  }, [isLastQuestion, questions, state.answers, config.minimum_passing_score, onComplete])

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RESET_QUIZ' })
    onRetry?.()
  }, [onRetry])

  // Show assessment when complete
  if (state.isComplete && state.assessmentResult) {
    return (
      <Assessment
        result={state.assessmentResult}
        onContinue={() => onComplete(state.assessmentResult!)}
        onRetry={config.allow_retry ? handleRetry : undefined}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Question */}
      <div className="flex-1">
        <QuestionRenderer
          question={currentQuestion}
          onSubmit={handleSubmit}
          submitted={hasSubmittedCurrent}
        />
      </div>

      {/* Next / Finish — only after answer submitted */}
      {hasSubmittedCurrent && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleNext}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-base font-medium text-white shadow-[var(--quiz-cta-shadow)] transition-opacity hover:opacity-90"
          >
            {isLastQuestion ? 'Finish' : 'Next'}
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
