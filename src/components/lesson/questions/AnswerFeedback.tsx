import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { QuestionResult } from '@/types/content'

interface AnswerFeedbackProps {
  result: QuestionResult
}

/**
 * Feedback banner shown below options after submitting.
 * Colors match the Figma quiz spec (§9) — green for correct, orange for wrong.
 */
export function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const { correct, partial, feedback } = result

  if (correct) {
    return (
      <div className="rounded-[12px] border border-[var(--quiz-feedback-correct-border)] bg-[var(--quiz-feedback-correct-bg)] p-4">
        <div className="flex items-start gap-1.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#1e9e4e]" />
          <div>
            <p className="font-medium text-[#1a7a3e]">Correct!</p>
            <p className="text-sm text-[rgba(10,10,10,0.8)]">{feedback}</p>
          </div>
        </div>
      </div>
    )
  }

  if (partial) {
    return (
      <div className="rounded-[12px] border border-[rgb(243,133,82)] bg-[rgb(253,231,220)] p-4">
        <div className="flex items-start gap-1.5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-[rgb(243,133,82)]" />
          <div>
            <p className="font-medium text-[rgb(243,133,82)]">Partially correct</p>
            <p className="text-sm text-[rgb(10,10,10)]">{feedback}</p>
          </div>
        </div>
      </div>
    )
  }

  // Wrong — uses its own feedback token, distinct from the option button color
  return (
    <div className="rounded-[12px] border border-[var(--quiz-feedback-wrong-border)] bg-[var(--quiz-feedback-wrong-bg)] p-4">
      <div className="flex items-start gap-1.5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-[#f38552]" />
        <div>
          <p className="font-medium text-[#f38552]">Not Quite!</p>
          <p className="text-sm text-[rgba(10,10,10,0.85)]">{feedback}</p>
        </div>
      </div>
    </div>
  )
}
