import type { Quiz } from '@/types/quiz'
import { useQuiz } from '@/hooks/useQuiz'
import { QuizPageHeader } from './QuizPageHeader'
import { QuizMascotBubble } from './QuizMascotBubble'
import { QuizOptionButton, type QuizOptionVariant } from './QuizOptionButton'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'

interface QuizContainerProps {
  quiz: Quiz
}

function getOptionVariant(
  optionId: string,
  correctAnswers: string[],
  selectedAnswers: string[],
  hasSubmitted: boolean,
): QuizOptionVariant {
  if (!hasSubmitted) {
    return selectedAnswers.includes(optionId) ? 'selected' : 'default'
  }
  // Only the selected option shows a state — non-selected stay default
  if (!selectedAnswers.includes(optionId)) return 'default'
  return correctAnswers.includes(optionId) ? 'correct' : 'wrong'
}

export function QuizContainer({ quiz }: QuizContainerProps) {
  const {
    currentQuestion,
    totalQuestions,
    progress,
    selectedAnswers,
    hasSubmittedCurrent,
    canCheck,
    canGoNext,
    isComplete,
    isFirst,
    state,
    dispatch,
  } = useQuiz(quiz)

  const handleSelect = (optionId: string) => {
    if (!currentQuestion || hasSubmittedCurrent) return
    dispatch({
      type: 'SELECT_ANSWER',
      questionId: currentQuestion.id,
      optionId,
      questionType: currentQuestion.type,
    })
  }

  const handleCheck = () => {
    if (!currentQuestion || !canCheck) return
    dispatch({ type: 'SUBMIT_ANSWER', questionId: currentQuestion.id })
  }

  const handleNext = () => {
    if (!canGoNext) return
    dispatch({ type: 'NEXT' })
  }

  if (isComplete) {
    const answeredCount = Object.keys(state.answers).length
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Trophy className="size-16 text-primary" />
        <h2 className="text-2xl font-medium tracking-tight">Quiz Complete!</h2>
        <p className="text-muted-foreground">
          You answered {answeredCount} of {totalQuestions} questions
        </p>
        <Button onClick={() => dispatch({ type: 'RESET' })} size="lg" className="w-full max-w-xs">
          Try Again
        </Button>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header: back + progress (Figma §5, node 559:2412) */}
      <div className="shrink-0 px-6 pt-5">
        <QuizPageHeader progressPercent={progress} />
      </div>

      {/* Mascot + speech bubble (Figma §6, node 559:2441) */}
      <div className="shrink-0 px-6 pt-5">
        <QuizMascotBubble />
      </div>

      {/* Question label + prompt (Figma §7, node 559:2420) */}
      <div className="shrink-0 px-6 pt-6">
        <div className="flex flex-col gap-2">
          <p className="text-caption text-[#6c6c6c]">
            QUESTION {state.currentIndex + 1} OF {totalQuestions}
          </p>
          <p className="text-[18px] font-medium leading-[1.4] tracking-[-0.45px] text-[#0a0a0a]">
            {currentQuestion.prompt}
          </p>
        </div>
      </div>

      {/* Options list (Figma §8/§11, nodes 559:2423–2440) */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
        <div className="flex flex-col gap-4">
          {currentQuestion.options.map((option) => (
            <QuizOptionButton
              key={option.id}
              label={option.text}
              variant={getOptionVariant(
                option.id,
                currentQuestion.correctAnswers,
                selectedAnswers,
                hasSubmittedCurrent,
              )}
              onClick={() => handleSelect(option.id)}
              disabled={hasSubmittedCurrent}
            />
          ))}
        </div>
      </div>

      {/* Sticky CTA: "Check" then "Next / Finish" (Figma §12, node 559:2464) */}
      <div className="shrink-0 bg-white px-6 pb-10 pt-4">
        <div className="mx-auto max-w-[354px]">
          {!hasSubmittedCurrent ? (
            <Button
              onClick={handleCheck}
              disabled={!canCheck}
              className="h-[46px] w-full rounded-xl bg-[#0a0a0a] text-base font-medium leading-[1.2] text-white shadow-[var(--quiz-cta-shadow)] hover:bg-[#0a0a0a]/90 disabled:opacity-40"
            >
              Check
            </Button>
          ) : (
            <div className="flex gap-3">
              {!isFirst && (
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'PREV' })}
                  className="h-[46px] flex-1 rounded-xl"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="h-[46px] flex-1 rounded-xl bg-[#0a0a0a] text-base font-medium leading-[1.2] text-white shadow-[var(--quiz-cta-shadow)] hover:bg-[#0a0a0a]/90"
              >
                {state.currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
