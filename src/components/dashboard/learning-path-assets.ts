/** Node state for lesson path. Re-exported by LessonNode for consumers. */
export type LessonNodeState = 'active' | 'completed' | 'locked'

/** Default node SVG assets (76×80 with shadow). Used by LessonNode when nodeAssets not provided. */
export const DEFAULT_NODE_ASSETS: Record<LessonNodeState, string> = {
  completed: '/learning-path/completed-module.svg',
  active: '/learning-path/continue-module.svg',
  locked: '/learning-path/locked-module.svg',
}

/** SVG URLs for path connectors. LTR = path on left (after left node), RTL = path on right (after right node). */
export interface PathAssets {
  completedPathLtr: string
  completedPathRtl: string
  lockedPathLtr: string
  lockedPathRtl: string
}

/** Default path SVGs from public/learning-path. Used by LessonPathMap when pathAssets not provided. */
export const DEFAULT_PATH_ASSETS: PathAssets = {
  completedPathLtr: '/learning-path/completed-path-ltr.svg',
  completedPathRtl: '/learning-path/completed-path-rtl.svg',
  lockedPathLtr: '/learning-path/locked-path-ltr.svg',
  lockedPathRtl: '/learning-path/locked-path-rtl.svg',
}
