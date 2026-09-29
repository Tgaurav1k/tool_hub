import { useEffect, useState, ComponentType } from 'react'
import { getCurrentUser } from './getCurrentUser'
import type { AuthUser } from './types'
import { ROLE_REDIRECT } from '@toolhub/config'

export function withRole<P extends object>(
  WrappedComponent: ComponentType<P & { user: AuthUser }>,
  allowedRole: 'superadmin' | 'admin' | 'user',
) {
  return function RoleGuard(props: P) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      getCurrentUser().then((u) => {
        if (!u) {
          window.location.href = '/login'
          return
        }

        if (u.role !== allowedRole && u.role !== 'superadmin') {
          const redirect = ROLE_REDIRECT[u.role]
          window.location.href = redirect
          return
        }

        setUser(u)
        setLoading(false)
      })
    }, [])

    if (loading || !user) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#F8F4EE',
          }}
        >
          <div style={{ color: '#9A7D5B', fontSize: '16px' }}>Loading...</div>
        </div>
      )
    }

    return <WrappedComponent {...props} user={user} />
  }
}
