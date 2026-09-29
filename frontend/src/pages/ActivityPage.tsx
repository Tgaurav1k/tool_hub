import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Filter } from 'lucide-react'
import { C, SIDEBAR, ANIMATION, APP_NAME, ROLES, type Role } from '@toolhub/config'
import {
  Sidebar, TopBar, DataTable, Badge, EmptyState,
  type Column,
} from '@toolhub/ui'
import { activityApi } from '@toolhub/api-client'
import type { ActivityLog } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useAppSidebar } from '../hooks/useAppSidebar'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'

const ACTION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  login: { color: C.info, bg: C.infoBg, label: 'Login' },
  logout: { color: C.sand600, bg: C.sand100, label: 'Logout' },
  tool_launch: { color: C.success, bg: C.successBg, label: 'Tool Launch' },
}

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'tool_launch', label: 'Tool Launch' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ActivityPage() {
  const user = useAppStore((s) => s.user)!
  const { searchQuery, setSearchQuery } = useAppStore()
  const sidebarCollapsed = useSidebarCollapsed()
  const { items: sidebarItems, categoryDropdown, activeId: sidebarActiveId, onItemClick: onSidebarClick } = useAppSidebar()
  const notificationProps = useTopBarNotifications()
  const [actionFilter, setActionFilter] = useState('')

  const { data: activityData } = useQuery({
    queryKey: ['admin-activity', actionFilter],
    queryFn: () =>
      activityApi.getActivityLogs({
        limit: 100,
        action: actionFilter || undefined,
      }),
  })

  const logs = activityData?.data ?? []

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter(
      (l) =>
        l.user?.name?.toLowerCase().includes(q) ||
        l.user?.email?.toLowerCase().includes(q) ||
        l.tool?.name?.toLowerCase().includes(q),
    )
  }, [logs, searchQuery])

  const columns: Column<ActivityLog>[] = [
    {
      key: 'user',
      header: 'User',
      width: '25%',
      render: (log) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: `${C.sand500}15`,
              color: C.sand600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(log.user?.name ?? '?')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{log.user?.name ?? 'Unknown'}</div>
            <div style={{ fontSize: '12px', color: C.sand300 }}>{log.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '18%',
      render: (log) => {
        const style = ACTION_STYLES[log.action] ?? ACTION_STYLES.login
        return <Badge color={style.color} bg={style.bg}>{style.label}</Badge>
      },
    },
    {
      key: 'tool',
      header: 'Tool',
      width: '30%',
      render: (log) => {
        if (!log.tool) return <span style={{ color: C.sand300, fontSize: '13px' }}>—</span>
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{log.tool.name}</div>
            {log.tool.category && (
              <span style={{ fontSize: '12px', color: C.sand300 }}>{log.tool.category.name}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'time',
      header: 'Time',
      width: '20%',
      render: (log) => (
        <div>
          <div style={{ fontSize: '13px', color: C.coffee800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} color={C.sand300} />
            {timeAgo(log.createdAt)}
          </div>
          <div style={{ fontSize: '11px', color: C.sand300 }}>
            {new Date(log.createdAt).toLocaleString()}
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>
      <Sidebar
        items={sidebarItems}
        activeId={sidebarActiveId}
        onItemClick={onSidebarClick}
        appName={APP_NAME}
        onLogout={() => {
          document.cookie = 'token=; Max-Age=0; path=/'
          window.location.href = '/login'
        }}
        userRole={user.role}
        categoryDropdown={categoryDropdown}
      />

      <div
        className="tb-main"
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? SIDEBAR.collapsed : SIDEBAR.expanded,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <TopBar
          userName={user.name}
          userAvatarUrl={user.avatarUrl}
          userRole={ROLES[(user.role ?? 'user') as Role]?.label ?? 'User'}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          roleColor={ROLES[(user.role ?? 'user') as Role]?.color ?? C.sage500}
          {...notificationProps}
        />

        <main className="tb-page" style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIMATION.pageDuration }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: C.coffee800, marginBottom: '4px' }}>
                  Activity Log
                </h1>
                <p style={{ fontSize: '14px', color: C.sand600 }}>
                  {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''} recorded
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} color={C.sand600} />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${C.sand200}`,
                    background: C.cardBg,
                    fontSize: '13px',
                    color: C.coffee800,
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {ACTION_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <EmptyState
                title="No activity found"
                description="There are no activity logs matching your filters"
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredLogs}
                keyExtractor={(l) => l.id}
                emptyMessage="No activity logs"
              />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
