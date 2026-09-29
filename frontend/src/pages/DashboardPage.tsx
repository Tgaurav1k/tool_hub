import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { C, SIDEBAR, CATEGORY_MAP, ROLES, type Role } from '@toolhub/config'
import {
  Sidebar, TopBar, ToolCard, KpiCard, CategoryChips, Button,
  SkeletonCard, EmptyState, type SidebarItem, type SidebarCategoryDropdownItem,
} from '@toolhub/ui'
import {
  Home, Settings, Wrench, FolderOpen, Clock, Star, Heart,
  Users, Activity, LayoutGrid, Plus,
} from 'lucide-react'
import type { AuthUser } from '@toolhub/auth'
import { useAppStore } from '../stores/appStore'
import { useAssignedTools } from '../hooks/useAssignedTools'
import { useToolLaunch } from '../hooks/useToolLaunch'
import { useFavorites } from '../hooks/useFavorites'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { useTopBarNotifications } from '../hooks/useTopBarNotifications'
import { getIcon } from '../utils/iconMap'
import ToolForm from '../components/ToolForm'
import type { Tool } from '@toolhub/api-client'

const PROTECTED_TOOL_SLUGS = new Set(['image-generation'])

/** Six core departments shown in the superadmin sidebar category dropdown (matches product categories). */
const SUPERADMIN_SIDEBAR_CATEGORY_KEYS = [
  'finance',
  'marketing',
  'content',
  'operations',
  'hr',
  'sales',
] as const

/** Slugs of tools that render with the premium/featured treatment (gradient border + priority sort). */
const PREMIUM_TOOL_SLUGS = new Set([
  'image-generation',
  'amazon-engine',
  'keyword-trend-engine',
  'docket-tool',
  'bigdata-db-editor',
  'xpensebuddy',
])

export default function DashboardPage() {
  const user = useAppStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <DashboardPageInner user={user} />
}

