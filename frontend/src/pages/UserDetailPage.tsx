import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Calendar, Shield, KeyRound, Lock } from 'lucide-react'
import { C, shadows, glass, SIDEBAR, ANIMATION, APP_NAME, ROLES, type Role } from '@toolhub/config'
import { Sidebar, TopBar, Button, Badge, Modal, Input } from '@toolhub/ui'
import { usersApi, assignmentsApi, toolsApi, toolAssignmentsApi, categoriesApi } from '@toolhub/api-client'
import type { Tool } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useAppSidebar } from '../hooks/useAppSidebar'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'
import CategoryAssignment from '../components/CategoryAssignment'

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: C.success, bg: C.successBg },
  pending: { color: C.warning, bg: C.warningBg },
  inactive: { color: C.danger, bg: C.dangerBg },
}

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false
  for (const x of a) {
    if (!b.has(x)) return false
  }
  return true
}

export default function UserDetailPage() {
  const adminUser = useAppStore((s) => s.user)!
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sidebarCollapsed = useSidebarCollapsed()
  const { items: sidebarItems, categoryDropdown, activeId: sidebarActiveId, onItemClick: onSidebarClick } = useAppSidebar()
  const notificationProps = useTopBarNotifications()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
  })

  const targetUser = userData?.user

  const currentCategoryIds = useMemo(
    () => new Set(targetUser?.categoryAssignments?.map((a) => a.categoryId) ?? []),
    [targetUser],
  )

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedExplicitTools, setSelectedExplicitTools] = useState<Set<string>>(() => new Set())
  const [initialResolvedExplicit, setInitialResolvedExplicit] = useState<Set<string>>(() => new Set())
  const [accessInitialized, setAccessInitialized] = useState(false)
  const [toolSearch, setToolSearch] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetResult, setResetResult] = useState<{
    resyncedToolCount: number
    linkedToolSyncWarnings: string[]
  } | null>(null)

  const assignmentKey = useMemo(
    () =>
      (targetUser?.categoryAssignments ?? [])
        .map((a) => a.categoryId)
        .sort()
        .join(','),
    [targetUser?.categoryAssignments],
  )

  const explicitKeyFromServer = useMemo(
    () => [...(userData?.explicitToolIds ?? [])].sort().join(','),
    [userData?.explicitToolIds],
  )

  useEffect(() => {
    if (!targetUser) return
    setSelectedCategories(
      new Set(targetUser.categoryAssignments?.map((a) => a.categoryId) ?? []),
    )
  }, [targetUser?.id, assignmentKey])

  useEffect(() => {
    if (!id || !targetUser) return
    let cancelled = false
    setAccessInitialized(false)
    const catIds = [...(targetUser.categoryAssignments?.map((a) => a.categoryId) ?? [])]
    const baseline = new Set(userData?.explicitToolIds ?? [])

    ;(async () => {
      const resolved = new Set<string>()

      for (const cid of catIds) {
        const res = await queryClient.fetchQuery({
          queryKey: ['category-tools', cid],
          queryFn: () => categoriesApi.getCategoryTools(cid),
        })
        if (cancelled) return
        const tools = res.category?.tools ?? []
        const nonGated = tools.filter((t: Tool) => !t.requiresToolAssignment)
        const assignment = targetUser.categoryAssignments?.find((a) => a.categoryId === cid)
        const restrict = assignment?.restrictStandardTools === true
        if (!restrict) {
          for (const t of nonGated) resolved.add(t.id)
        } else {
          for (const t of nonGated) {
            if (baseline.has(t.id)) resolved.add(t.id)
          }
        }
      }

      if (!cancelled) {
        setSelectedExplicitTools(resolved)
        setInitialResolvedExplicit(new Set(resolved))
        setAccessInitialized(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, targetUser?.id, assignmentKey, explicitKeyFromServer, queryClient])

  const adminCategoryIds = useMemo(() => {
    if (adminUser.role === 'superadmin') return null
    return new Set(adminUser.categoryAssignments?.map((a) => a.category.id) ?? [])
  }, [adminUser])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cats = Array.from(selectedCategories)
      for (const cid of cats) {
        await queryClient.ensureQueryData({
          queryKey: ['category-tools', cid],
          queryFn: () => categoriesApi.getCategoryTools(cid),
        })
      }
      const explicitToolIds: string[] = []
      for (const cid of cats) {
        const cached = queryClient.getQueryData<{ category?: { tools: Tool[] } }>([
          'category-tools',
          cid,
        ])
        const tools = cached?.category?.tools ?? []
        for (const t of tools) {
          if (t.requiresToolAssignment) continue
          if (selectedExplicitTools.has(t.id)) explicitToolIds.push(t.id)
        }
      }
      const willSyncLinked = isSuperAdmin && toolAccessInitialized && toolAccessHasChanges
      await assignmentsApi.assignCategories(id!, cats, explicitToolIds, {
        suppressNotification: willSyncLinked,
      })

      if (willSyncLinked) {
        const assignments = linkedTools
          .filter((t) => toolAccess[t.id]?.enabled)
          .map((t) => ({ toolId: t.id, toolRole: toolAccess[t.id]!.toolRole }))
        const syncRes = await toolAssignmentsApi.syncUserToolAssignments(id!, assignments)
        if (syncRes.syncWarnings?.length) {
          setToolSyncNotice(syncRes.syncWarnings.join(' '))
        } else {
          setToolSyncNotice('')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tools'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['category-tools'] })
      queryClient.invalidateQueries({ queryKey: ['tool-assignments', id] })
      setToolAccessInitialized(false)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus: 'active' | 'inactive') =>
      usersApi.updateUser(id!, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (newPassword: string) => usersApi.resetUserPassword(id!, newPassword),
    onSuccess: (data) => {
      setResetResult({
        resyncedToolCount: data.resyncedToolCount,
        linkedToolSyncWarnings: data.linkedToolSyncWarnings,
      })
      setResetPassword('')
      setResetError('')
    },
    onError: (err: Error) => {
      setResetError(err.message || 'Failed to reset password')
    },
  })

  const isSuperAdmin = adminUser.role === 'superadmin'

  const { data: linkedToolsRes } = useQuery({
    queryKey: ['tools', 'requires-assignment'],
    queryFn: () => toolsApi.getTools(undefined, { requiresToolAssignment: true }),
    enabled: isSuperAdmin,
  })

  const { data: existingToolAssignments } = useQuery({
    queryKey: ['tool-assignments', id],
    queryFn: () => toolAssignmentsApi.getUserToolAssignments(id!),
    enabled: isSuperAdmin && !!id,
  })

  const linkedTools = linkedToolsRes?.tools ?? []
  const linkedSearchQuery = toolSearch.trim().toLowerCase()
  const visibleLinkedTools = linkedSearchQuery
    ? linkedTools.filter((t) => t.name.toLowerCase().includes(linkedSearchQuery))
    : linkedTools

  const [toolAccess, setToolAccess] = useState<
    Record<string, { enabled: boolean; toolRole: 'user' | 'admin' }>
  >({})
  const [toolAccessInitialized, setToolAccessInitialized] = useState(false)
  const [toolSyncNotice, setToolSyncNotice] = useState('')

  useEffect(() => {
    if (!linkedTools.length || toolAccessInitialized) return
    if (!existingToolAssignments) return
    const state: Record<string, { enabled: boolean; toolRole: 'user' | 'admin' }> = {}
    for (const t of linkedTools) {
      const existing = existingToolAssignments.assignments.find((a) => a.toolId === t.id)
      state[t.id] = existing
        ? { enabled: true, toolRole: existing.toolRole }
        : { enabled: false, toolRole: 'user' }
    }
    setToolAccess(state)
    setToolAccessInitialized(true)
  }, [linkedTools, existingToolAssignments, toolAccessInitialized])

  const toolAccessHasChanges = useMemo(() => {
    if (!toolAccessInitialized) return false
    const existingMap = new Map(
      (existingToolAssignments?.assignments ?? []).map((a) => [a.toolId, a.toolRole]),
    )
    for (const t of linkedTools) {
      const row = toolAccess[t.id]
      if (!row) continue
      const wasEnabled = existingMap.has(t.id)
      if (row.enabled !== wasEnabled) return true
      if (row.enabled && wasEnabled && row.toolRole !== existingMap.get(t.id)) return true
    }
    return false
  }, [toolAccess, existingToolAssignments, linkedTools, toolAccessInitialized])

  const toolAssignMutation = useMutation({
    mutationFn: () => {
      const assignments = linkedTools
        .filter((t) => toolAccess[t.id]?.enabled)
        .map((t) => ({ toolId: t.id, toolRole: toolAccess[t.id]!.toolRole }))
      return toolAssignmentsApi.syncUserToolAssignments(id!, assignments)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tool-assignments', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      setToolAccessInitialized(false)
      if (data.syncWarnings?.length) {
        setToolSyncNotice(data.syncWarnings.join(' '))
      } else {
        setToolSyncNotice('')
      }
    },
  })

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      const wasSelected = prev.has(catId)
      const next = new Set(prev)
      if (wasSelected) {
        next.delete(catId)
        void queryClient
          .ensureQueryData({
            queryKey: ['category-tools', catId],
            queryFn: () => categoriesApi.getCategoryTools(catId),
          })
          .then((res) => {
            const allTools = res.category?.tools ?? []
            const stripNonGated = new Set(
              allTools.filter((t: Tool) => !t.requiresToolAssignment).map((t) => t.id),
            )
            setSelectedExplicitTools((ex) =>
              new Set([...ex].filter((tid) => !stripNonGated.has(tid))),
            )
            if (isSuperAdmin) {
              const gatedIds = allTools.filter((t: Tool) => t.requiresToolAssignment).map((t) => t.id)
              setToolAccess((tp) => {
                const np = { ...tp }
                for (const tid of gatedIds) {
                  np[tid] = {
                    toolRole: np[tid]?.toolRole ?? 'user',
                    enabled: false,
                  }
                }
                return np
              })
              setToolAccessInitialized(true)
            }
          })
      } else {
        next.add(catId)
        void queryClient
          .ensureQueryData({
            queryKey: ['category-tools', catId],
            queryFn: () => categoriesApi.getCategoryTools(catId),
          })
          .then((res) => {
            const allTools = res.category?.tools ?? []
            const nonGated = allTools.filter((t: Tool) => !t.requiresToolAssignment)
            setSelectedExplicitTools((ex) => new Set([...ex, ...nonGated.map((t) => t.id)]))
            if (isSuperAdmin) {
              const gatedIds = allTools.filter((t: Tool) => t.requiresToolAssignment).map((t) => t.id)
              setToolAccess((tp) => {
                const np = { ...tp }
                for (const tid of gatedIds) {
                  np[tid] = {
                    toolRole: np[tid]?.toolRole ?? 'user',
                    enabled: true,
                  }
                }
                return np
              })
              setToolAccessInitialized(true)
            }
          })
      }
      return next
    })
  }

  const handleToggleTool = (toolId: string, checked: boolean) => {
    setSelectedExplicitTools((prev) => {
      const n = new Set(prev)
      if (checked) n.add(toolId)
      else n.delete(toolId)
      return n
    })
  }

  const handleToggleLinkedTool = (toolId: string, checked: boolean) => {
    setToolAccess((prev) => ({
      ...prev,
      [toolId]: {
        toolRole: prev[toolId]?.toolRole ?? 'user',
        enabled: checked,
      },
    }))
    setToolAccessInitialized(true)
  }

  const hasChanges = useMemo(() => {
    if (!accessInitialized) return false
    if (selectedCategories.size !== currentCategoryIds.size) return true
    for (const cid of selectedCategories) {
      if (!currentCategoryIds.has(cid)) return true
    }
    if (!setsEqual(selectedExplicitTools, initialResolvedExplicit)) return true
    if (toolAccessHasChanges) return true
    return false
  }, [
    accessInitialized,
    selectedCategories,
    currentCategoryIds,
    selectedExplicitTools,
    initialResolvedExplicit,
    toolAccessHasChanges,
  ])

  if (isLoading || !targetUser) {
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
          userRole={adminUser.role}
          categoryDropdown={categoryDropdown}
        />
        <div
          className="tb-main"
          style={{
            flex: 1,
            marginLeft: sidebarCollapsed ? SIDEBAR.collapsed : SIDEBAR.expanded,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.sand600,
          }}
        >
          Loading user...
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[targetUser.status] ?? STATUS_STYLES.inactive

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
        userRole={adminUser.role}
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
          userName={adminUser.name}
          userAvatarUrl={adminUser.avatarUrl}
          userRole={ROLES[(adminUser.role ?? 'user') as Role]?.label ?? 'User'}
          search={toolSearch}
          onSearchChange={setToolSearch}
          roleColor={ROLES[(adminUser.role ?? 'user') as Role]?.color ?? C.sage500}
          {...notificationProps}
        />

        <main className="tb-page" style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIMATION.pageDuration }}
          >
            <button
              onClick={() => navigate('/users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.sand600,
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '20px',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Back to Users
            </button>

            <div
              style={{
                background: glass.background,
                backdropFilter: glass.blur,
                border: glass.border,
                borderRadius: glass.borderRadius,
                boxShadow: shadows.sm,
                padding: '28px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '14px',
                      background: `${C.sand500}15`,
                      color: C.sand600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                    }}
                  >
                    {targetUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: C.coffee800, margin: 0 }}>
                      {targetUser.name}
                    </h1>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: C.sand600 }}>
                        <Mail size={14} /> {targetUser.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: C.sand600 }}>
                        <Shield size={14} /> {ROLES[targetUser.role]?.label ?? targetUser.role}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: C.sand600 }}>
                        <Calendar size={14} /> Joined {new Date(targetUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Badge color={statusStyle.color} bg={statusStyle.bg} size="md">
                    {targetUser.status}
                  </Badge>
                  {targetUser.role !== 'superadmin' && adminUser.role === 'superadmin' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowResetModal(true)
                        setResetPassword('')
                        setResetError('')
                        setResetResult(null)
                      }}
                    >
                      <KeyRound size={14} style={{ marginRight: 6 }} />
                      Reset password
                    </Button>
                  )}
                  {targetUser.role !== 'superadmin' && (
                    <Button
                      variant={targetUser.status === 'active' ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate(targetUser.status === 'active' ? 'inactive' : 'active')
                      }
                      disabled={statusMutation.isPending}
                    >
                      {targetUser.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                background: glass.background,
                backdropFilter: glass.blur,
                border: glass.border,
                borderRadius: glass.borderRadius,
                boxShadow: shadows.sm,
                padding: '28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.coffee800, margin: 0 }}>
                  Category Access
                </h2>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!hasChanges || saveMutation.isPending}
                  size="sm"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>

              {saveMutation.isSuccess && (
                <div
                  style={{
                    background: C.successBg,
                    color: C.success,
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  Category and tool access updated successfully
                </div>
              )}

              <p style={{ fontSize: '13px', color: C.sand600, margin: '0 0 16px', lineHeight: 1.5 }}>
                Assign categories, then choose which standard tools in each category this user can open.
                Tools that use linked accounts are managed in the section below.
              </p>

              <CategoryAssignment
                selectedCategories={selectedCategories}
                adminCategoryIds={adminCategoryIds}
                onToggle={handleToggleCategory}
                selectedExplicitTools={selectedExplicitTools}
                onToggleTool={handleToggleTool}
                linkedToolAccess={isSuperAdmin ? toolAccess : undefined}
                onToggleLinkedTool={isSuperAdmin ? handleToggleLinkedTool : undefined}
                search={toolSearch}
              />
            </div>

            {isSuperAdmin && visibleLinkedTools.length > 0 && (
              <div
                style={{
                  background: glass.background,
                  backdropFilter: glass.blur,
                  border: glass.border,
                  borderRadius: glass.borderRadius,
                  boxShadow: shadows.sm,
                  padding: '28px',
                  marginTop: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.coffee800, margin: 0 }}>
                    Linked Tool Access
                  </h2>
                  <Button
                    onClick={() => toolAssignMutation.mutate()}
                    disabled={!toolAccessHasChanges || toolAssignMutation.isPending}
                    size="sm"
                  >
                    {toolAssignMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                {toolAssignMutation.isSuccess && !toolSyncNotice && (
                  <div
                    style={{
                      background: C.successBg,
                      color: C.success,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '16px',
                    }}
                  >
                    Tool access updated successfully
                  </div>
                )}

                {toolSyncNotice && (
                  <div
                    style={{
                      background: C.warningBg,
                      color: C.warning,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '16px',
                    }}
                  >
                    Saved, but external sync reported: {toolSyncNotice}
                  </div>
                )}

                <p style={{ fontSize: '13px', color: C.sand600, margin: '0 0 16px', lineHeight: 1.5 }}>
                  Toggle access to linked external tools. Changes are saved to the database. To also sync the user's password to the external app, set it during user creation.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {visibleLinkedTools.map((tool) => {
                    const row = toolAccess[tool.id] ?? { enabled: false, toolRole: 'user' as const }
                    return (
                      <div
                        key={tool.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: `1.5px solid ${row.enabled ? C.sand500 : C.sand200}`,
                          background: row.enabled ? `${C.sand500}08` : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: C.coffee800,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '6px',
                              border: `2px solid ${row.enabled ? C.sand500 : C.sand200}`,
                              background: row.enabled ? C.sand500 : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              setToolAccess((prev) => ({
                                ...prev,
                                [tool.id]: { ...row, enabled: !row.enabled },
                              }))
                            }
                          >
                            {row.enabled && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span
                            onClick={() =>
                              setToolAccess((prev) => ({
                                ...prev,
                                [tool.id]: { ...row, enabled: !row.enabled },
                              }))
                            }
                          >
                            {tool.name}
                          </span>
                        </label>
                        <select
                          value={row.toolRole}
                          disabled={!row.enabled}
                          onChange={(e) =>
                            setToolAccess((prev) => ({
                              ...prev,
                              [tool.id]: {
                                ...(prev[tool.id] ?? row),
                                toolRole: e.target.value as 'user' | 'admin',
                              },
                            }))
                          }
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${C.sand200}`,
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            background: C.cardBg,
                            color: C.sand700,
                            opacity: row.enabled ? 1 : 0.4,
                          }}
                        >
                          <option value="user">Role: User</option>
                          <option value="admin">Role: Admin</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset password"
        width={460}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
              {resetResult ? 'Close' : 'Cancel'}
            </Button>
            {!resetResult && (
              <Button
                onClick={() => resetPasswordMutation.mutate(resetPassword)}
                disabled={resetPassword.length < 8 || resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset & Resync'}
              </Button>
            )}
          </div>
        }
      >
        {resetResult ? (
          <>
            <div
              style={{
                background: C.successBg,
                color: C.success,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Password updated. Resynced to {resetResult.resyncedToolCount} linked tool
              {resetResult.resyncedToolCount === 1 ? '' : 's'}.
            </div>
            {resetResult.linkedToolSyncWarnings.length > 0 && (
              <div
                style={{
                  background: C.warningBg,
                  color: C.warning,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Sync warnings:</div>
                {resetResult.linkedToolSyncWarnings.map((w, i) => (
                  <div key={i}>• {w}</div>
                ))}
              </div>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 12, color: C.sand600, lineHeight: 1.5 }}>
              The user signs in to Toolhub and any linked tools with <strong>{targetUser?.email}</strong>{' '}
              and the new password.
            </p>
          </>
        ) : (
          <>
            {resetError && (
              <div
                style={{
                  background: C.dangerBg,
                  color: C.danger,
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                {resetError}
              </div>
            )}
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.sand600, lineHeight: 1.5 }}>
              Set a new password for <strong>{targetUser?.name}</strong>. It will also be pushed to every
              linked tool they have access to, so they can sign in there with the same credentials.
            </p>
            <Input
              label="New password"
              type="password"
              placeholder="Minimum 8 characters"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              icon={<Lock size={16} />}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
