import { useEffect, useState } from 'react'
import { subscribeCollection, questionsCol } from '../lib/firestore'
import { getAllQuestions, type Question } from '../data/questions'

export type QuestionDoc = Question & { _id: string }

export function useQuestions(category?: string, subcategories?: string[]) {
  const [questions, setQuestions] = useState<QuestionDoc[]>([])
  const [allCategoryQuestions, setAllCategoryQuestions] = useState<QuestionDoc[]>([])
  const [loading, setLoading] = useState(true)

  const subKey = subcategories?.join(',') ?? ''

  useEffect(() => {
    let isMounted = true

    const unsub = subscribeCollection<Question>(
      questionsCol(),
      (docs) => {
        let all = docs as QuestionDoc[]
        if (all.length === 0) {
          all = getAllQuestions().map(q => ({ ...q, _id: q.id }))
        }
        let catQuestions = all
        if (category) {
          catQuestions = all.filter(q => q.category === category)
        }
        let filteredQuestions = catQuestions
        if (subcategories && subcategories.length > 0) {
          filteredQuestions = catQuestions.filter(q => subcategories.includes(q.subcategory ?? ''))
        }
        if (isMounted) {
          setQuestions(filteredQuestions)
          setAllCategoryQuestions(catQuestions)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted = false
      unsub()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subKey])

  return { questions, allCategoryQuestions, loading }
}
