import type { Option } from '@/types/quiz'
import { QuizOptionButton } from '@/components/quiz/QuizOptionButton'

interface RadioQuestionProps {
  prompt: string
  options: Option[]
  selected: string[]
  onSelect: (optionId: string) => void
}

export function RadioQuestion({ prompt, options, selected, onSelect }: RadioQuestionProps) {
  return (
    <div className="box-border mx-auto flex w-full max-w-[400px] flex-col gap-5">
      {prompt && <h2 className="text-question">{prompt}</h2>}
      <div className="flex flex-col gap-4">
        {options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <QuizOptionButton
              key={option.id}
              label={option.text}
              variant={isSelected ? 'selected' : 'default'}
              onClick={() => onSelect(option.id)}
              role="radio"
              aria-checked={isSelected}
              className="box-border h-[54px] w-[368px] max-w-full shrink-0 items-center px-3 py-0 [&_span]:leading-[20px] mx-auto"
            />
          )
        })}
      </div>
    </div>
  )
}
