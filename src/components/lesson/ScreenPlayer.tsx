import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Screen } from '@/types/content'
import { Pause, Play, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroRenderer, type HeroRendererRef } from './HeroRenderer'
import { TranscriptTyper } from './TranscriptTyper'

// ============================================================================
// Types
// ============================================================================

interface ScreenPlayerProps {
  screen: Screen
  onComplete: () => void
  /** Optional TTS audio URL from generate-tts manifest */
  ttsUrl?: string | null
}

interface ScreenPlayerState {
  transcriptComplete: boolean
  currentWordIndex: number
}

type ScreenPlayerAction =
  | { type: 'TRANSCRIPT_COMPLETE' }
  | { type: 'WORD_REVEALED'; index: number }

// ============================================================================
// Reducer
// ============================================================================

function screenPlayerReducer(
  state: ScreenPlayerState,
  action: ScreenPlayerAction
): ScreenPlayerState {
  switch (action.type) {
    case 'TRANSCRIPT_COMPLETE':
      return { ...state, transcriptComplete: true }
    case 'WORD_REVEALED':
      return { ...state, currentWordIndex: action.index }
    default:
      return state
  }
}

// ============================================================================
// Component
// ============================================================================

export function ScreenPlayer({
  screen,
  onComplete,
  ttsUrl,
}: ScreenPlayerProps) {
  const heroRef = useRef<HeroRendererRef>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptDoneRef = useRef(false)
  const audioDoneRef = useRef(false)
  const advanceScheduledRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplayAttempted, setAutoplayAttempted] = useState(false)
  const [state, dispatch] = useReducer(screenPlayerReducer, {
    transcriptComplete: false,
    currentWordIndex: 0,
  })

  const scheduleAdvance = useCallback(() => {
    if (advanceScheduledRef.current) return
    advanceScheduledRef.current = true
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    advanceTimeoutRef.current = setTimeout(() => {
      onComplete()
    }, 500)
  }, [onComplete])

  const handleWordRevealed = useCallback((index: number) => {
    dispatch({ type: 'WORD_REVEALED', index })
  }, [])

  const handleTranscriptComplete = useCallback(() => {
    dispatch({ type: 'TRANSCRIPT_COMPLETE' })
    transcriptDoneRef.current = true
    // Advance at the later of: transcript end, or audio end (if TTS). No TTS => advance now.
    if (!ttsUrl || audioDoneRef.current) scheduleAdvance()
  }, [ttsUrl, scheduleAdvance])

  const handleSyncPoint = useCallback(
    (syncPoint: { action: string; target?: string }) => {
      if (syncPoint.action === 'play' && heroRef.current?.play) {
        heroRef.current.play()
      } else if (syncPoint.action === 'pause' && heroRef.current?.pause) {
        heroRef.current.pause()
      }
    },
    []
  )

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !ttsUrl) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((err: unknown) => {
        console.error('[TTS] play() failed:', err)
      })
    }
  }, [isPlaying, ttsUrl])

  const handleAudioPlay = useCallback(() => setIsPlaying(true), [])
  const handleAudioPause = useCallback(() => setIsPlaying(false), [])

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false)
    audioDoneRef.current = true
    // Advance when audio done AND transcript already done — i.e. whichever is longer
    if (transcriptDoneRef.current) scheduleAdvance()
  }, [scheduleAdvance])

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
    }
  }, [])

  const tryAutoplay = useCallback(() => {
    if (!ttsUrl || autoplayAttempted || !audioRef.current) return
    setAutoplayAttempted(true)
    audioRef.current.play().then(handleAudioPlay).catch(() => {})
  }, [ttsUrl, autoplayAttempted, handleAudioPlay])

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Hero Section */}
      <HeroRenderer
        ref={heroRef}
        hero={screen.hero}
        currentWordIndex={state.currentWordIndex}
        onSyncPoint={handleSyncPoint}
      />

      {/* Transcript Section */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <TranscriptTyper
          transcript={screen.transcript}
          speed={35}
          estimatedDuration={screen.estimated_duration_seconds}
          onWordRevealed={handleWordRevealed}
          onComplete={handleTranscriptComplete}
        />
      </div>

      {/* Status hint when waiting */}
      {!state.transcriptComplete && (
        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
          <span>Continue watching to proceed...</span>
        </div>
      )}

      {/* TTS: hidden audio + bottom mini player (auto-play when ready) */}
      {ttsUrl && (
        <>
          <audio
            ref={audioRef}
            src={ttsUrl}
            preload="auto"
            className="hidden"
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onEnded={handleAudioEnded}
            onLoadedMetadata={tryAutoplay}
            onError={(e) => {
              const el = e.currentTarget
              console.error('[TTS] audio load error:', el.error?.message ?? 'unknown', 'src:', el.src)
            }}
          />
          <div
            className="sticky bottom-0 left-0 right-0 z-10 mt-auto flex max-w-2xl cursor-pointer select-none items-center gap-3 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80"
            role="button"
            aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
            onClick={(e) => {
              e.stopPropagation()
              togglePlayPause()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                togglePlayPause()
              }
            }}
            tabIndex={0}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 pointer-events-none"
              tabIndex={-1}
              aria-hidden
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Volume2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">Narration</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
