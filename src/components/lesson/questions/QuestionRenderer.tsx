import type { Question, QuestionResult } from '@/types/content'
import { TextEntryQuestionComponent } from './TextEntryQuestion'
import { OneOfManyQuestionComponent } from './OneOfManyQuestion'
import { ManyOfManyQuestionComponent } from './ManyOfManyQuestion'

interface QuestionRendererProps {
  question: Question
  onSubmit: (result: QuestionResult, answer: unknown) => void
  submitted?: boolean
  /** When set, a "Continue" CTA is shown after the user submits (e.g. checkpoint → next lesson). */
  onContinue?: () => void
  /** Label for the continue button. Default: "Continue". */
  continueLabel?: string
}

export function QuestionRenderer({
  question,
  onSubmit,
  submitted = false,
  onContinue,
  continueLabel = 'Continue',
}: QuestionRendererProps) {
  switch (question.type) {
    case 'text-entry':
      return (
        <TextEntryQuestionComponent
          question={question}
          onSubmit={(result, answer) => onSubmit(result, answer)}
          submitted={submitted}
          onContinue={onContinue}
          continueLabel={continueLabel}
        />
      )

    case 'one-of-many':
      return (
        <OneOfManyQuestionComponent
          question={question}
          onSubmit={(result, answer) => onSubmit(result, answer)}
          submitted={submitted}
          onContinue={onContinue}
          continueLabel={continueLabel}
        />
      )

    case 'many-of-many':
      return (
        <ManyOfManyQuestionComponent
          question={question}
          onSubmit={(result, answer) => onSubmit(result, answer)}
          submitted={submitted}
          onContinue={onContinue}
          continueLabel={continueLabel}
        />
      )

    default:
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Unknown question type</p>
        </div>
      )
  }
}
