export type QuestionType = 'single' | 'multiple'

export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  options: Option[]
  correctAnswers: string[]
}

export interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
}

export interface QuizState {
  currentIndex: number
  answers: Record<string, string[]>
  /** Question IDs for which the user has tapped "Check" and seen feedback. */
  submittedQuestionIds: string[]
}

export type QuizAction =
  | { type: 'SELECT_ANSWER'; questionId: string; optionId: string; questionType: QuestionType }
  | { type: 'SUBMIT_ANSWER'; questionId: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'RESET' }

export interface LessonStatus {
  status: 'completed' | 'current' | 'locked'
}

export interface Lesson {
  id: string
  title: string
  icon: string
  status: LessonStatus['status']
  quizId?: string
}

export interface Unit {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}
