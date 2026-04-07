import { useEffect, useState } from 'react'
import { subscribeCollection, categoriesCol, questionsCol, getAll } from '../lib/firestore'
import { CATEGORIES, type Category } from '../data/categories'

export type CategoryDoc = Category & { _id: string, count?: number, order?: number }

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fallbackToLocal = () => {
      if (isMounted) {
        setCategories(CATEGORIES.map(c => ({ ...c, _id: c.id, count: c.count })))
        setLoading(false)
      }
    }

    // Firestore izin hatası durumunda (giriş yapılmamış kullanıcı) yerel veriye düş
    const timer = setTimeout(fallbackToLocal, 2000)

    const unsub = subscribeCollection<Category>(
      categoriesCol(),
      async (docs) => {
        clearTimeout(timer)
        let all = docs as CategoryDoc[]
        if (all.length === 0) {
          all = CATEGORIES.map(c => ({ ...c, _id: c.id, count: c.count }))
        } else {
          all = [...all].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          try {
            // Fetch counts dynamically from Firestore
            const qs = await getAll<{ category: string }>(questionsCol())
            const counts: Record<string, number> = {}
            qs.forEach(q => counts[q.category] = (counts[q.category] || 0) + 1)
            all = all.map(c => ({ ...c, count: counts[c.id] || 0 }))
          } catch (e) { }
        }
        if (isMounted) {
          setCategories(all)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted = false
      clearTimeout(timer)
      unsub()
    }
  }, [])

  return { categories, loading }
}
