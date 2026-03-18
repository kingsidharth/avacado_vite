import { cn } from '@/lib/utils'
import { DEFAULT_NODE_ASSETS } from './learning-path-assets'

export type { LessonNodeState } from './learning-path-assets'
export type LessonNodeSide = 'left' | 'right'

interface LessonNodeProps {
  state: LessonNodeState
  side: LessonNodeSide
  title: string
  meta: string
  onClick?: () => void
  /** Optional: override default node SVGs per state */
  nodeAssets?: Partial<Record<LessonNodeState, string>>
}

export function LessonNode({
  state,
  side,
  title,
  meta,
  onClick,
  nodeAssets,
}: LessonNodeProps) {
  const isLeft = side === 'left'
  const nodeSrc = (nodeAssets?.[state] ?? DEFAULT_NODE_ASSETS[state]) as string

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        isLeft ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <button
        type="button"
        onClick={state !== 'locked' ? onClick : undefined}
        disabled={state === 'locked'}
        className={cn(
          'relative shrink-0',
          state !== 'locked' && 'cursor-pointer',
          state === 'locked' && 'cursor-default',
        )}
        aria-label={title}
      >
        <img
          src={nodeSrc}
          alt=""
          className="h-[80px] w-[76px] object-contain object-center"
          width={76}
          height={80}
        />
      </button>

      <div
        className={cn(
          'flex flex-col gap-[4px]',
          isLeft ? 'items-start text-left' : 'items-end text-right',
        )}
      >
        <span
          className={cn(
            'text-sm font-normal leading-[1.4]',
            state === 'locked' ? 'text-[rgba(10,10,10,0.4)]' : 'text-[#0a0a0a]',
          )}
        >
          {title}
        </span>
        <span className="text-[12px] leading-[1.4] tracking-[-0.4173px] text-[rgba(10,10,10,0.4)]">
          {meta}
        </span>
      </div>
    </div>
  )
}
