import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Lock, ChevronDown } from 'lucide-react'
import { C } from '@toolhub/config'
import { Modal, Input, Button } from '@toolhub/ui'
import { usersApi, categoriesApi, toolsApi } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { getIconComponent } from '../utils/iconMap'

const ROLE_SYNC_SLUGS = new Set(['image-generation'])

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  adminUser?: { categoryAssignments?: { category: { id: string } }[] }
  onCreated?: () => void
  defaultRole?: 'user' | 'admin'
}

export default function CreateUserModal({ open, onClose, adminUser: adminUserProp, onCreated, defaultRole }: CreateUserModalProps) {
  const storeUser = useAppStore((s) => s.user)
  const adminUser = adminUserProp ?? storeUser
  const isSuperAdmin = storeUser?.role === 'superadmin'
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [linkedToolAccess, setLinkedToolAccess] = useState<
    Record<string, { enabled: boolean; toolRole: 'user' | 'admin' }>
  >({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [syncNotice, setSyncNotice] = useState('')

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    enabled: open,
  })

  const { data: linkedToolsRes } = useQuery({
    queryKey: ['tools', 'requires-assignment'],
    queryFn: () => toolsApi.getTools(undefined, { requiresToolAssignment: true }),
    enabled: open && isSuperAdmin,
  })

  const linkedTools = linkedToolsRes?.tools ?? []

  useEffect(() => {
    if (!linkedTools.length) return
    setLinkedToolAccess((prev) => {
      const next = { ...prev }
      for (const t of linkedTools) {
        if (!next[t.id]) next[t.id] = { enabled: false, toolRole: 'user' }
      }
      return next
    })
  }, [linkedTools])

  const apiCategories = useMemo(() => {
    const list = categoriesRes?.categories ?? []
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categoriesRes?.categories])
  const adminCategoryIds = useMemo(() => {
    if (isSuperAdmin) return new Set(apiCategories.map((c) => c.id))
    return new Set(adminUser?.categoryAssignments?.map((a) => a.category.id) ?? [])
  }, [adminUser, isSuperAdmin, apiCategories])

  const toolsByCategory = useMemo(() => {
    const map = new Map<string, typeof linkedTools>()
    for (const tool of linkedTools) {
      const list = map.get(tool.categoryId) ?? []
      list.push(tool)
      map.set(tool.categoryId, list)
    }
    return map
  }, [linkedTools])

  const toggleCategoryExpanded = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const toggleToolEnabled = (toolId: string) => {
    setLinkedToolAccess((prev) => {
      const row = prev[toolId] ?? { enabled: false, toolRole: 'user' as const }
      return { ...prev, [toolId]: { ...row, enabled: !row.enabled } }
    })
  }

  const setToolRole = (toolId: string, toolRole: 'user' | 'admin') => {
    setLinkedToolAccess((prev) => ({
      ...prev,
      [toolId]: { ...(prev[toolId] ?? { enabled: false, toolRole: 'user' as const }), toolRole },
    }))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const toolAssignments = linkedTools
        .filter((t) => linkedToolAccess[t.id]?.enabled)
        .map((t) => ({
          toolId: t.id,
          toolRole: linkedToolAccess[t.id]!.toolRole,
        }))
      return usersApi.createUser({
        name,
        email,
        password,
        role: defaultRole ?? 'user',
        categoryIds: Array.from(selectedCategories),
        ...(toolAssignments.length ? { toolAssignments } : {}),
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      resetForm()
      const notices: string[] = []
      if (data.linkedToolSyncWarnings?.length) {
        notices.push(`Linked app sync: ${data.linkedToolSyncWarnings.join(' ')}`)
      }
      if (data.emailWarning) {
        notices.push(`Welcome email: ${data.emailWarning}`)
      }
      setSyncNotice(notices.join(' · '))
      onCreated?.()
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create user')
    },
  })

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setSelectedCategories(new Set())
    setExpandedCategories(new Set())
    setError('')
    setLinkedToolAccess((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((id) => [id, { enabled: false, toolRole: 'user' as const }]),
      ),
    )
  }

  const handleClose = () => {
    resetForm()
    setSyncNotice('')
    onClose()
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      const wasSelected = prev.has(catId)
      const next = new Set(prev)
      if (wasSelected) next.delete(catId)
      else next.add(catId)

      if (isSuperAdmin) {
        const catTools = toolsByCategory.get(catId) ?? []
        if (catTools.length > 0) {
          setLinkedToolAccess((lt) => {
            const np = { ...lt }
            for (const t of catTools) {
              np[t.id] = {
                toolRole: np[t.id]?.toolRole ?? 'user',
                enabled: !wasSelected,
              }
            }
            return np
          })
        }
      }

      return next
    })
  }

  const canSubmit = name.trim() && email.trim() && password.length >= 8

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={defaultRole === 'admin' ? 'Create New Admin' : 'Create New User'}
      width={520}
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending
              ? 'Creating...'
              : defaultRole === 'admin'
                ? 'Create Admin'
                : 'Create User'}
          </Button>
        </div>
      }
    >
      {error && (
        <div
          style={{
            background: C.dangerBg,
            color: C.danger,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {syncNotice && (
        <div
          style={{
            background: C.warningBg,
            color: C.warning,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          User created, but linked app sync reported: {syncNotice}
        </div>
      )}

      <Input
        label="Full Name"
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<User size={16} />}
      />
      <Input
        label="Email Address"
        type="email"
        placeholder="john@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail size={16} />}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Minimum 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={16} />}
      />

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: C.sand700,
          }}
        >
          {isSuperAdmin ? 'Category & Tool Access' : 'Assign Categories'}
        </label>
        {isSuperAdmin && (
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: C.sand600, lineHeight: 1.45 }}>
            Click a category to expand it, then tick the specific tools the user may access.
          </p>
        )}

        {isSuperAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {apiCategories.map((cat) => {
              const accent = C.sand500
              const IconComponent = getIconComponent(cat.icon)
              const catTools = toolsByCategory.get(cat.id) ?? []
              const selectedInCat = catTools.filter((t) => linkedToolAccess[t.id]?.enabled).length
              const isExpanded = expandedCategories.has(cat.id)
              const isCategoryChecked = selectedCategories.has(cat.id)
              const hasSelection = selectedInCat > 0 || isCategoryChecked
              return (
                <div
                  key={cat.id}
                  style={{
                    borderRadius: 10,
                    border: `1.5px solid ${hasSelection ? accent : C.sand200}`,
                    background: hasSelection ? `${accent}0D` : 'transparent',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleCategoryExpanded(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        toggleCategoryExpanded(cat.id)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      color: hasSelection ? C.coffee800 : C.sand700,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <button
                      type="button"
                      aria-label={isCategoryChecked ? `Remove category ${cat.name}` : `Add category ${cat.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategory(cat.id)
                      }}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `2px solid ${isCategoryChecked ? accent : C.sand200}`,
                        background: isCategoryChecked ? accent : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {isCategoryChecked && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <IconComponent size={16} color={hasSelection ? accent : C.sand600} />
                    <span style={{ flex: 1 }}>{cat.name}</span>
                    {catTools.length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: hasSelection ? C.coffee800 : C.sand300,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: hasSelection ? `${accent}22` : C.sand100,
                        }}
                      >
                        {selectedInCat}/{catTools.length}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        color: C.sand600,
                      }}
                    />
                  </div>
                  {isExpanded && (
                    <div
                      style={{
                        padding: '4px 12px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        borderTop: `1px solid ${C.sand100}`,
                      }}
                    >
                      {catTools.length === 0 ? (
                        <p style={{ margin: '10px 0 2px', fontSize: 12, color: C.sand300, fontStyle: 'italic' }}>
                          No tools in this category yet.
                        </p>
                      ) : (
                        catTools.map((tool) => {
                          const row = linkedToolAccess[tool.id] ?? { enabled: false, toolRole: 'user' as const }
                          const needsRolePicker = tool.slug ? ROLE_SYNC_SLUGS.has(tool.slug) : false
                          return (
                            <div
                              key={tool.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: `1px solid ${row.enabled ? accent : C.sand200}`,
                                background: row.enabled ? `${accent}12` : C.cardBg,
                                flexWrap: 'wrap',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: C.sand700,
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={row.enabled}
                                  onChange={() => toggleToolEnabled(tool.id)}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {tool.name}
                                </span>
                              </label>
                              {needsRolePicker && (
                                <select
                                  value={row.toolRole}
                                  disabled={!row.enabled}
                                  onChange={(e) => setToolRole(tool.id, e.target.value as 'user' | 'admin')}
                                  style={{
                                    padding: '5px 9px',
                                    borderRadius: 6,
                                    border: `1px solid ${C.sand200}`,
                                    fontSize: 12,
                                    fontFamily: 'inherit',
                                    background: C.cardBg,
                                    color: C.sand700,
                                    cursor: row.enabled ? 'pointer' : 'not-allowed',
                                    opacity: row.enabled ? 1 : 0.5,
                                  }}
                                >
                                  <option value="user">Role: User</option>
                                  <option value="admin">Role: Admin</option>
                                </select>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="tb-modal-cat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {apiCategories.map((cat) => {
              const tint = cat.colorToken || C.sand500
              const isSelected = selectedCategories.has(cat.id)
              const isDisabled = !adminCategoryIds.has(cat.id)
              const IconComponent = getIconComponent(cat.icon)
              return (
                <button
                  key={cat.id}
                  onClick={() => !isDisabled && toggleCategory(cat.id)}
                  disabled={isDisabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? tint : C.sand200}`,
                    background: isSelected ? `${tint}10` : 'transparent',
                    color: isDisabled ? C.sand200 : isSelected ? tint : C.sand600,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      border: `2px solid ${isSelected ? tint : C.sand200}`,
                      background: isSelected ? tint : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <IconComponent size={16} />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
