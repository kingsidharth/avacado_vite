import { useState } from 'react'
import type { TextEntryQuestion } from '@/types/content'
import { Input } from '@/components/ui/input'
import { HintReveal } from './HintReveal'
import { AnswerFeedback } from './AnswerFeedback'
import { scoreTextEntry } from '@/lib/scoring'
import type { QuestionResult } from '@/types/content'
import { ChevronRight } from 'lucide-react'

interface TextEntryQuestionProps {
  question: TextEntryQuestion
  onSubmit: (result: QuestionResult, answer: string) => void
  result?: QuestionResult | null
  answer?: unknown
  onContinue?: () => void
  continueLabel?: string
}

export function TextEntryQuestionComponent({
  question,
  onSubmit,
  result: externalResult = null,
  answer: externalAnswer,
  onContinue,
  continueLabel = 'Continue',
}: TextEntryQuestionProps) {
  const [draftAnswer, setDraftAnswer] = useState('')
  const [localResult, setLocalResult] = useState<QuestionResult | null>(null)
  const answer = typeof externalAnswer === 'string' ? externalAnswer : draftAnswer
  const result = localResult ?? externalResult
  const hasSubmitted = !!result

  const handleSubmit = () => {
    if (!answer.trim()) return

    const scoring = scoreTextEntry(question, answer)
    const questionResult: QuestionResult = {
      questionId: question.id,
      correct: scoring.correct,
      partial: false,
      pointsEarned: scoring.pointsEarned,
      pointsPossible: question.points,
      userAnswer: scoring.normalizedUserAnswer,
      correctAnswer: question.correct_answer,
      feedback: question.explanation,
    }

    setLocalResult(questionResult)
    onSubmit(questionResult, answer)
  }

  const isCorrect = result?.correct ?? false

  return (
    <div className="space-y-2 px-1.5">
      <div className="space-y-2">
        <h2 className="text-base font-medium">{question.prompt}</h2>
        {question.hint && !hasSubmitted && <HintReveal hint={question.hint} />}
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setDraftAnswer(e.target.value)}
          placeholder={question.placeholder || 'Enter your answer...'}
          disabled={hasSubmitted || isCorrect}
          className={`h-[56px] pt-2 pb-6 text-left focus-visible:ring-[#0a0a0a] ${isCorrect ? 'border-green-500 bg-green-50' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !hasSubmitted) {
              handleSubmit()
            }
          }}
        />

        {!hasSubmitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="mt-2 h-[46px] w-full rounded-xl bg-[#0a0a0a] text-base font-medium leading-[1.2] text-white shadow-[var(--quiz-cta-shadow)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Check Answer
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
