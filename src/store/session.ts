import { create } from 'zustand'

// ============================================================================
// Types
// ============================================================================

interface SessionState {
  /** Key of the lesson that was just completed (milestoneId/levelId/lessonId).
   *  Set when the user finishes a lesson and navigates to the dashboard.
   *  Cleared after the path animation plays once. NOT persisted across refreshes. */
  newlyCompletedLessonKey: string | null
}

interface SessionActions {
  setNewlyCompleted: (key: string) => void
  clearNewlyCompleted: () => void
}

// ============================================================================
// Store
// ============================================================================

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  newlyCompletedLessonKey: null,
  setNewlyCompleted: (key) => set({ newlyCompletedLessonKey: key }),
  clearNewlyCompleted: () => set({ newlyCompletedLessonKey: null }),
}))
