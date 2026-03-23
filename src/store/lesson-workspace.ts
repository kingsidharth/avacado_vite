import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ============================================================================
// Types
// ============================================================================

interface LessonWorkspaceState {
  data: Record<string, unknown>
}

interface LessonWorkspaceActions {
  setWorkspaceData: (key: string, value: unknown) => void
  getWorkspaceData: (key: string) => unknown
  clearWorkspace: () => void
}

export type LessonWorkspaceStore = LessonWorkspaceState & LessonWorkspaceActions

// ============================================================================
// Zustand Store
// ============================================================================

export const useLessonWorkspaceStore = create<LessonWorkspaceStore>()(
  persist(
    (set, get) => ({
      data: {},

      // ----------------------------------------------------------------------
      // Workspace Actions
      // ----------------------------------------------------------------------

      setWorkspaceData: (key, value) =>
        set((s) => ({ data: { ...s.data, [key]: value } })),

      getWorkspaceData: (key) => get().data[key],

      clearWorkspace: () => set({ data: {} }),
    }),
    {
      name: 'avocado-lesson-workspace',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
