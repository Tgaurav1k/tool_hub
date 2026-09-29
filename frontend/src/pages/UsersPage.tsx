import { useState, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Trash2, ShieldCheck, Users as UsersIcon, UserCircle2 } from 'lucide-react'
import { C, SIDEBAR, ANIMATION, APP_NAME, ROLES, type Role } from '@toolhub/config'
import {
  Sidebar, TopBar, DataTable, Badge, Button, EmptyState,
  type Column,
} from '@toolhub/ui'
import { usersApi } from '@toolhub/api-client'
import type { User } from '@toolhub/api-client'
import type { AuthUser } from '@toolhub/auth'
import { useAppStore } from '../stores/appStore'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useAppSidebar } from '../hooks/useAppSidebar'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'
import CreateUserModal from '../components/CreateUserModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: C.success, bg: C.successBg },
  pending: { color: C.warning, bg: C.warningBg },
  inactive: { color: C.danger, bg: C.dangerBg },
}

export default function UsersPage() {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <UsersPageInner user={user} />
}

function UsersPageInner({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery } = useAppStore()
  const sidebarCollapsed = useSidebarCollapsed()
  const { items: sidebarItems, categoryDropdown, activeId: sidebarActiveId, onItemClick: onSidebarClick } = useAppSidebar()
  const notificationProps = useTopBarNotifications()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingRole, setCreatingRole] = useState<'user' | 'admin'>('user')
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const isSuperAdmin = user.role === 'superadmin'
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeletingUser(null)
    },
  })

  const { data: usersData, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getUsers(),
  })

  const allUsers = (usersData?.users ?? []).filter((u) => u.role !== 'superadmin')

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allUsers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    })
  }, [allUsers, searchQuery, roleFilter])

  const userCount = allUsers.filter((u) => u.role === 'user').length
  const adminCount = allUsers.filter((u) => u.role === 'admin').length

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: `${C.sand500}15`,
              color: C.sand600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {u.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span style={{ fontWeight: 600 }}>{u.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '22%',
      render: (u) => <span style={{ color: C.sand600 }}>{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      width: '10%',
      render: (u) => (
        <Badge
          color={u.role === 'admin' ? C.sage500 : C.info}
          bg={u.role === 'admin' ? C.sage50 : C.infoBg}
        >
          {u.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (u) => {
        const s = STATUS_STYLES[u.status] ?? STATUS_STYLES.inactive
        return <Badge color={s.color} bg={s.bg}>{u.status}</Badge>
      },
    },
    {
      key: 'categories',
      header: 'Categories',
      width: '24%',
      render: (u) => {
        const cats = u.categoryAssignments ?? []
        if (cats.length === 0) return <span style={{ color: C.sand300, fontSize: '13px' }}>None</span>
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {cats.slice(0, 3).map((a) => (
              <Badge key={a.id} color={C.sand700} bg={C.sand100} size="sm">
                {a.category.name}
              </Badge>
            ))}
            {cats.length > 3 && (
              <Badge color={C.sand600} bg={C.sand100} size="sm">
                +{cats.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: '12%',
      render: (u) => (
        <span style={{ color: C.sand600, fontSize: '13px' }}>
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (u) =>
        u.role !== 'superadmin' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeletingUser(u)
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.sand200}`,
              background: C.cardBg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} color={C.danger} />
          </button>
        ) : null,
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
                  User Management
                </h1>
                <p style={{ fontSize: '14px', color: C.sand600 }}>
                  {filteredUsers.length} {roleFilter === 'admin' ? 'admin' : roleFilter === 'user' ? 'user' : 'record'}
                  {filteredUsers.length !== 1 ? 's' : ''} shown · {userCount} user{userCount !== 1 ? 's' : ''} · {adminCount} admin{adminCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div
                  role="tablist"
                  aria-label="Filter by role"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 4,
                    borderRadius: 999,
                    background: C.sand100,
                    border: `1px solid ${C.sand200}`,
                    boxShadow: 'inset 0 1px 2px rgba(69, 54, 34, 0.06)',
                  }}
                >
                  {(
                    [
                      { id: 'all', label: 'All', count: allUsers.length, icon: <UsersIcon size={14} /> },
                      { id: 'user', label: 'Users', count: userCount, icon: <UserCircle2 size={14} /> },
                      { id: 'admin', label: 'Admins', count: adminCount, icon: <ShieldCheck size={14} /> },
                    ] as const
                  ).map((opt) => {
                    const active = roleFilter === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setRoleFilter(opt.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 999,
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 600,
                          color: active ? C.coffee800 : C.sand600,
                          background: active ? C.cardBg : 'transparent',
                          boxShadow: active
                            ? '0 1px 2px rgba(69, 54, 34, 0.12), 0 0 0 1px rgba(176, 141, 98, 0.35)'
                            : 'none',
                          transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <span style={{ display: 'flex', color: active ? C.sand700 : C.sand500 }}>{opt.icon}</span>
                        <span>{opt.label}</span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 20,
                            padding: '0 6px',
                            height: 18,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            color: active ? C.sand700 : C.sand500,
                            background: active ? `${C.sand500}20` : 'transparent',
                            border: active ? 'none' : `1px solid ${C.sand200}`,
                          }}
                        >
                          {opt.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <Button
                  onClick={() => {
                    setCreatingRole('user')
                    setShowCreateModal(true)
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Create User
                  </span>
                </Button>
                {isSuperAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCreatingRole('admin')
                      setShowCreateModal(true)
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} /> Create Admin
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState
                title="No users found"
                description={searchQuery ? 'Try adjusting your search' : 'Create your first user to get started'}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredUsers}
                keyExtractor={(u) => u.id}
                onRowClick={(u) => navigate(`/users/${u.id}`)}
                emptyMessage="No users match your search"
              />
            )}
          </motion.div>
        </main>
      </div>

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        adminUser={user}
        defaultRole={creatingRole}
        onCreated={() => {
          refetch()
          setShowCreateModal(false)
        }}
      />

      <ConfirmDeleteModal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        title="Delete User"
        message={`Are you sure you want to delete "${deletingUser?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
