import { cn } from '@/lib/utils'

// Unique IDs per icon so gradients/clipPaths don't clash when all are in the DOM
const LIGHTNING_GRADIENT_ID = 'stats-row-lightning-gradient'
const FIRE_GRADIENT_ID = 'stats-row-fire-gradient'
const COINS_GRADIENT_ID = 'stats-row-coins-gradient'
const COINS_CLIP_ID = 'stats-row-coins-clip'
const MONEY_GRADIENT_ID = 'stats-row-money-gradient'

/** 15×15 – XP (Lightning) */
function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M12.5302 7.35156L5.96771 14.3828C5.89816 14.457 5.80637 14.5066 5.70617 14.5241C5.60597 14.5415 5.50281 14.526 5.41225 14.4797C5.3217 14.4333 5.24866 14.3588 5.20416 14.2674C5.15966 14.1759 5.14611 14.0725 5.16556 13.9727L6.02454 9.67597L2.64779 8.408C2.57526 8.38088 2.51059 8.33621 2.45955 8.27799C2.4085 8.21977 2.37268 8.14981 2.35527 8.07437C2.33786 7.99892 2.3394 7.92034 2.35978 7.84564C2.38015 7.77094 2.4187 7.70245 2.472 7.64629L9.0345 0.615035C9.10405 0.540817 9.19585 0.491233 9.29604 0.473763C9.39624 0.456294 9.4994 0.471888 9.58996 0.518192C9.68052 0.564496 9.75355 0.638997 9.79806 0.730454C9.84256 0.82191 9.8561 0.92536 9.83665 1.02519L8.97532 5.32656L12.3521 6.59277C12.4241 6.62008 12.4882 6.6647 12.5389 6.72269C12.5895 6.78068 12.6251 6.85025 12.6425 6.92525C12.6599 7.00026 12.6585 7.07839 12.6385 7.15274C12.6185 7.22709 12.5805 7.29538 12.5279 7.35156H12.5302Z"
        fill={`url(#${LIGHTNING_GRADIENT_ID})`}
      />
      <defs>
        <linearGradient
          id={LIGHTNING_GRADIENT_ID}
          x1="7.49891"
          y1="0.466797"
          x2="7.49891"
          y2="14.531"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#29CB00" />
          <stop offset="1" stopColor="#D6FFCC" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** 16×16 – Days (Fire) */
function FireIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M8.96125 1.11552C8.89961 1.06428 8.82656 1.0286 8.74824 1.01151C8.66993 0.994409 8.58865 0.996391 8.51127 1.01728C8.43388 1.03818 8.36265 1.07737 8.30359 1.13156C8.24452 1.18575 8.19935 1.25334 8.17188 1.32865L6.79688 5.10427L5.28687 3.64115C5.23616 3.59196 5.17561 3.55408 5.10919 3.53C5.04278 3.50592 4.97201 3.49619 4.90157 3.50145C4.83112 3.5067 4.76258 3.52683 4.70047 3.56049C4.63837 3.59416 4.5841 3.64061 4.54125 3.69677C3.1875 5.47052 2.5 7.2549 2.5 8.9999C2.5 10.4586 3.07946 11.8575 4.11091 12.889C5.14236 13.9204 6.54131 14.4999 8 14.4999C9.45869 14.4999 10.8576 13.9204 11.8891 12.889C12.9205 11.8575 13.5 10.4586 13.5 8.9999C13.5 5.28427 10.3256 2.2499 8.96125 1.11552ZM11.4931 9.58365C11.3635 10.3078 11.0151 10.9749 10.4948 11.4951C9.9745 12.0153 9.30734 12.3635 8.58313 12.493C8.55567 12.4977 8.52786 12.5 8.5 12.4999C8.37458 12.4999 8.25375 12.4527 8.16148 12.3677C8.06921 12.2828 8.01223 12.1663 8.00185 12.0413C7.99146 11.9163 8.02843 11.792 8.10542 11.693C8.18242 11.594 8.2938 11.5275 8.4175 11.5068C9.45312 11.3324 10.3319 10.4536 10.5075 9.41615C10.5297 9.28536 10.603 9.16876 10.7112 9.09198C10.8193 9.01521 10.9536 8.98456 11.0844 9.00677C11.2152 9.02898 11.3318 9.10224 11.4085 9.21043C11.4853 9.31861 11.516 9.45286 11.4937 9.58365H11.4931Z"
        fill={`url(#${FIRE_GRADIENT_ID})`}
      />
      <defs>
        <linearGradient
          id={FIRE_GRADIENT_ID}
          x1="8"
          y1="1"
          x2="8"
          y2="14.4999"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFA537" />
          <stop offset="1" stopColor="#EAC89F" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** 16×16 – Coins */
