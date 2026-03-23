import { Link } from '@tanstack/react-router'
import { Home, GraduationCap, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

function TabItem({ to, icon, label }: TabItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-2',
        'text-[#6c6c6c] transition-colors',
        '[&.active]:text-foreground',
      )}
      activeProps={{ className: 'active text-foreground' }}
    >
      {icon}
      <span className="text-body font-normal tracking-[-0.4173px]">{label}</span>
    </Link>
  )
}

export function BottomTabBar() {
  return (
    /*
     * Outer wrapper: fixed to bottom-0, full width capped at 450px, centered.
     * Contains three layers stacked top-to-bottom:
     *   1. Gradient fade  — transparent → white, hides scrolling content above
     *   2. Solid white slab — the backing behind the pill
     *   3. Nav pill       — the actual tab bar
     */
    <div
      className={cn(
        'fixed bottom-0 left-1/2 z-10 w-full max-w-[450px] -translate-x-1/2',
        'flex flex-col items-stretch',
      )}
    >
      {/* Progressive gradient: fades scrolling content into white */}
      <div className="pointer-events-none h-16 w-full bg-gradient-to-b from-transparent to-white" />

      {/* White backing area — solid white behind the pill */}
      <div className="flex w-full items-center justify-center bg-white px-5 pb-8 pt-2">
        {/* Nav pill */}
        <nav
          className={cn(
            'flex w-full items-center justify-around',
            'rounded-[110px] border border-[rgba(10,10,10,0.02)] bg-white px-5 py-2',
            'shadow-[0px_21px_6px_0px_rgba(163,163,163,0),0px_13px_5px_0px_rgba(163,163,163,0.01),0px_7px_4px_0px_rgba(163,163,163,0.05),0px_3px_3px_0px_rgba(163,163,163,0.09),0px_1px_2px_0px_rgba(163,163,163,0.1)]',
          )}
        >
          <TabItem
            to="/dashboard"
            icon={<Home className="size-6" />}
            label="Learn"
          />
          <TabItem
            to="/learn"
            icon={<GraduationCap className="size-6" />}
            label="Levels"
          />
          <TabItem
            to="/chat"
            icon={<MessageCircle className="size-6" />}
            label="AI Chat"
          />
          <TabItem
            to="/profile"
            icon={<User className="size-6" />}
            label="Profile"
          />
        </nav>
      </div>
    </div>
  )
}
