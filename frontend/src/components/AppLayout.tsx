import React from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Sidebar, TopBar, type SidebarItem } from '@toolhub/ui'
import { C, SIDEBAR } from '@toolhub/config'
import { authApi } from '@toolhub/api-client'
import { Home, Users, Settings, Wrench, Activity } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useCategories } from '../hooks/useAssignedTools'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'
import { getIconComponent } from '../utils/iconMap'

export function AppLayout() {
  const user = useAppStore((s) => s.user)
  const search = useAppStore((s) => s.searchQuery)
  const setSearch = useAppStore((s) => s.setSearchQuery)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: categories } = useCategories()
  const collapsed = useSidebarCollapsed()
  const notificationProps = useTopBarNotifications()

  if (!user) return null

  const role = user.role
  const sidebarWidth = collapsed ? SIDEBAR.collapsed : SIDEBAR.expanded

  const navItems: SidebarItem[] = [
    { id: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  ]

  if (role === 'user' && categories) {
    categories.forEach((cat) => {
      const Icon = getIconComponent(cat.icon)
      navItems.push({
        id: `/dashboard?category=${cat.id}`,
        label: cat.name,
        icon: <Icon size={20} />,
      })
    })
  }

  if (role === 'admin' || role === 'superadmin') {
    navItems.push({ id: '/users', label: 'User Management', icon: <Users size={20} /> })
    navItems.push({ id: '/activity', label: 'Activity Log', icon: <Activity size={20} /> })
  }

  if (role === 'superadmin') {
    navItems.push({ id: '/tools', label: 'Tool Catalogue', icon: <Wrench size={20} /> })
  }

  navItems.push({ id: '/profile', label: 'Profile', icon: <Settings size={20} /> })

  const activeId = navItems.find((item) => location.pathname === item.id.split('?')[0])?.id
    || '/dashboard'

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    useAppStore.getState().setUser(null)
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>
      <Sidebar
        items={navItems}
        activeId={activeId}
        onItemClick={(id) => {
          const [path, query] = id.split('?')
          if (query) {
            const params = new URLSearchParams(query)
            const catId = params.get('category')
            if (catId) {
              useAppStore.getState().setActiveCategory(catId)
              navigate('/dashboard')
              return
            }
          }
          useAppStore.getState().setActiveCategory(null)
          navigate(path)
        }}
        appName="Tool HUB"
        onLogout={handleLogout}
      />
      <div
        style={{
          flex: 1,
          marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar
          userName={user.name}
          userAvatarUrl={user.avatarUrl}
          userRole={role}
          search={search}
          onSearchChange={setSearch}
          {...notificationProps}
        />
        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
