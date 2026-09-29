import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Sidebar, TopBar, CategoryChips, Badge, Button, EmptyState } from '@toolhub/ui'
import { C, SIDEBAR, APP_NAME, ANIMATION } from '@toolhub/config'
import { toolsApi, authApi, categoriesApi } from '@toolhub/api-client'
import type { Tool } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useAppSidebar } from '../hooks/useAppSidebar'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'
import ToolForm from '../components/ToolForm'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { getIconComponent } from '../utils/iconMap'

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: C.success, bg: '#EFF8F2' },
  inactive: { color: C.danger, bg: '#FDF0F0' },
  new: { color: C.info, bg: '#EBF3FA' },
}

export default function ToolsPage() {
  const user = useAppStore((s) => s.user)!
  const queryClient = useQueryClient()
  const sidebarCollapsed = useSidebarCollapsed()
  const { items: sidebarItems, categoryDropdown, activeId: sidebarActiveId, onItemClick: onSidebarClick } = useAppSidebar()
  const notificationProps = useTopBarNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [deletingTool, setDeletingTool] = useState<Tool | null>(null)

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  })

  const apiCategories = useMemo(() => {
    const list = categoriesRes?.categories ?? []
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).filter((c) => c.name !== 'Favorites')
  }, [categoriesRes?.categories])

  const { data } = useQuery({
    queryKey: ['tools', selectedCategory ?? 'all'],
    queryFn: () => toolsApi.getTools(selectedCategory ?? undefined),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.deleteTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      setDeletingTool(null)
    },
  })

  const tools = data?.tools ?? []

  const categoryChips = apiCategories.map((c) => ({
    id: c.id,
    name: c.name,
    colorToken: c.colorToken,
  }))

  const handleLogout = async () => {
    await authApi.logout()
    window.location.href = '/login'
  }

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTool(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>
      <Sidebar items={sidebarItems} activeId={sidebarActiveId} onItemClick={onSidebarClick} appName={APP_NAME} onLogout={handleLogout} categoryDropdown={categoryDropdown} userRole={user.role} />
      <div className="tb-main" style={{ flex: 1, marginLeft: sidebarCollapsed ? SIDEBAR.collapsed : SIDEBAR.expanded, transition: 'margin-left 0.3s ease' }}>
        <TopBar userName={user.name} userAvatarUrl={user.avatarUrl} userRole="Super Admin" search="" onSearchChange={() => {}} roleColor={C.sand500} {...notificationProps} />
        <motion.div
          className="tb-page"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION.pageDuration }}
          style={{ padding: '24px 32px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h1 className="tb-heading-lg" style={{ fontSize: 24, fontWeight: 700, color: C.coffee800 }}>Tool Catalogue</h1>
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Add Tool
            </Button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <CategoryChips
              categories={categoryChips}
              activeId={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {tools.length === 0 ? (
            <EmptyState title="No tools" description="No tools in this category yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tools.map((tool) => {
                const Icon = getIconComponent(tool.icon)
                const ss = STATUS_STYLES[tool.status] ?? STATUS_STYLES.active
                return (
                  <motion.div
                    key={tool.id}
                    className="tb-tool-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: C.cardBg,
                      borderRadius: 14,
                      padding: '18px 24px',
                      border: `1px solid ${C.sand100}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: C.sand100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={C.sand700} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: C.coffee800, fontSize: 15 }}>{tool.name}</span>
                        <Badge color={ss.color} bg={ss.bg} size="sm">{tool.status}</Badge>
                      </div>
                      <p style={{ color: C.sand600, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tool.description}
                      </p>
                    </div>

                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: C.sand500, display: 'flex', alignItems: 'center', textDecoration: 'none', fontSize: 13, gap: 4, flexShrink: 0 }}
                    >
                      <ExternalLink size={14} /> URL
                    </a>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleEdit(tool)}
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
                        <Pencil size={14} color={C.sand600} />
                      </button>
                      <button
                        onClick={() => setDeletingTool(tool)}
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
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <ToolForm
        open={showForm}
        onClose={handleFormClose}
        tool={editingTool}
        defaultCategoryId={selectedCategory ?? apiCategories[0]?.id ?? ''}
      />

      <ConfirmDeleteModal
        open={!!deletingTool}
        onClose={() => setDeletingTool(null)}
        onConfirm={() => deletingTool && deleteMutation.mutate(deletingTool.id)}
        title="Delete Tool"
        message={`Are you sure you want to delete "${deletingTool?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
