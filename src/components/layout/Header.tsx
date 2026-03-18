import { useRef, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Trophy, CircleUser } from 'lucide-react'
import { animate } from 'animejs'

function useShineEffect() {
  const ref = useRef<HTMLAnchorElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const attachRef = useCallback((el: HTMLAnchorElement | null) => {
    ref.current = el
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!el) return

    intervalRef.current = setInterval(() => {
      const shine = el.querySelector<HTMLElement>('[data-shine]')
      if (!shine) return
      animate(shine, {
        translateX: ['-100%', '200%'],
        opacity: [0, 0.6, 0],
        duration: 800,
        ease: 'inOutQuad',
      })
    }, 12000)
  }, [])

  return attachRef
}

export function Header() {
  const shineRef = useShineEffect()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background px-5 py-3">
      <div className="mx-auto flex max-w-[450px] items-center justify-between px-0 md:px-5">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Avocado
          </p>
          <Link
            ref={shineRef}
            to="/leaderboard"
            className="relative flex items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-amber-50 p-1.5 text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-200 hover:text-amber-900 active:bg-amber-300"
          >
            <div
              data-shine
              className="pointer-events-none absolute inset-y-0 w-6 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
            <Trophy className="size-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="flex items-center justify-center rounded-full bg-muted p-1.5"
          >
            <CircleUser className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  )
}
