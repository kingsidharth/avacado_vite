import { useEffect, useRef } from 'react'

import { animate } from 'animejs'

// ============================================================================
// Types
// ============================================================================

interface ScoreRingProps {
  /** Score value 0–100 — controls how much of the ring arc is filled */
  score: number
  /** Number displayed in the centre. Defaults to `score` when not provided */
  displayValue?: number
  /** Ring diameter in pixels (default 120) */
  size?: number
  /** Stroke width in pixels (default 8) */
  strokeWidth?: number
  /** Label below the number (default "Out of 100") */
  label?: string
  /** Whether to animate the ring drawing on mount */
  animated?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * ScoreRing — circular progress ring with a centred score number.
 *
 * Figma spec: node 559:2633
 * - 120×120px container
 * - Bright green progress arc (--primary) on light-gray track
 * - Score number: 28px Space Grotesk Medium, #0a0a0a, tracking -1px
 * - Label: 12px Space Grotesk Medium, rgba(10,10,10,0.4), tracking -0.4px
 */
export function ScoreRing({
  score,
  displayValue,
  size = 120,
  strokeWidth = 8,
  label = 'Out of 100',
  animated = true,
}: ScoreRingProps) {
  const centreNumber = displayValue ?? score
  const svgRef = useRef<SVGSVGElement>(null)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score / 100, 0), 1)
  const targetOffset = circumference - progress * circumference

  useEffect(() => {
    const ring = svgRef.current?.querySelector<SVGCircleElement>('.score-ring-progress')
    if (!ring) return

    if (!animated) {
      ring.style.strokeDashoffset = String(targetOffset)
      return
    }

    ring.style.strokeDashoffset = String(circumference)
    const animation = animate(ring, {
      strokeDashoffset: targetOffset,
      duration: 900,
      ease: 'outExpo',
      delay: 200,
    })

    return () => {
      animation.revert()
    }
  }, [animated, circumference, score, targetOffset])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG ring */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Score: ${centreNumber} — ${label}`}
      >
        {/* Track (background) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(10,10,10,0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        {progress > 0 && (
          <circle
            className="score-ring-progress text-primary"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference : targetOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>

      {/* Centred label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-medium leading-snug tracking-[-1px] text-foreground">
          {centreNumber}
        </span>
        <span className="text-xs font-medium leading-none tracking-[-0.4px] text-[rgba(10,10,10,0.4)]">
          {label}
        </span>
      </div>
    </div>
  )
}
