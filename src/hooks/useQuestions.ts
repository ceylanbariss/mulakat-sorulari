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

    const applyData = (all: QuestionDoc[]) => {
      if (!isMounted) return
      let catQuestions = all
      if (category) catQuestions = all.filter(q => q.category === category)
      let filteredQuestions = catQuestions
      if (subcategories && subcategories.length > 0) {
        filteredQuestions = catQuestions.filter(q => subcategories.includes(q.subcategory ?? ''))
      }
      setQuestions(filteredQuestions)
      setAllCategoryQuestions(catQuestions)
      setLoading(false)
    }

    // Firestore izin hatası durumunda yerel veriye düş
    const timer = setTimeout(() => {
      applyData(getAllQuestions().map(q => ({ ...q, _id: q.id })))
    }, 2000)

    const unsub = subscribeCollection<Question>(
      questionsCol(),
      (docs) => {
        clearTimeout(timer)
        let all = docs as QuestionDoc[]
        if (all.length === 0) all = getAllQuestions().map(q => ({ ...q, _id: q.id }))
        applyData(all)
      }
    )
    return () => {
      isMounted = false
      clearTimeout(timer)
      unsub()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subKey])

  return { questions, allCategoryQuestions, loading }
}
