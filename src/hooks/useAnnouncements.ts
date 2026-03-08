import { useEffect, useState } from 'react'
import { subscribeCollection, announcementsCol } from '../lib/firestore'

export interface Announcement {
  title: string
  content: string
  active: boolean
  createdAt?: { seconds: number }
}

export type AnnouncementDoc = Announcement & { _id: string }

/** Aktif duyuruları Firestore'dan dinler */
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([])

  useEffect(() => {
    const unsub = subscribeCollection<Announcement>(
      announcementsCol(),
      (docs) => {
        const active = (docs as AnnouncementDoc[])
          .filter(a => a.active)
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        setAnnouncements(active)
      },
    )
    return unsub
  }, [])

  return announcements
}
