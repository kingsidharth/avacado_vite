import type { Option } from '@/types/quiz'
import { cn } from '@/lib/utils'

interface CheckboxQuestionProps {
  prompt: string
  options: Option[]
  selected: string[]
  onSelect: (optionId: string) => void
}

export function CheckboxQuestion({ prompt, options, selected, onSelect }: CheckboxQuestionProps) {
  return (
    <div className="flex flex-col gap-5">
      {prompt && <h2 className="text-question">{prompt}</h2>}
      <p className="text-body text-muted-foreground">Select all that apply.</p>
      <div className="flex flex-col gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected.includes(option.id)}
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex min-h-[50px] w-full cursor-pointer flex-col justify-center rounded-xl border bg-background px-3 py-4 text-left shadow-level-1 transition-colors',
              selected.includes(option.id)
                ? 'border-primary bg-primary/5'
                : 'border-border/40 hover:border-border',
            )}
          >
            <span className={cn('text-body', selected.includes(option.id) ? 'text-foreground' : 'text-muted-foreground')}>
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
