import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { isAdminEmail } from '../lib/admin'

interface AuthState {
  user: User | null
  /** Firebase auth state henüz yüklenmediyse true */
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

/** Computed: mevcut kullanıcı admin mi? */
export const useIsAdmin = () => useAuthStore(s => isAdminEmail(s.user?.email))
