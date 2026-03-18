import { useCallback } from 'react'
import { animate } from 'animejs'
import { MascotBlob } from '@/components/mascot/MascotBlob'
import type { EyeVariant } from '@/components/mascot/MascotEyes'
import type { MouthVariant } from '@/components/mascot/MascotMouth'

interface MascotHeroProps {
  eyeVariant?: string
  mouthVariant?: string
  /** @deprecated CTA removed from hero; kept for content manifest compatibility */
  ctaText?: string
  /** @deprecated CTA removed from hero; kept for content manifest compatibility */
  onCtaClick?: () => void
}

export function MascotHero({
  eyeVariant = 'regular',
  mouthVariant = 'smile',
}: MascotHeroProps) {
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const mascotEl = node.querySelector('.mascot-hero-blob')
    if (mascotEl) {
      animate(mascotEl, {
        translateY: [60, 0],
        opacity: [0, 1],
        duration: 350,
        ease: 'outBack',
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col items-start justify-start gap-[16px]">
      <div className="mascot-hero-blob h-48 w-48 opacity-0">
        <MascotBlob
          bodyMode="static"
          staticBaseScale={1.8}
          staticInnerScale={1.0}
          faceScale={1.3}
          faceOffsetY={-35}
          alignContent="left"
          eyeVariant={eyeVariant as EyeVariant}
          mouthVariant={mouthVariant as MouthVariant}
        />
      </div>
    </div>
  )
}
