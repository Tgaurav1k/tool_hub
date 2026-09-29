import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Wrench, Activity, Heart, Settings } from 'lucide-react'
import type {
  SidebarItem,
  SidebarCategoryDropdownConfig,
  SidebarCategoryDropdownItem,
} from '@toolhub/ui'
import { CATEGORY_MAP } from '@toolhub/config'
import { useAppStore } from '../stores/appStore'
import { useCategories } from './useAssignedTools'
import { getIcon } from '../utils/iconMap'

/** Six core departments shown in the SuperAdmin sidebar category dropdown. */
const SUPERADMIN_SIDEBAR_CATEGORY_KEYS = [
  'finance',
  'marketing',
  'content',
  'operations',
  'hr',
  'sales',
] as const

/**
 * Builds the shared Toolhub sidebar (nav items, categories dropdown, active-id,
 * and click handler) so every page renders the same sidebar. Dashboard-specific
 * actions (pick a category, toggle favorites-only) write to the app store and
 * navigate to /dashboard.
 */
export function useAppSidebar(): {
  items: SidebarItem[]
  categoryDropdown: SidebarCategoryDropdownConfig | undefined
  activeId: string
  onItemClick: (id: string) => void
} {
  const user = useAppStore((s) => s.user)
  const activeCategory = useAppStore((s) => s.activeCategory)
  const showFavoritesOnly = useAppStore((s) => s.showFavoritesOnly)
  const setActiveCategory = useAppStore((s) => s.setActiveCategory)
  const setShowFavoritesOnly = useAppStore((s) => s.setShowFavoritesOnly)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: categories } = useCategories()

  const role = user?.role

  const items: SidebarItem[] = useMemo(() => {
    const out: SidebarItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    ]
    if (role === 'superadmin') {
      out.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-tools', label: 'Tool catalogue', icon: <Wrench size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    } else if (role === 'admin') {
      out.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    }
    out.push({ id: 'nav-favorites', label: 'Favorites', icon: <Heart size={18} /> })
    out.push({ id: 'profile', label: 'Profile', icon: <Settings size={18} /> })
    return out
  }, [role])

  const categoryDropdown: SidebarCategoryDropdownConfig | undefined = useMemo(() => {
    const list = Array.isArray(categories) ? categories : []
    let dropdownItems: SidebarCategoryDropdownItem[] = []
    if (role === 'superadmin') {
      dropdownItems = SUPERADMIN_SIDEBAR_CATEGORY_KEYS.map((key) => {
        const cfg = CATEGORY_MAP[key]
        const apiCat = list.find((c) => c.name.toLowerCase() === key)
        if (!cfg || !apiCat) return null
        return {
          id: apiCat.id,
          label: cfg.name,
          icon: getIcon(cfg.icon, { size: 18 }),
        }
      }).filter(Boolean) as SidebarCategoryDropdownItem[]
    } else {
      dropdownItems = list
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
    }
    if (dropdownItems.length === 0) return undefined
    return {
      triggerLabel: 'Categories',
      triggerIcon: <Wrench size={18} aria-hidden />,
      items: dropdownItems,
      anchorItemId: role === 'superadmin' ? 'nav-tools' : 'nav-favorites',
    }
  }, [categories, role])

  const activeId = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/users')) return 'nav-users'
    if (path.startsWith('/tools')) return 'nav-tools'
    if (path.startsWith('/activity')) return 'nav-activity'
    if (path.startsWith('/profile')) return 'profile'
    if (path.startsWith('/dashboard') || path === '/') {
      if (showFavoritesOnly) return 'nav-favorites'
      if (activeCategory) return `cat-${activeCategory}`
      return 'dashboard'
    }
    return 'dashboard'
  }, [location.pathname, activeCategory, showFavoritesOnly])

  const onItemClick = (id: string) => {
    if (id === 'nav-users') return void navigate('/users')
    if (id === 'nav-tools') return void navigate('/tools')
    if (id === 'nav-activity') return void navigate('/activity')
    if (id === 'profile') return void navigate('/profile')
    if (id === 'nav-favorites') {
      setShowFavoritesOnly(true)
      setActiveCategory(null)
      if (!location.pathname.startsWith('/dashboard')) navigate('/dashboard')
      return
    }
    if (id === 'dashboard') {
      setShowFavoritesOnly(false)
      setActiveCategory(null)
      navigate('/dashboard')
      return
    }
    if (id.startsWith('cat-')) {
      const catId = id.slice(4)
      setActiveCategory(catId)
      setShowFavoritesOnly(false)
      if (!location.pathname.startsWith('/dashboard')) navigate('/dashboard')
      return
    }
  }

  return { items, categoryDropdown, activeId, onItemClick }
}
