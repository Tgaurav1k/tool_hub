import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { C } from '@toolhub/config'
import { getCurrentUser } from '@toolhub/auth'
import { useAppStore } from './stores/appStore'
import { RoleGuard } from './components/RoleGuard'
import { NotificationStack } from './components/NotificationStack'
import { AccessNotificationsBridge } from './components/AccessNotificationsBridge'

import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import ToolsPage from './pages/ToolsPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const [ready, setReady] = useState(false)
  const setUser = useAppStore((s) => s.setUser)
  const user = useAppStore((s) => s.user)

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser(u)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <>
        <NotificationStack />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.pageBg, color: C.sand600 }}>
          Loading...
        </div>
      </>
    )
  }

  return (
    <>
      <NotificationStack />
      <AccessNotificationsBridge />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />

      <Route path="/users" element={<RoleGuard allowed={['admin', 'superadmin']}><UsersPage /></RoleGuard>} />
      <Route path="/users/:id" element={<RoleGuard allowed={['admin', 'superadmin']}><UserDetailPage /></RoleGuard>} />
      <Route path="/admins" element={<Navigate to="/users" replace />} />
      <Route path="/tools" element={<RoleGuard allowed={['superadmin']}><ToolsPage /></RoleGuard>} />
      <Route path="/activity" element={<RoleGuard allowed={['admin', 'superadmin']}><ActivityPage /></RoleGuard>} />

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
    </>
  )
}
