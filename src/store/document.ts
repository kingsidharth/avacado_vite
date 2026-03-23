import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ============================================================================
// Types
// ============================================================================

export interface RagExchange {
  query: string
  response: string
  rating?: number // 1=not useful, 2=somewhat, 3=very useful
}

interface DocumentState {
  documentText: string | null
  documentName: string | null
  documentType: 'pdf' | 'docx' | 'txt' | 'sample' | null
  wordCount: number
  ragHistory: RagExchange[]
  lastRound3Rating: number | null
}

interface DocumentActions {
  setDocument: (text: string, name: string, type: DocumentState['documentType']) => void
  addRagExchange: (query: string, response: string) => void
  setRatingForExchange: (index: number, rating: number) => void
  setLastRound3Rating: (rating: number) => void
  clearDocument: () => void
}

export type DocumentStore = DocumentState & DocumentActions

// ============================================================================
// Zustand Store
// ============================================================================

const initialState: DocumentState = {
  documentText: null,
  documentName: null,
  documentType: null,
  wordCount: 0,
  ragHistory: [],
  lastRound3Rating: null,
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      ...initialState,

      // ----------------------------------------------------------------------
      // Document Actions
      // ----------------------------------------------------------------------

      setDocument: (text, name, type) =>
        set({
          documentText: text,
          documentName: name,
          documentType: type,
          wordCount: text.trim().split(/\s+/).filter(Boolean).length,
          ragHistory: [],
          lastRound3Rating: null,
        }),

      // ----------------------------------------------------------------------
      // RAG Exchange Actions
      // ----------------------------------------------------------------------

      addRagExchange: (query, response) =>
        set((s) => ({
          ragHistory: [...s.ragHistory, { query, response }],
        })),

      setRatingForExchange: (index, rating) =>
        set((s) => ({
          ragHistory: s.ragHistory.map((ex, i) =>
            i === index ? { ...ex, rating } : ex
          ),
        })),

      setLastRound3Rating: (rating) => set({ lastRound3Rating: rating }),

      // ----------------------------------------------------------------------
      // Reset
      // ----------------------------------------------------------------------

      clearDocument: () => set(initialState),
    }),
    {
      name: 'avocado-rag-document',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
