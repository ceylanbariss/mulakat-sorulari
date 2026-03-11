import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { getAll, trainingSessionsCol, where } from '../lib/firestore'

export interface TrainingSession {
  _id: string
  userId: string
  mode: 'flashcard' | 'quiz' | 'written'
  category: string
  totalQuestions: number
  correctCount: number
  partialCount: number
  wrongCount: number
  score: number
  createdAt: { toMillis(): number } | null
}

export interface CategoryStat {
  category: string
  totalSessions: number
  totalQuestions: number
  correctCount: number
  score: number
}

export interface TrainingStats {
  sessions: TrainingSession[]
  loading: boolean
  totalSessions: number
  totalQuestions: number
  avgScore: number
  weeklyQuestions: number
  categoryStats: CategoryStat[]
  modeStats: Record<string, number>
  recentSessions: TrainingSession[]
  strongCategories: CategoryStat[]
  weakCategories: CategoryStat[]
}

export function useTrainingStats(): TrainingStats {
  const user = useAuthStore(s => s.user)
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); setSessions([]); return }
    setLoading(true)
    getAll<TrainingSession>(trainingSessionsCol(), where('userId', '==', user.uid))
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const aTime = (a as any).createdAt?.toMillis?.() ?? 0
          const bTime = (b as any).createdAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
        setSessions(sorted as TrainingSession[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user?.uid])

  const totalSessions = sessions.length
  const totalQuestions = sessions.reduce((s, c) => s + c.totalQuestions, 0)
  const avgScore = totalSessions
    ? Math.round(sessions.reduce((s, c) => s + c.score, 0) / totalSessions)
    : 0

  // Questions solved in last 7 days
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const weeklyQuestions = sessions
    .filter(s => now - ((s as any).createdAt?.toMillis?.() ?? 0) < weekMs)
    .reduce((acc, s) => acc + s.totalQuestions, 0)

  // Category breakdown
  const catMap: Record<string, { sessions: number; totalQ: number; correct: number }> = {}
  for (const s of sessions) {
    if (!catMap[s.category]) catMap[s.category] = { sessions: 0, totalQ: 0, correct: 0 }
    catMap[s.category].sessions++
    catMap[s.category].totalQ += s.totalQuestions
    catMap[s.category].correct += s.correctCount
  }
  const categoryStats: CategoryStat[] = Object.entries(catMap)
    .map(([cat, v]) => ({
      category: cat,
      totalSessions: v.sessions,
      totalQuestions: v.totalQ,
      correctCount: v.correct,
      score: v.totalQ > 0 ? Math.round((v.correct / v.totalQ) * 100) : 0,
    }))
    .sort((a, b) => b.totalQuestions - a.totalQuestions)

  // Mode breakdown
  const modeStats: Record<string, number> = {}
  for (const s of sessions) {
    modeStats[s.mode] = (modeStats[s.mode] ?? 0) + 1
  }

  const recentSessions = sessions.slice(0, 10)

  // Min 5 questions in that category to count as strong/weak
  const strongCategories = categoryStats.filter(c => c.score >= 65 && c.totalQuestions >= 5)
  const weakCategories = categoryStats.filter(c => c.score < 55 && c.totalQuestions >= 3)

  return {
    sessions,
    loading,
    totalSessions,
    totalQuestions,
    avgScore,
    weeklyQuestions,
    categoryStats,
    modeStats,
    recentSessions,
    strongCategories,
    weakCategories,
  }
}
