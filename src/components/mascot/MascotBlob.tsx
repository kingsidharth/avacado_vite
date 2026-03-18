import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { createNodes, createControlPoints, drawBlobPath } from './blob-utils'
import { MascotEyes, type EyeVariant } from './MascotEyes'
import { MascotMouth, type MouthVariant } from './MascotMouth'
import { useBlobAnimation } from './useBlobAnimation'
import { MascotBodyStatic, computeStaticCenter } from './MascotBodyStatic'

export type BodyMode = 'generated' | 'static'

export interface SubBlobConfig {
  nodes: number
  radius: number
  offsetX: number
  offsetY: number
}

export interface MascotBlobProps {
  /** Applied to root SVG; e.g. for Cursor DOM path targeting */
  'data-cursor-element-id'?: string
  className?: string
  bodyMode?: BodyMode
  eyeVariant?: EyeVariant
  mouthVariant?: MouthVariant
  // Generated body props
  outerBlobs?: SubBlobConfig[]
  innerScale?: number
  innerOffsetY?: number
  // Static body props
  staticBaseScale?: number
  staticBaseOffsetX?: number
  staticBaseOffsetY?: number
  staticInnerScale?: number
  // Face props
  faceOffsetX?: number
  faceOffsetY?: number
  faceSpacing?: number
  faceScale?: number
  /** Align SVG content horizontally when scaled: 'left' | 'center' (default) */
  alignContent?: 'left' | 'center'
  // Animation props
  animationEnabled?: boolean
  animationSpeed?: number
  animationAmplitude?: number
  // Grain texture props
  grainEnabled?: boolean
  grainFrequency?: number
  grainOctaves?: number
  grainContrast?: number
  grainBrightness?: number
  grainScale?: number
}

function generateBlobPath(config: SubBlobConfig): string {
  const { nodes: totalNodes, radius, offsetX, offsetY } = config
  const n = createNodes(totalNodes, radius, offsetX, offsetY)
  const cp = createControlPoints(n, totalNodes, radius, offsetX, offsetY)
  return drawBlobPath(n, cp)
}

export const DEFAULT_OUTER_BLOBS: SubBlobConfig[] = [
  { nodes: 6, radius: 130, offsetX: 90, offsetY: 75 },
  { nodes: 6, radius: 120, offsetX: 130, offsetY: 95 },
  { nodes: 6, radius: 115, offsetX: 110, offsetY: 140 },
]

const DEFAULT_INNER_SCALE = 0.78
const DEFAULT_INNER_OFFSET_Y = -8

export function deriveInnerBlobs(
  outer: SubBlobConfig[],
  scale: number,
  offsetY: number
): SubBlobConfig[] {
  return outer.map((o) => {
    const innerRadius = o.radius * scale
    const centerAlign = o.radius - innerRadius
    return {
      nodes: o.nodes,
      radius: innerRadius,
      offsetX: o.offsetX + centerAlign,
      offsetY: o.offsetY + centerAlign + offsetY,
    }
  })
}

function computeInnerCenter(innerBlobs: SubBlobConfig[]) {
  const xs = innerBlobs.map((b) => b.radius + b.offsetX)
  const ys = innerBlobs.map((b) => b.radius + b.offsetY)
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  }
}

