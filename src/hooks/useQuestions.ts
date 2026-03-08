import { useEffect, useState } from 'react'
import { subscribeCollection, questionsCol } from '../lib/firestore'
import { getAllQuestions, type Question } from '../data/questions'

export type QuestionDoc = Question & { _id: string }

export function useQuestions(category?: string) {
  const [questions, setQuestions] = useState<QuestionDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const unsub = subscribeCollection<Question>(
      questionsCol(),
      (docs) => {
        let all = docs as QuestionDoc[]
        if (all.length === 0) {
          all = getAllQuestions().map(q => ({ ...q, _id: q.id }))
        }
        if (category) {
          all = all.filter(q => q.category === category)
        }
        if (isMounted) {
          setQuestions(all)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted = false
      unsub()
    }
  }, [category])

  return { questions, loading }
}
