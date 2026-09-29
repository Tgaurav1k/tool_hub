import { Navigate } from 'react-router-dom'
import { useAppStore } from '../stores/appStore'

interface RoleGuardProps {
  allowed: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const user = useAppStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