function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <g clipPath={`url(#${COINS_CLIP_ID})`}>
        <path
          d="M11.5 5.59812V5.25C11.5 3.6825 9.13562 2.5 6 2.5C2.86438 2.5 0.5 3.6825 0.5 5.25V7.75C0.5 9.05562 2.14062 10.0931 4.5 10.4038V10.75C4.5 12.3175 6.86438 13.5 10 13.5C13.1356 13.5 15.5 12.3175 15.5 10.75V8.25C15.5 6.95625 13.9113 5.9175 11.5 5.59812ZM3.5 9.17937C2.27562 8.8375 1.5 8.27437 1.5 7.75V6.87063C2.01 7.23187 2.69313 7.52313 3.5 7.71875V9.17937ZM8.5 7.71875C9.30688 7.52313 9.99 7.23187 10.5 6.87063V7.75C10.5 8.27437 9.72437 8.8375 8.5 9.17937V7.71875ZM7.5 12.1794C6.27563 11.8375 5.5 11.2744 5.5 10.75V10.4894C5.66437 10.4956 5.83063 10.5 6 10.5C6.2425 10.5 6.47937 10.4919 6.71187 10.4781C6.97016 10.5706 7.23325 10.649 7.5 10.7131V12.1794ZM7.5 9.39062C7.00338 9.46399 6.50201 9.50055 6 9.5C5.49799 9.50055 4.99662 9.46399 4.5 9.39062V7.90375C4.99736 7.96856 5.49843 8.00071 6 8C6.50157 8.00071 7.00264 7.96856 7.5 7.90375V9.39062ZM11.5 12.3906C10.5053 12.5365 9.49468 12.5365 8.5 12.3906V10.9C8.9972 10.9668 9.49833 11.0002 10 11C10.5016 11.0007 11.0026 10.9686 11.5 10.9038V12.3906ZM14.5 10.75C14.5 11.2744 13.7244 11.8375 12.5 12.1794V10.7188C13.3069 10.5231 13.99 10.2319 14.5 9.87062V10.75Z"
          fill={`url(#${COINS_GRADIENT_ID})`}
        />
      </g>
      <defs>
        <linearGradient
          id={COINS_GRADIENT_ID}
          x1="8"
          y1="2.5"
          x2="8"
          y2="13.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#DBCC24" />
          <stop offset="1" stopColor="#EBE284" />
        </linearGradient>
        <clipPath id={COINS_CLIP_ID}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

/** 16×16 – Avo Cash (Money) */
function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M10.5 8C10.5 8.49445 10.3534 8.9778 10.0787 9.38893C9.80397 9.80005 9.41352 10.1205 8.95671 10.3097C8.49989 10.4989 7.99723 10.5484 7.51227 10.452C7.02732 10.3555 6.58186 10.1174 6.23223 9.76777C5.8826 9.41814 5.6445 8.97268 5.54804 8.48773C5.45157 8.00277 5.50108 7.50011 5.6903 7.04329C5.87952 6.58648 6.19995 6.19603 6.61107 5.92133C7.0222 5.64662 7.50555 5.5 8 5.5C8.66304 5.5 9.29893 5.76339 9.76777 6.23223C10.2366 6.70107 10.5 7.33696 10.5 8ZM15.5 4V12C15.5 12.1326 15.4473 12.2598 15.3536 12.3536C15.2598 12.4473 15.1326 12.5 15 12.5H1C0.867392 12.5 0.740215 12.4473 0.646447 12.3536C0.552678 12.2598 0.5 12.1326 0.5 12V4C0.5 3.86739 0.552678 3.74021 0.646447 3.64645C0.740215 3.55268 0.867392 3.5 1 3.5H15C15.1326 3.5 15.2598 3.55268 15.3536 3.64645C15.4473 3.74021 15.5 3.86739 15.5 4ZM14.5 6.89687C13.9323 6.729 13.4155 6.42175 12.9969 6.00311C12.5782 5.58447 12.271 5.06775 12.1031 4.5H3.89687C3.729 5.06775 3.42175 5.58447 3.00311 6.00311C2.58447 6.42175 2.06775 6.729 1.5 6.89687V9.10312C2.06775 9.271 2.58447 9.57825 3.00311 9.99689C3.42175 10.4155 3.729 10.9323 3.89687 11.5H12.1031C12.271 10.9323 12.5782 10.4155 12.9969 9.99689C13.4155 9.57825 13.9323 9.271 14.5 9.10312V6.89687Z"
        fill={`url(#${MONEY_GRADIENT_ID})`}
      />
      <defs>
        <linearGradient
          id={MONEY_GRADIENT_ID}
          x1="8"
          y1="3.5"
          x2="8"
          y2="12.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#02C328" />
          <stop offset="1" stopColor="#02F332" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// --- Stat pill: matches Figma spec (559:3871, 559:3876, etc.) ---
const pillShadowClass =
  'shadow-[0px_21px_6px_0px_rgba(163,163,163,0),0px_13px_5px_0px_rgba(163,163,163,0.01),0px_7px_4px_0px_rgba(163,163,163,0.05),0px_3px_3px_0px_rgba(163,163,163,0.09),0px_1px_2px_0px_rgba(163,163,163,0.1)]'

interface StatPillProps {
  icon: React.ReactNode
  label: string
  className?: string
}

function StatPill({ icon, label, className }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex h-8 items-center gap-[2px] overflow-clip rounded-[48px] border border-[rgba(10,10,10,0.02)]',
        'bg-white px-[8px] py-[7px] font-sans',
        pillShadowClass,
        className,
      )}
    >
      {icon}
      <span className="whitespace-nowrap font-medium text-[14px] tracking-[-0.4173px] text-[rgba(10,10,10,0.8)]">
        {label}
      </span>
    </div>
  )
}

// --- StatsRow: four pills, space-between, Figma node 559:3870 ---
interface StatsRowProps {
  xp?: number
  streakDays?: number
  coins?: number
  avoCash?: number
  className?: string
}

export function StatsRow({
  xp = 0,
  streakDays = 0,
  coins = 0,
  avoCash = 0,
  className,
}: StatsRowProps) {
  return (
    <div
      className={cn(
        'flex h-8 w-full flex-wrap items-center justify-between gap-2',
        className,
      )}
      role="group"
      aria-label="Stats: XP, streak days, coins, Avo Cash"
    >
      <StatPill icon={<LightningIcon />} label={`${xp} XP`} />
      <StatPill icon={<FireIcon />} label={`${streakDays} Days`} />
      <StatPill icon={<CoinsIcon />} label={`${coins} Coins`} />
      <StatPill icon={<MoneyIcon />} label={`${avoCash} Avo Cash`} />
    </div>
  )
}