export function MascotBlob({
  'data-cursor-element-id': dataCursorElementId,
  className = 'w-full max-w-[420px] md:max-w-[520px] lg:max-w-[600px]',
  bodyMode = 'static',
  eyeVariant = 'regular',
  mouthVariant = 'smile',
  outerBlobs = DEFAULT_OUTER_BLOBS,
  innerScale = DEFAULT_INNER_SCALE,
  innerOffsetY = DEFAULT_INNER_OFFSET_Y,
  staticBaseScale = 1.8,
  staticBaseOffsetX = 0,
  staticBaseOffsetY = 0,
  staticInnerScale = 1.0,
  faceOffsetX = 0,
  faceOffsetY = -35,
  faceSpacing = 1.0,
  faceScale = 1.3,
  alignContent = 'center',
  animationEnabled = false,
  animationSpeed = 3,
  animationAmplitude = 8,
  grainEnabled = false,
  grainFrequency = 0.65,
  grainOctaves = 4,
  grainContrast = 200,
  grainBrightness = 150,
  grainScale = 1.0,
}: MascotBlobProps) {
  const isGenerated = bodyMode === 'generated'

  // Hover/click face reaction state
  const [reacting, setReacting] = useState(false)
  const [hovering, setHovering] = useState(false)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Blink state
  const [blinking, setBlinking] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
  }, [])

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    setReacting(true)
    clickTimeoutRef.current = setTimeout(() => {
      setReacting(false)
      clickTimeoutRef.current = null
    }, 1200)
  }, [])

  // Determine active face variants — hover/click override props
  const activeEyes: EyeVariant = (hovering || reacting) ? 'shy' : eyeVariant
  const activeMouth: MouthVariant = (hovering || reacting) ? 'grin' : mouthVariant

  // Blink loop — only when showing regular eyes
  useEffect(() => {
    if (activeEyes !== 'regular') return

    let mounted = true
    let blinkTimeout: ReturnType<typeof setTimeout>
    let openTimeout: ReturnType<typeof setTimeout>

    function scheduleBlink() {
      if (!mounted) return
      const interval = (3.0 + (Math.random() - 0.5)) * 1000 // 2.5–3.5s between blinks
      blinkTimeout = setTimeout(() => {
        if (!mounted) return
        setBlinking(true)
        const blinkDuration = (0.05 + Math.random() * 0.04) * 1000 // 50–90ms
        openTimeout = setTimeout(() => {
          if (!mounted) return
          setBlinking(false)
          scheduleBlink()
        }, blinkDuration)
      }, interval)
    }

    scheduleBlink()

    return () => {
      mounted = false
      clearTimeout(blinkTimeout)
      clearTimeout(openTimeout)
      setBlinking(false)
    }
  }, [activeEyes])

  // --- Generated body calculations (only used when bodyMode=generated) ---
  const innerBlobs = useMemo(
    () => isGenerated ? deriveInnerBlobs(outerBlobs, innerScale, innerOffsetY) : [],
    [outerBlobs, innerScale, innerOffsetY, isGenerated]
  )

  const outerPaths = useMemo(
    () => isGenerated ? outerBlobs.map((config) => generateBlobPath(config)) : [],
    [outerBlobs, isGenerated]
  )

  const innerPaths = useMemo(
    () => isGenerated ? innerBlobs.map((config) => generateBlobPath(config)) : [],
    [innerBlobs, isGenerated]
  )

  const generatedCenter = useMemo(
    () => isGenerated ? computeInnerCenter(innerBlobs) : { x: 0, y: 0 },
    [innerBlobs, isGenerated]
  )

  const { outerPathRefs, innerPathRefs } = useBlobAnimation({
    outerBlobs,
    innerBlobs,
    enabled: isGenerated && animationEnabled,
    speed: animationSpeed,
    amplitude: animationAmplitude,
  })

  // Face center depends on body mode
  const staticCenter = useMemo(
    () => computeStaticCenter(staticBaseScale, staticBaseOffsetX, staticBaseOffsetY),
    [staticBaseScale, staticBaseOffsetX, staticBaseOffsetY]
  )
  const center = isGenerated ? generatedCenter : staticCenter

  // Eye and mouth dimensions (from the SVG viewBoxes)
  const eyeW = 130
  const eyeH = 92
  const mouthW = 70
  const mouthH = 52

  const spacing = faceSpacing
  const scale = faceScale
  const fx = center.x + faceOffsetX
  const fy = center.y + faceOffsetY
  const eyeYOff = -eyeH * 0.8 * spacing
  const mouthYOff = mouthH * 0.55 * spacing

  const preserveAspectRatio = alignContent === 'left' ? 'xMinYMid meet' : 'xMidYMid meet'

  return (
    <svg
      viewBox="0 0 500 520"
      width="100%"
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...(dataCursorElementId != null && { 'data-cursor-element-id': dataCursorElementId })}
    >
      {isGenerated && (
        <defs>
          <filter id="goo-outer">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <filter id="goo-inner">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      )}

      <defs>
        <linearGradient id="fade-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.7" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="fade-mask">
          <rect x="0" y="0" width="500" height="520" fill="url(#fade-gradient)" />
        </mask>
      </defs>

      {/* Hover float keyframes — always active */}
      <style>{`
        @keyframes hover-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .blob-outer-hover {
          animation: hover-float 3.6s ease-in-out infinite;
        }
        .blob-inner-hover {
          animation: hover-float 3.6s ease-in-out infinite;
          animation-delay: -0.08s;
        }
        .blob-base-hover {
          animation: hover-float 3.6s ease-in-out infinite;
        }
        .blob-inner-static-hover {
          animation: hover-float 3.6s ease-in-out infinite;
          animation-delay: -0.02s;
        }
        .blob-face-hover {
          animation: hover-float 3.6s ease-in-out infinite;
          animation-delay: -0.06s;
        }
        .blob-eye-blink {
          transform-box: fill-box;
          transform-origin: center center;
          transform: scaleY(0.03);
        }
      `}</style>

      {/* Body layers */}
      {isGenerated ? (
        <>
          {/* Generated: outer layer with fade mask */}
          <g mask="url(#fade-mask)">
            <g filter="url(#goo-outer)" className="blob-outer-hover">
              {outerPaths.map((d, i) => (
                <path
                  key={i}
                  ref={(el) => { outerPathRefs.current[i] = el }}
                  d={d}
                  fill="#9FFEC3"
                />
              ))}
            </g>
          </g>

          {/* Generated: inner layer */}
          <g filter="url(#goo-inner)" className="blob-inner-hover">
            {innerPaths.map((d, i) => (
              <path
                key={i}
                ref={(el) => { innerPathRefs.current[i] = el }}
                d={d}
                fill="#B5FFB2"
              />
            ))}
          </g>
        </>
      ) : (
        <>
          {/* Static: base + inner layers, each with own hover float offset */}
          <MascotBodyStatic
            baseScale={staticBaseScale}
            baseOffsetX={staticBaseOffsetX}
            baseOffsetY={staticBaseOffsetY}
            innerScale={staticInnerScale}
            grainEnabled={grainEnabled}
            grainFrequency={grainFrequency}
            grainOctaves={grainOctaves}
            grainContrast={grainContrast}
            grainBrightness={grainBrightness}
            grainScale={grainScale}
          />
        </>
      )}

      {/* Face — hover float wrapper separate from positioning transform */}
      <g className="blob-face-hover">
        <g transform={`translate(${fx}, ${fy}) scale(${scale})`}>
          {activeEyes && (
            <g className={blinking && activeEyes === 'regular' ? 'blob-eye-blink' : undefined}>
              <svg
                x={-eyeW / 2}
                y={eyeYOff}
                width={eyeW}
                height={eyeH}
              >
                <MascotEyes variant={activeEyes} />
              </svg>
            </g>
          )}
          {activeMouth && (
            <svg
              x={-mouthW / 2}
              y={mouthYOff}
              width={mouthW}
              height={mouthH}
            >
              <MascotMouth variant={activeMouth} />
            </svg>
          )}
        </g>
      </g>
    </svg>
  )
}
