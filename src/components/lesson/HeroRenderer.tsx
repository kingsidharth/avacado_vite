import { useRef, useImperativeHandle, forwardRef } from 'react'
import type { HeroConfig, SyncPoint } from '@/types/content'
import { ImageHero } from './heroes/ImageHero'
import { VideoHero, type VideoHeroRef } from './heroes/VideoHero'
import { GifHero } from './heroes/GifHero'
import { AnimatedSVGHero } from './heroes/AnimatedSVGHero'
import { InteractiveHero } from './heroes/InteractiveHero'
import { MascotHero } from './heroes/MascotHero'

// ============================================================================
// Types
// ============================================================================

export interface HeroRendererRef {
  /** For video heroes: play the video */
  play?: () => void
  /** For video heroes: pause the video */
  pause?: () => void
  /** For video heroes: seek to a specific time in seconds */
  seek?: (time: number) => void
  /** For video heroes: get current playback time */
  getCurrentTime?: () => number
}

interface HeroRendererProps {
  hero: HeroConfig
  /** Current word index from transcript for sync point triggering */
  currentWordIndex?: number
  /** Callback when a sync point is triggered */
  onSyncPoint?: (syncPoint: SyncPoint) => void
}

// ============================================================================
// Component
// ============================================================================

export const HeroRenderer = forwardRef<HeroRendererRef, HeroRendererProps>(
  ({ hero, currentWordIndex, onSyncPoint }, ref) => {
    const videoRef = useRef<VideoHeroRef>(null)

    // Expose video controls via ref
    useImperativeHandle(ref, () => {
      if (hero.type === 'video') {
        return {
          play: () => videoRef.current?.play(),
          pause: () => videoRef.current?.pause(),
          seek: (time: number) => videoRef.current?.seek(time),
          getCurrentTime: () => videoRef.current?.getCurrentTime() ?? 0,
        }
      }
      return {}
    }, [hero.type])

    // Check for sync points when word index changes
    const syncPoints = 'sync_points' in hero ? hero.sync_points : undefined
    if (
      currentWordIndex !== undefined &&
      syncPoints &&
      onSyncPoint
    ) {
      const triggeredSyncPoint = syncPoints.find(
        (sp: SyncPoint) => sp.word_index === currentWordIndex
      )
      if (triggeredSyncPoint) {
        onSyncPoint(triggeredSyncPoint)
      }
    }

    switch (hero.type) {
      case 'image':
        return <ImageHero src={hero.src} alt={hero.alt} />

      case 'video':
        return (
          <VideoHero
            ref={videoRef}
            src={hero.src}
            poster={hero.poster}
            autoplay={hero.autoplay}
            loop={hero.loop}
            muted={hero.muted}
          />
        )

      case 'gif':
        return <GifHero src={hero.src} alt={hero.alt} />

      case 'animated-svg':
        return (
          <AnimatedSVGHero
            src={hero.src}
            animationConfig={hero.animation_config}
          />
        )

      case 'interactive':
        return (
          <InteractiveHero
            component={hero.component}
            props={hero.props}
          />
        )

      case 'mascot':
        return (
          <MascotHero
            eyeVariant={hero.eye_variant}
            mouthVariant={hero.mouth_variant}
          />
        )

      default:
        return (
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted">
            <p className="text-muted-foreground">Unknown hero type</p>
          </div>
        )
    }
  }
)

HeroRenderer.displayName = 'HeroRenderer'
