import { useState } from 'react'
import type { ManyOfManyQuestion } from '@/types/content'
import { HintReveal } from './HintReveal'
import { AnswerFeedback } from './AnswerFeedback'
import { scoreManyOfMany } from '@/lib/scoring'
import type { QuestionResult } from '@/types/content'
import { QuizOptionButton, type QuizOptionVariant } from '@/components/quiz/QuizOptionButton'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface ManyOfManyQuestionProps {
  question: ManyOfManyQuestion
  onSubmit: (result: QuestionResult, answer: string[]) => void
  result?: QuestionResult | null
  answer?: unknown
  onContinue?: () => void
  continueLabel?: string
}

/**
 * After submit: only SELECTED options show a state — non-selected stay default.
 * Correct selected → green, wrong selected → orange.
 */
function getVariantMulti(
  optionId: string,
  correctOptions: string[],
  selected: string[],
  hasResult: boolean,
): QuizOptionVariant {
  if (!hasResult) return selected.includes(optionId) ? 'selected' : 'default'
  if (!selected.includes(optionId)) return 'default'
  return correctOptions.includes(optionId) ? 'correct' : 'wrong'
}

export function ManyOfManyQuestionComponent({
  question,
  onSubmit,
  result: externalResult = null,
  answer: externalAnswer,
  onContinue,
  continueLabel = 'Continue',
}: ManyOfManyQuestionProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [localResult, setLocalResult] = useState<QuestionResult | null>(null)
  const result = localResult ?? externalResult
  const resolvedSelected =
    Array.isArray(externalAnswer) ? externalAnswer :
      Array.isArray(result?.userAnswer) ? result.userAnswer.filter((value): value is string => typeof value === 'string') :
        selected
  const hasSubmitted = !!result

  const toggleOption = (optionId: string) => {
    if (hasSubmitted) return
    setSelected((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    )
  }

  const handleSubmit = () => {
    if (resolvedSelected.length === 0) return
    const scoring = scoreManyOfMany(question, resolvedSelected)
    const questionResult: QuestionResult = {
      questionId: question.id,
      correct: scoring.correct,
      partial: scoring.partial,
      pointsEarned: scoring.pointsEarned,
      pointsPossible: question.points,
      userAnswer: resolvedSelected,
      correctAnswer: question.correct_options,
      feedback: question.explanation,
    }
    setLocalResult(questionResult)
    onSubmit(questionResult, resolvedSelected)
  }

  const renderAs = question.render_as ?? 'checkboxes'

  const renderOptions = () => {
    // ── Card grid (with images) ───────────────────────────────────────────────
    if (renderAs === 'card-grid') {
      const cardVariantStyles: Record<QuizOptionVariant, string> = {
        default:  'border-[rgba(0,0,0,0.08)] bg-white shadow-[var(--quiz-option-shadow-default)]',
        selected: 'border-[var(--quiz-option-selected-border)] bg-[var(--quiz-option-selected-bg)] shadow-[var(--quiz-option-shadow-state)]',
        correct:  'border-[var(--quiz-option-correct-border)] bg-[var(--quiz-option-correct-bg)] shadow-[var(--quiz-option-shadow-state)]',
        wrong:    'border border-dashed border-[var(--quiz-option-wrong-border)] bg-[var(--quiz-option-wrong-bg)] shadow-[var(--quiz-option-shadow-state)]',
      }
      return (
        <ul
          className="flex w-full flex-col items-start justify-start gap-[16px] list-none p-0 m-0"
          role="list"
          data-quiz-options
        >
          {question.options.map((option) => (
            <li
              key={option.id}
              className="w-full"
              data-quiz-option
              data-option-id={option.id}
            >
              <button
                type="button"
                onClick={() => toggleOption(option.id)}
                disabled={hasSubmitted}
                className={cn(
                  'flex w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                  cardVariantStyles[getVariantMulti(option.id, question.correct_options, resolvedSelected, hasSubmitted)],
                )}
              >
                {option.image && (
                  <img src={option.image} alt="" className="h-20 w-full rounded-lg object-cover" />
                )}
                <span className="text-sm font-medium">{option.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )
    }

    // ── Default: checkboxes / toggle-list → QuizOptionButton vertical list ────
    return (
      <ul
        className="flex w-full flex-col items-start justify-start gap-[16px] list-none p-0 m-0"
        role="list"
        data-quiz-options
      >
        {question.options.map((option) => (
          <li
            key={option.id}
            className="w-full"
            data-quiz-option
            data-option-id={option.id}
          >
            <QuizOptionButton
              label={option.text}
              variant={getVariantMulti(option.id, question.correct_options, resolvedSelected, hasSubmitted)}
              onClick={() => toggleOption(option.id)}
              disabled={hasSubmitted}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-2">
        <h2 className="text-[18px] font-medium leading-[1.4] tracking-[-0.45px] text-[#0a0a0a]">
          {question.prompt}
        </h2>
        {question.hint && !hasSubmitted && <HintReveal hint={question.hint} />}
      </div>

      <div className="flex w-full flex-col items-start justify-start gap-[16px]">
        {renderOptions()}

        {!hasSubmitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={resolvedSelected.length === 0}
            className="mt-2 h-[46px] w-full rounded-xl bg-[#0a0a0a] text-base font-medium leading-[1.2] text-white shadow-[var(--quiz-cta-shadow)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Check
          </button>
        )}
      </div>

      {result && <AnswerFeedback result={result} />}

      {result && onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-base font-medium text-white shadow-[var(--quiz-cta-shadow)] transition-opacity hover:opacity-90"
        >
          {continueLabel}
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}
