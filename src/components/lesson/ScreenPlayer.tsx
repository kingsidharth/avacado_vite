import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Screen } from '@/types/content'
import { Pause, Play, Volume2, ArrowRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroRenderer, type HeroRendererRef } from './HeroRenderer'
import { TranscriptTyper } from './TranscriptTyper'

// ============================================================================
// Types
// ============================================================================

interface ScreenPlayerProps {
  screen: Screen
  onComplete: () => void
  onGoBack?: () => void
  onMascotCta?: () => void
  /** Optional TTS audio URL from generate-tts manifest */
  ttsUrl?: string | null
}

interface ScreenPlayerState {
  transcriptComplete: boolean
  currentWordIndex: number
  activityCompleted: boolean
}

type ScreenPlayerAction =
  | { type: 'TRANSCRIPT_COMPLETE' }
  | { type: 'WORD_REVEALED'; index: number }
  | { type: 'ACTIVITY_COMPLETE' }

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
    case 'ACTIVITY_COMPLETE':
      return { ...state, activityCompleted: true }
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
  onGoBack,
  onMascotCta,
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
    activityCompleted: false,
  })

  const isInteractive = screen.hero.type === 'interactive'

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
    // Only auto-advance for NON-interactive screens
    if (!isInteractive) {
      if (!ttsUrl || audioDoneRef.current) scheduleAdvance()
    }
  }, [ttsUrl, scheduleAdvance, isInteractive])

  const handleActivityComplete = useCallback(() => {
    dispatch({ type: 'ACTIVITY_COMPLETE' })
  }, [])

  const handleContinueClick = useCallback(() => {
    onComplete()
  }, [onComplete])

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
    // Only auto-advance for NON-interactive screens
    if (!isInteractive && transcriptDoneRef.current) scheduleAdvance()
  }, [scheduleAdvance, isInteractive])

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
    <div className="flex h-full flex-col">
      {/* Back button for interactive screens */}
      {isInteractive && onGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          Back
        </button>
      )}

      {/* Hero Section */}
      <div className={isInteractive ? 'flex-1 min-h-0 overflow-y-auto' : ''}>
        <HeroRenderer
          ref={heroRef}
          hero={screen.hero}
          currentWordIndex={state.currentWordIndex}
          onSyncPoint={handleSyncPoint}
          onMascotCta={onMascotCta}
          onActivityComplete={handleActivityComplete}
        />
      </div>

      {/* Transcript Section — only for non-interactive or as small caption */}
      {!isInteractive && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 pt-4">
          <TranscriptTyper
            transcript={screen.transcript}
            speed={35}
            estimatedDuration={screen.estimated_duration_seconds}
            audioRef={ttsUrl ? audioRef : undefined}
            onWordRevealed={handleWordRevealed}
            onComplete={handleTranscriptComplete}
          />
        </div>
      )}

      {/* For interactive screens: show transcript as small text above continue */}
      {isInteractive && screen.transcript && (
        <div className="px-2 pt-3 pb-1">
          <TranscriptTyper
            transcript={screen.transcript}
            speed={35}
            estimatedDuration={screen.estimated_duration_seconds}
            audioRef={ttsUrl ? audioRef : undefined}
            onWordRevealed={handleWordRevealed}
            onComplete={handleTranscriptComplete}
          />
        </div>
      )}

      {/* Non-interactive: status hint when waiting */}
      {!isInteractive && !state.transcriptComplete && (
        <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
          <span>Continue watching to proceed...</span>
        </div>
      )}

      {/* Interactive: Continue button — visible after activity is complete */}
      {isInteractive && (
        <div className="px-4 pb-4 pt-3">
          <Button
            onClick={handleContinueClick}
            disabled={!state.activityCompleted}
            className="w-full gap-2"
            size="lg"
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* TTS: hidden audio + bottom mini player */}
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
            className="mt-auto flex max-w-2xl cursor-pointer select-none items-center gap-3 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80"
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
