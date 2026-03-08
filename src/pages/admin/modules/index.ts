import {
  LayoutDashboard,
  BookOpen,
  Tag,
  Megaphone,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AdminModule {
  id: string
  label: string
  icon: LucideIcon
  path: string   // relative to /admin — '' for dashboard
}

/**
 * Admin panel modülleri.
 * Yeni modül eklemek için buraya bir satır eklemek yeterli.
 */
export const ADMIN_MODULES: AdminModule[] = [
  { id: 'dashboard',      label: 'Genel Bakış',  icon: LayoutDashboard, path: '' },
  { id: 'questions',      label: 'Sorular',       icon: BookOpen,        path: 'sorular' },
  { id: 'categories',     label: 'Kategoriler',   icon: Tag,             path: 'kategoriler' },
  { id: 'announcements',  label: 'Duyurular',     icon: Megaphone,       path: 'duyurular' },
  { id: 'users',          label: 'Kullanıcılar',  icon: Users,           path: 'kullanicilar' },
]
