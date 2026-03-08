import { yazilimQuestions } from './questions/yazilim'
import { kamuQuestions } from './questions/kamu'
import { bankaQuestions } from './questions/banka'
import { ikQuestions } from './questions/ik'

export interface Question {
  id: string
  category: string
  subcategory?: string
  difficulty: 'kolay' | 'orta' | 'zor'
  question: string
  answer: string
  hints?: string[]
  options?: { label: string; text: string; correct: boolean }[]
}

const allQuestions: Question[] = [
  ...yazilimQuestions,
  ...kamuQuestions,
  ...bankaQuestions,
  ...ikQuestions,
]

export function getQuestionsByCategory(category: string): Question[] {
  return allQuestions.filter((q) => q.category === category)
}

export function getAllQuestions(): Question[] {
  return allQuestions
}

export { allQuestions }
