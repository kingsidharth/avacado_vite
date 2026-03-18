import { MascotBlob } from '@/components/mascot/MascotBlob'

interface QuizMascotBubbleProps {
  /** Speech bubble text; default from Figma spec §6. */
  message?: string
}

/**
 * Mascot + speech bubble for quiz page (Figma spec §6, node 559:2441).
 * Mascot on the left (~77×75), white bubble with green-tint border on the right.
 */
export function QuizMascotBubble({
  message = "Let's see what you already know!",
}: QuizMascotBubbleProps) {
  return (
    <div className="flex w-full items-center">
      {/* Blob mascot — 77×75 container, default scale fills the SVG viewBox */}
      <div className="relative h-[75px] w-[77px] shrink-0 overflow-visible">
        <MascotBlob
          className="h-full w-full"
          bodyMode="static"
          animationEnabled={false}
          grainEnabled={false}
        />
      </div>

      {/* Speech bubble */}
      <div className="relative flex-1">
        <div
          className="relative rounded-[6px] bg-white px-4 py-3"
          style={{ border: '1.61px solid rgba(2, 156, 61, 0.2)' }}
        >
          {/* CSS triangle tail pointing left toward the mascot */}
          <span
            className="absolute left-0 top-1/2 h-0 w-0 -translate-x-full -translate-y-1/2 border-b-[7px] border-r-[9px] border-t-[7px] border-b-transparent border-r-white border-t-transparent"
            aria-hidden
          />
          <p className="text-base font-medium leading-[1.4] tracking-[-0.6px] text-[rgba(10,10,10,0.6)]">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
