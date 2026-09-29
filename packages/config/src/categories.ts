export interface CategoryConfig {
  id: string
  name: string
  icon: string
  tint: string
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'finance', name: 'Finance', icon: 'DollarSign', tint: '#B08D62' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', tint: '#4A7AB5' },
  { id: 'content', name: 'Content', icon: 'FileText', tint: '#6B5438' },
  { id: 'operations', name: 'Operations', icon: 'Settings', tint: '#D4932A' },
  { id: 'hr', name: 'HR', icon: 'Users', tint: '#5B8A55' },
  { id: 'sales', name: 'Sales', icon: 'TrendingUp', tint: '#9A7D5B' },
  { id: 'general', name: 'General', icon: 'LayoutGrid', tint: '#C4A87A' },
  { id: 'favorites', name: 'Favorites', icon: 'Star', tint: '#B08D62' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
