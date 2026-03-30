import type { ReactNode } from 'react'
import { MascotBlob } from '@/components/mascot/MascotBlob'
import { DEFAULT_OUTER_BLOBS } from '@/components/mascot/mascot-blob-config'
import { cn } from '@/lib/utils'

interface OnboardingMascotBubbleProps {
  question: ReactNode
  className?: string
  /** Compact single-row layout for fixed header (mascot + bubble vertically centered) — Figma 842:37 / 559:2310 */
  variant?: 'default' | 'header'
  /** Figma 559:2329 — greeting line uses `nowrap`; longer questions wrap */
  textWrap?: 'wrap' | 'nowrap'
}

/** Left tail toward mascot (559:2330) — white fill + green border */
function SpeechBubbleTail({ className }: { className?: string }) {
  return (
    <svg
      className={cn('pointer-events-none absolute top-1/2 z-10 h-[22px] w-[11px] -translate-y-1/2', className)}
      viewBox="0 0 11 22"
      fill="none"
      aria-hidden
    >
      <path
        d="M11 1.2 L11 20.8 L1.2 11 Z"
        fill="white"
        stroke="rgba(2, 156, 61, 0.2)"
        strokeWidth="1.61"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OnboardingMascotBubble({
  question,
  className,
  variant = 'default',
  textWrap = 'wrap',
}: OnboardingMascotBubbleProps) {
  const isHeader = variant === 'header'
  return (
    <div
      className={cn(
        'flex items-center',
        isHeader ? 'max-w-[368px] flex-wrap justify-center gap-[4px]' : 'w-full flex-col gap-4 sm:flex-row sm:gap-6',
        className
      )}
    >
      {/* Mascot — header: 74×74px SVG; scale + offsets so body paths fill the square (same path `d`, centered in viewBox) */}
      <div className={cn('flex shrink-0 justify-center overflow-visible', isHeader && '-my-1')}>
        <MascotBlob
          className={cn(
            isHeader ? 'size-[74px] shrink-0' : 'w-32 sm:w-40'
          )}
          bodyMode="static"
          staticBaseScale={isHeader ? 3.25 : 1.2}
          staticBaseOffsetX={isHeader ? -162 : 0}
          staticBaseOffsetY={isHeader ? -164 : 0}
          staticInnerScale={isHeader ? 0.78 : 1}
          eyeVariant="regular"
          mouthVariant="smile"
          outerBlobs={DEFAULT_OUTER_BLOBS}
          innerScale={0.78}
          innerOffsetY={-8}
          faceOffsetX={0}
          faceOffsetY={-35}
          faceSpacing={1}
          faceScale={1.1}
          animationEnabled={false}
          animationSpeed={1}
          animationAmplitude={8}
          grainEnabled={false}
          grainFrequency={0.65}
          grainOctaves={4}
          grainContrast={200}
          grainBrightness={150}
          grainScale={1}
        />
      </div>
      {/* Speech bubble — Figma 559:2327 */}
      <div
        className={cn(
          'relative min-h-0 min-w-0',
          isHeader ? 'min-w-0 flex-1' : 'w-full'
        )}
      >
        {isHeader && <SpeechBubbleTail className="-left-[10px]" />}
        <div
          className={cn(
            'relative z-[1] overflow-clip',
            isHeader
              ? 'w-full rounded-[6.442px] border-[1.61px] border-[rgba(2,156,61,0.2)] bg-white px-5 py-[25px] shadow-none'
              : 'rounded-2xl rounded-tl-sm border-2 border-border bg-card px-4 py-3 shadow-level-1 sm:rounded-2xl'
          )}
          aria-label="Question"
        >
          <div
            className={cn(
              'font-medium leading-[1.4] tracking-[-0.6px]',
              isHeader ? 'text-center text-base text-[#6c6c6c]' : 'text-left text-base text-muted-foreground sm:text-lg',
              textWrap === 'nowrap' && 'whitespace-nowrap'
            )}
          >
            {question}
          </div>
        </div>
      </div>
    </div>
  )
}
