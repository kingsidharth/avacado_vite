import { useCallback, useMemo, useRef } from 'react'
import { animate, stagger } from 'animejs'

// ============================================================================
// Types
// ============================================================================

interface TranscriptTyperProps {
  /** The transcript text to display */
  transcript: string
  /** Speed in ms per word — used only when NO audio ref is provided (default: 80) */
  speed?: number
  /** Estimated duration in seconds — overrides speed if provided (timer-only mode) */
  estimatedDuration?: number
  /** Ref to the <audio> element for time-synced word reveal */
  audioRef?: React.RefObject<HTMLAudioElement | null>
  /** Called when each word is revealed */
  onWordRevealed?: (wordIndex: number) => void
  /** Called when the entire transcript is complete */
  onComplete?: () => void
  /** Additional pause in ms for paragraph breaks — timer-only mode (default: 500) */
  paragraphPause?: number
}

// ============================================================================
// Component
// ============================================================================

export function TranscriptTyper({
  transcript,
  speed: speedProp = 80,
  estimatedDuration,
  audioRef,
  onWordRevealed,
  onComplete,
  paragraphPause = 500,
}: TranscriptTyperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<ReturnType<typeof animate> | null>(null)
  const rafRef = useRef<number | null>(null)
  const hasCompletedRef = useRef(false)
  const previousWordRef = useRef(-1)
  const revealedCountRef = useRef(0)

  // Parse transcript into segments/words
  const { segments, speed, totalWords } = useMemo(() => {
    const segs = transcript.split('\n\n').map((paragraph) =>
      paragraph.trim().split(/\s+/).filter(Boolean)
    )
    const totalWordCount = segs.reduce((sum, words) => sum + words.length, 0)
    const spd =
      estimatedDuration && totalWordCount > 0
        ? (estimatedDuration * 1000) / totalWordCount
        : speedProp

    return { segments: segs, speed: spd, totalWords: totalWordCount }
  }, [transcript, speedProp, estimatedDuration, paragraphPause])

  // ---- Audio-synced reveal via requestAnimationFrame ----
  const startAudioSync = useCallback(
    (_node: HTMLDivElement, wordElements: NodeListOf<Element>) => {
      const audio = audioRef?.current
      if (!audio) return

      hasCompletedRef.current = false
      previousWordRef.current = -1
      revealedCountRef.current = 0

      const tick = () => {
        if (!audio || hasCompletedRef.current) return

        const { currentTime, duration } = audio
        // Wait until we have a valid duration
        if (!duration || duration === 0) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }

        const progress = Math.min(currentTime / duration, 1)
        // Map progress to word index — slight lead so words appear just before spoken
        const targetWord = Math.min(
          Math.floor(progress * totalWords * 1.02),
          totalWords - 1
        )

        // Reveal words up to targetWord
        if (targetWord > revealedCountRef.current - 1) {
          for (let i = revealedCountRef.current; i <= targetWord; i++) {
            const el = wordElements[i] as HTMLElement | undefined
            if (el) {
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
            }
          }
          revealedCountRef.current = targetWord + 1

          // Fire word callback
          if (onWordRevealed && targetWord !== previousWordRef.current) {
            previousWordRef.current = targetWord
            onWordRevealed(targetWord)
          }
        }

        // Check completion
        if (revealedCountRef.current >= totalWords && !hasCompletedRef.current) {
          hasCompletedRef.current = true
          onComplete?.()
          return
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      // Also complete when audio ends (covers edge cases)
      const handleEnded = () => {
        // Reveal any remaining words
        for (let i = revealedCountRef.current; i < totalWords; i++) {
          const el = wordElements[i] as HTMLElement | undefined
          if (el) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }
        }
        revealedCountRef.current = totalWords
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true
          onComplete?.()
        }
      }

      audio.addEventListener('ended', handleEnded)

      // Start the loop
      rafRef.current = requestAnimationFrame(tick)

      // Return cleanup
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        audio.removeEventListener('ended', handleEnded)
      }
    },
    [audioRef, totalWords, onWordRevealed, onComplete]
  )

  // ---- Timer-based fallback (original anime.js stagger) ----
  const startTimerAnimation = useCallback(
    (_node: HTMLDivElement, wordElements: NodeListOf<Element>) => {
      hasCompletedRef.current = false
      previousWordRef.current = -1

      const durations: number[] = []
      for (let j = 0; j < wordElements.length; j++) {
        durations.push(80 + Math.random() * 140)
      }

      const anim = animate(wordElements, {
        opacity: [0, 1],
        translateY: [4, 0],
        delay: stagger(speed),
        duration: (_el: unknown, i: number) => durations[i],
        ease: 'outQuad',
        onUpdate: (self) => {
          const progress = self.progress / 100
          const currentWord = Math.min(Math.floor(progress * totalWords), totalWords - 1)
          if (onWordRevealed && currentWord !== previousWordRef.current && currentWord >= 0) {
            previousWordRef.current = currentWord
            onWordRevealed(currentWord)
          }
        },
        onComplete: () => {
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true
            onComplete?.()
          }
        },
      })

      animationRef.current = anim
      return () => {
        anim.pause()
        animationRef.current = null
      }
    },
    [speed, onWordRevealed, onComplete, totalWords]
  )

  // ---- Ref callback — picks audio-sync or timer mode ----
  const handleRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Cleanup previous
      animationRef.current?.pause()
      animationRef.current = null
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      hasCompletedRef.current = false
      previousWordRef.current = -1
      revealedCountRef.current = 0

      if (!node) return

      containerRef.current = node
      const wordElements = node.querySelectorAll('.word')
      if (wordElements.length === 0) return

      // Decide mode: if we have an audio element with a src, use audio-sync
      const audio = audioRef?.current
      const hasAudio = audio && audio.src && audio.src !== ''

      if (hasAudio) {
        startAudioSync(node, wordElements)
      } else {
        startTimerAnimation(node, wordElements)
      }
    },
    [audioRef, startAudioSync, startTimerAnimation]
  )

  return (
    <div
      ref={handleRef}
      className="prose prose-lg max-w-none text-foreground"
    >
      {segments.map((words, segmentIndex) => (
        <p key={segmentIndex} className="mb-4 leading-relaxed">
          {words.map((word, wordIdx) => (
            <span
              key={`${segmentIndex}-${wordIdx}`}
              className="word inline-block opacity-0"
              style={{
                marginRight: '0.25em',
                transform: 'translateY(4px)',
                transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
              }}
            >
              {word}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
