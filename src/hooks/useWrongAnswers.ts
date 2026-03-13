import { useEffect, useState } from 'react'
import { collection } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { getAll, where } from '../lib/firestore'

export interface WrongAnswerRecord {
  _id: string
  userId: string
  questionId: string
  // field may be stored as "question" or "questionText" in Firestore
  questionText: string
  question?: string
  // field may be stored as "answer" or "correctAnswer" in Firestore
  correctAnswer?: string
  answer?: string
  category: string
  subcategory?: string
  difficulty: string
  mode: string
  wrongCount: number
  lastWrongAt: { toMillis(): number } | null
}

export function useWrongAnswers(userId: string | undefined) {
  const [data, setData] = useState<WrongAnswerRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const col = collection(db, 'wrongAnswers')
    console.log('[useWrongAnswers] Sorgu başlatıldı — collection: wrongAnswers, userId:', userId)
    getAll<WrongAnswerRecord>(col, where('userId', '==', userId))
      .then(rawDocs => {
        console.log('[useWrongAnswers] Ham Firestore verileri:', JSON.stringify(rawDocs, null, 2))
        // Normalize: "question" → "questionText", "answer" → "correctAnswer"
        const normalized = rawDocs.map(doc => ({
          ...doc,
          questionText: doc.questionText || doc.question || '',
          correctAnswer: doc.correctAnswer || doc.answer,
        }))
        const sorted = [...normalized].sort((a, b) => {
          const aTime = (a as any).lastWrongAt?.toMillis?.() ?? 0
          const bTime = (b as any).lastWrongAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
        console.log(`[useWrongAnswers] Yanlış sorular yüklendi: ${sorted.length} adet`)
        setData(sorted)
        setLoading(false)
      })
      .catch(err => {
        console.error('[useWrongAnswers] Firestore sorgu hatası:', err)
        setLoading(false)
      })
  }, [userId])

  return { data, loading }
}
