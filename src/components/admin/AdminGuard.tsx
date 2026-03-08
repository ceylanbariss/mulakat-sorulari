import { Navigate } from 'react-router-dom'
import { useAuthStore, useIsAdmin } from '../../store/useAuthStore'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthStore()
  const isAdmin = useIsAdmin()

  if (loading) return null
  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
