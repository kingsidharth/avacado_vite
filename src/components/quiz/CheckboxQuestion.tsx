import { Stack } from '@/components/learning/layout/Stack'
import { LearningOptionButton } from '@/components/learning/LearningOptionButton'
import type { Option } from '@/types/quiz'

interface CheckboxQuestionProps {
  prompt: string
  options: Option[]
  selected: string[]
  onSelect: (optionId: string) => void
}

export function CheckboxQuestion({ prompt, options, selected, onSelect }: CheckboxQuestionProps) {
  return (
    <Stack gap="lg">
      {prompt && <h2 className="text-question">{prompt}</h2>}
      <Stack gap="md">
        {options.map((option) => (
          <LearningOptionButton
            key={option.id}
            label={option.text}
            selected={selected.includes(option.id)}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </Stack>
    </Stack>
  )
}
