import { useState } from 'react'
import type { OneOfManyQuestion } from '@/types/content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HintReveal } from './HintReveal'
import { AnswerFeedback } from './AnswerFeedback'
import { scoreOneOfMany } from '@/lib/scoring'
import type { QuestionResult } from '@/types/content'
import { QuizOptionButton, type QuizOptionVariant } from '@/components/quiz/QuizOptionButton'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface OneOfManyQuestionProps {
  question: OneOfManyQuestion
  onSubmit: (result: QuestionResult, answer: string) => void
  result?: QuestionResult | null
  answer?: unknown
  /** When set, a Continue CTA is shown after submit (e.g. checkpoint → next lesson). */
  onContinue?: () => void
  continueLabel?: string
}

/**
 * Returns the visual variant for an option AFTER the user submits.
 * Only the SELECTED option shows a state — others stay default.
 * This matches the reference design (screenshots 2 & 3).
 */
function getVariant(
  optionId: string,
  correctOptionId: string,
  selected: string,
  hasResult: boolean,
): QuizOptionVariant {
  if (!hasResult) return selected === optionId ? 'selected' : 'default'
  // Non-selected options always stay default after submit
  if (selected !== optionId) return 'default'
  return optionId === correctOptionId ? 'correct' : 'wrong'
}

export function OneOfManyQuestionComponent({
  question,
  onSubmit,
  result: externalResult = null,
  answer: externalAnswer,
  onContinue,
  continueLabel = 'Continue',
}: OneOfManyQuestionProps) {
  const [selected, setSelected] = useState<string>('')
  const [localResult, setLocalResult] = useState<QuestionResult | null>(null)
  const result = localResult ?? externalResult
  const hasSubmitted = !!result
  const submittedAnswer = typeof result?.userAnswer === 'string' ? result.userAnswer : ''
  const resolvedSelected = hasSubmitted
    ? submittedAnswer
    : selected || (typeof externalAnswer === 'string' && externalAnswer !== '' ? externalAnswer : '')

  const handleSubmit = () => {
    if (!resolvedSelected) return
    const scoring = scoreOneOfMany(question, resolvedSelected)
    const questionResult: QuestionResult = {
      questionId: question.id,
      correct: scoring.correct,
      partial: scoring.partial,
      pointsEarned: scoring.pointsEarned,
      pointsPossible: question.points,
      userAnswer: resolvedSelected,
      correctAnswer: question.correct_option,
      feedback: question.explanation,
    }
    setLocalResult(questionResult)
    onSubmit(questionResult, resolvedSelected)
  }

  const renderAs = question.render_as ?? 'radio'

  const renderOptions = () => {
    // ── Dropdown ──────────────────────────────────────────────────────────────
    if (renderAs === 'dropdown') {
      return (
        <Select value={resolvedSelected} onValueChange={setSelected} disabled={hasSubmitted}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an answer..." />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // ── Cards (with images) ────────────────────────────────────────────────────
    if (renderAs === 'cards') {
      const cardVariantStyles: Record<QuizOptionVariant, string> = {
        default:  'border-[var(--quiz-option-default-border)] bg-white shadow-[var(--quiz-option-shadow-default)]',
        selected: 'border-[var(--quiz-option-selected-border)] bg-[var(--quiz-option-selected-bg)] shadow-[var(--quiz-option-shadow-state)]',
        correct:  'border-[var(--quiz-option-correct-border)] bg-[var(--quiz-option-correct-bg)] shadow-[var(--quiz-option-shadow-state)]',
        wrong:    'border border-dashed border-[var(--quiz-option-wrong-border)] bg-[var(--quiz-option-wrong-bg)] shadow-[var(--quiz-option-shadow-state)]',
      }
      return (
        <div className="flex flex-col gap-4">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => !hasSubmitted && setSelected(option.id)}
              disabled={hasSubmitted}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                cardVariantStyles[getVariant(option.id, question.correct_option, resolvedSelected, hasSubmitted)],
              )}
            >
              {option.image && (
                <img src={option.image} alt="" className="h-20 w-full rounded-lg object-cover" />
              )}
              <span className="text-sm font-medium">{option.text}</span>
            </button>
          ))}
        </div>
      )
    }

    // ── Default: radio / button-grid → QuizOptionButton vertical list ─────────
    return (
      <div className="flex flex-col gap-4">
        {question.options.map((option) => (
          <QuizOptionButton
            key={option.id}
            label={option.text}
            variant={getVariant(option.id, question.correct_option, resolvedSelected, hasSubmitted)}
            onClick={() => !hasSubmitted && setSelected(option.id)}
            disabled={hasSubmitted}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[18px] font-medium leading-[1.4] tracking-[-0.45px] text-[#0a0a0a]">
          {question.prompt}
        </h2>
        {question.hint && !hasSubmitted && <HintReveal hint={question.hint} />}
      </div>

      <div className="flex flex-col gap-4">
        {renderOptions()}

        {/* Check button — hidden once result is set */}
        {!hasSubmitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!resolvedSelected}
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
