import { useReducer } from 'react'
import type { Quiz, QuizState, QuizAction } from '@/types/quiz'

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      const current = state.answers[action.questionId] ?? []
      let next: string[]
      if (action.questionType === 'single') {
        next = [action.optionId]
      } else {
        next = current.includes(action.optionId)
          ? current.filter((id) => id !== action.optionId)
          : [...current, action.optionId]
      }
      return { ...state, answers: { ...state.answers, [action.questionId]: next } }
    }
    case 'SUBMIT_ANSWER':
      return state.submittedQuestionIds.includes(action.questionId)
        ? state
        : { ...state, submittedQuestionIds: [...state.submittedQuestionIds, action.questionId] }
    case 'NEXT':
      return { ...state, currentIndex: state.currentIndex + 1 }
    case 'PREV':
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) }
    case 'RESET':
      return { currentIndex: 0, answers: {}, submittedQuestionIds: [] }
  }
}

export function useQuiz(quiz: Quiz) {
  const [state, dispatch] = useReducer(quizReducer, {
    currentIndex: 0,
    answers: {},
    submittedQuestionIds: [],
  })

  const currentQuestion = quiz.questions[state.currentIndex]
  const totalQuestions = quiz.questions.length
  const progress = totalQuestions > 0 ? ((state.currentIndex + 1) / totalQuestions) * 100 : 0
  const selectedAnswers = currentQuestion ? (state.answers[currentQuestion.id] ?? []) : []
  const hasSubmittedCurrent =
    !!currentQuestion && state.submittedQuestionIds.includes(currentQuestion.id)
  const canCheck = selectedAnswers.length > 0 && !hasSubmittedCurrent
  const canGoNext = hasSubmittedCurrent
  const isComplete = state.currentIndex >= totalQuestions
  const isFirst = state.currentIndex === 0

  return {
    state,
    currentQuestion,
    totalQuestions,
    progress,
    selectedAnswers,
    hasSubmittedCurrent,
    canCheck,
    canGoNext,
    isComplete,
    isFirst,
    dispatch,
  }
}