function DashboardPageInner({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const location = useLocation()

  const { activeCategory, searchQuery, setActiveCategory, setSearchQuery } = useAppStore()
  const showFavoritesOnly = useAppStore((s) => s.showFavoritesOnly)
  const setShowFavoritesOnly = useAppStore((s) => s.setShowFavoritesOnly)
  const { categories, tools, isLoading } = useAssignedTools()
  const { launch } = useToolLaunch()
  const { favoriteIds, toggle: toggleFavorite } = useFavorites()
  const [showToolForm, setShowToolForm] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const isMobile = useIsMobile()
  const canManageTools = user.role === 'superadmin'

  const openAddToolForm = () => {
    setEditingTool(null)
    setShowToolForm(true)
  }
  const openEditToolForm = (tool: Tool) => {
    setEditingTool(tool)
    setShowToolForm(true)
  }
  const closeToolForm = () => {
    setShowToolForm(false)
    setEditingTool(null)
  }

  const sidebarCollapsed = useSidebarCollapsed()
  const notificationProps = useTopBarNotifications()

  const [activeSidebarId, setActiveSidebarId] = useState('dashboard')

  const roleKey = (user.role ?? 'user') as Role
  const roleUi = ROLES[roleKey] ?? ROLES.user

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/users')) setActiveSidebarId('nav-users')
    else if (path.startsWith('/tools')) setActiveSidebarId('nav-tools')
    else if (path.startsWith('/activity')) setActiveSidebarId('nav-activity')
    else if (path.startsWith('/profile')) setActiveSidebarId('profile')
    else if (path.startsWith('/dashboard') || path === '/') {
      if (showFavoritesOnly) setActiveSidebarId('nav-favorites')
      else if (activeCategory) setActiveSidebarId(`cat-${activeCategory}`)
      else setActiveSidebarId('dashboard')
    } else setActiveSidebarId('dashboard')
  }, [location.pathname, activeCategory, showFavoritesOnly])

  const categoryDropdownItems: SidebarCategoryDropdownItem[] = useMemo(() => {
    if (user.role === 'superadmin') {
      return SUPERADMIN_SIDEBAR_CATEGORY_KEYS.map((key) => {
        const cfg = CATEGORY_MAP[key]
        const apiCat = categories.find((c) => c.name.toLowerCase() === key)
        if (!cfg || !apiCat) return null
        return {
          id: apiCat.id,
          label: cfg.name,
          icon: getIcon(cfg.icon, { size: 18 }),
        }
      }).filter(Boolean) as SidebarCategoryDropdownItem[]
    }
    return categories
      .filter((cat) => cat.name.toLowerCase() !== 'favorites')
      .map((cat) => {
        const cfgCat = CATEGORY_MAP[cat.name.toLowerCase() as keyof typeof CATEGORY_MAP]
        const iconName = cfgCat?.icon ?? cat.icon
        return {
          id: cat.id,
          label: cat.name,
          icon: getIcon(iconName, { size: 18 }),
        }
      })
  }, [categories, user.role])

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const items: SidebarItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    ]

    if (user.role === 'superadmin') {
      items.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-tools', label: 'Tool catalogue', icon: <Wrench size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    } else if (user.role === 'admin') {
      items.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    }

    items.push({
      id: 'nav-favorites',
      label: 'Favorites',
      icon: <Heart size={18} />,
    })

    items.push({
      id: 'profile',
      label: 'Profile',
      icon: <Settings size={18} />,
    })

    return items
  }, [categories, user.role])

  const handleSidebarClick = (id: string) => {
    setActiveSidebarId(id)
    if (id === 'nav-users') {
      navigate('/users')
      return
    }
    if (id === 'nav-tools') {
      navigate('/tools')
      return
    }
    if (id === 'nav-activity') {
      navigate('/activity')
      return
    }
    if (id === 'profile') {
      navigate('/profile')
      return
    }
    if (id === 'nav-favorites') {
      setShowFavoritesOnly(true)
      setActiveCategory(null)
      if (!location.pathname.startsWith('/dashboard')) {
        navigate('/dashboard')
      }
      return
    }
    if (id === 'dashboard') {
      navigate('/dashboard')
      setActiveCategory(null)
      setShowFavoritesOnly(false)
      return
    }
    if (id.startsWith('cat-')) {
      const catId = id.replace('cat-', '')
      setActiveCategory(catId)
      setShowFavoritesOnly(false)
      if (!location.pathname.startsWith('/dashboard')) {
        navigate('/dashboard')
      }
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  const filteredTools = useMemo(() => {
    const filtered = tools.filter((tool) => {
      if (showFavoritesOnly && !favoriteIds.has(tool.id)) return false
      if (activeCategory && tool.categoryId !== activeCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !tool.name.toLowerCase().includes(q) &&
          !tool.description.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
    return filtered.sort((a, b) => {
      const aP = PREMIUM_TOOL_SLUGS.has(a.slug ?? '') ? 1 : 0
      const bP = PREMIUM_TOOL_SLUGS.has(b.slug ?? '') ? 1 : 0
      return bP - aP
    })
  }, [tools, activeCategory, searchQuery, showFavoritesOnly, favoriteIds])

  const categoryChips = useMemo(() => {
    return categories
      .filter((cat) => cat.name.toLowerCase() !== 'favorites')
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        colorToken: cat.colorToken,
      }))
  }, [categories])

  const sidebarWidth = sidebarCollapsed ? SIDEBAR.collapsed : SIDEBAR.expanded

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>
      <Sidebar
        items={sidebarItems}
        activeId={activeSidebarId}
        onItemClick={handleSidebarClick}
        onLogout={handleLogout}
        userRole={user.role}
        categoryDropdown={
          categoryDropdownItems.length > 0
            ? {
                triggerLabel: 'Categories',
                triggerIcon: <LayoutGrid size={18} />,
                items: categoryDropdownItems,
                anchorItemId: user.role === 'superadmin' ? 'nav-tools' : 'nav-favorites',
              }
            : undefined
        }
      />

      <div
        className="tb-main"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopBar
          userName={user.name}
          userAvatarUrl={user.avatarUrl}
          userRole={roleUi.label}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          roleColor={roleUi.color}
          {...notificationProps}
        />

        <main className="tb-page" style={{ flex: 1, padding: '28px 32px 40px', overflow: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: C.sand300,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1
              className="tb-heading-lg"
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: C.coffee800,
                letterSpacing: '-0.02em',
                margin: '0 0 4px 0',
              }}
            >
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p style={{ fontSize: '13.5px', color: C.sand600, margin: 0 }}>
              You have access to{' '}
              <span style={{ color: C.sand700, fontWeight: 600 }}>
                {tools.length}
              </span>{' '}
              tools across{' '}
              <span style={{ color: C.sand700, fontWeight: 600 }}>
                {categories.length}
              </span>{' '}
              categories.
            </p>
          </div>

          <div
            className="tb-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            <KpiCard
              icon={<Wrench size={20} />}
              label="Available Tools"
              value={tools.length}
              sub="Across all your categories"
            />
            <KpiCard
              icon={<FolderOpen size={20} />}
              label="Categories"
              value={categories.length}
              sub="Assigned to your account"
            />
            <KpiCard
              icon={<Clock size={20} />}
              label="Used This Week"
              value={0}
              sub="Tool launches this week"
            />
            <KpiCard
              icon={<Heart size={20} />}
              label="Favorites"
              value={favoriteIds.size}
              sub="Pinned for quick access"
            />
          </div>

          <div
            className="tb-filter-row"
            style={{
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly)
                  if (!showFavoritesOnly) setActiveCategory(null)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: `1.5px solid ${showFavoritesOnly ? C.danger : C.sand200}`,
                  background: showFavoritesOnly ? `${C.danger}12` : 'transparent',
                  color: showFavoritesOnly ? C.danger : C.sand600,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <Heart size={14} fill={showFavoritesOnly ? C.danger : 'none'} />
                Favorites{favoriteIds.size > 0 ? ` (${favoriteIds.size})` : ''}
              </button>
              <CategoryChips
                categories={categoryChips}
                activeId={showFavoritesOnly ? null : activeCategory}
                onSelect={(id) => {
                  setActiveCategory(id)
                  setShowFavoritesOnly(false)
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: '12px', color: C.sand600 }}>
                Showing{' '}
                <span style={{ color: C.coffee800, fontWeight: 600 }}>
                  {filteredTools.length}
                </span>{' '}
                tools
              </span>
              {canManageTools && (
                <Button variant="primary" size="sm" onClick={openAddToolForm}>
                  <Plus size={14} style={{ marginRight: 6 }} />
                  Add Tool
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div
              className="tb-tool-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredTools.length === 0 ? (
            <EmptyState
              title="No tools found"
              description={
                searchQuery
                  ? 'Try a different search term or clear filters.'
                  : 'No tools are available in this category yet.'
              }
            />
          ) : (
            <div
              className="tb-tool-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px',
              }}
            >
              {filteredTools.map((tool) => {
                const cat = categories.find((c) => c.id === tool.categoryId)
                const isProtected = PROTECTED_TOOL_SLUGS.has(tool.slug ?? '')
                return (
                  <ToolCard
                    key={tool.id}
                    name={tool.name}
                    description={tool.description}
                    icon={getIcon(tool.icon)}
                    url={tool.url}
                    status={tool.status}
                    categoryColor={cat?.colorToken ?? C.sand500}
                    isFavorite={favoriteIds.has(tool.id)}
                    onToggleFavorite={() => toggleFavorite(tool.id)}
                    onLaunch={() => launch(tool.id, tool.url)}
                    featured
                    onEdit={
                      canManageTools && !isProtected
                        ? () => openEditToolForm(tool as Tool)
                        : undefined
                    }
                  />
                )
              })}
            </div>
          )}
        </main>
      </div>

      {canManageTools && (
        <ToolForm
          open={showToolForm}
          onClose={closeToolForm}
          tool={editingTool}
          defaultCategoryId={activeCategory ?? categories[0]?.id ?? ''}
        />
      )}
    </div>
  )
}
