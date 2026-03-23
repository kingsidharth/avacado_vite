import type { Option } from '@/types/quiz'
import { cn } from '@/lib/utils'

interface RadioQuestionProps {
  prompt: string
  options: Option[]
  selected: string[]
  onSelect: (optionId: string) => void
}

export function RadioQuestion({ prompt, options, selected, onSelect }: RadioQuestionProps) {
  return (
    <div className="flex flex-col gap-5">
      {prompt && <h2 className="text-question">{prompt}</h2>}
      <div className="flex flex-col gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex min-h-[50px] w-full cursor-pointer flex-col justify-center rounded-xl border bg-background px-3 py-4 text-left shadow-level-1 transition-colors',
              selected.includes(option.id)
                ? 'border-primary bg-primary/5'
                : 'border-border/40 hover:border-border',
            )}
          >
            <span className={cn('text-body', selected.includes(option.id) ? 'text-foreground' : 'text-[#3b3b3b]')}>
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
