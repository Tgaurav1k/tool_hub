export interface User {
  id: string
  name: string
  avatarUrl?: string | null
  email: string
  role: 'superadmin' | 'admin' | 'user'
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
  createdById?: string
  categoryAssignments?: CategoryAssignment[]
  toolAssignments?: UserToolAssignmentRow[]
}

export interface Category {
  id: string
  name: string
  icon: string
  colorToken: string
  sortOrder: number
  toolCount?: number
}

export interface Tool {
  id: string
  name: string
  description: string
  url: string
  icon: string
  status: 'active' | 'inactive' | 'new'
  slug?: string | null
  requiresToolAssignment?: boolean
  categoryId: string
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface UserToolAssignmentRow {
  id: string
  userId: string
  toolId: string
  toolRole: 'user' | 'admin'
  assignedAt: string
  tool: { id: string; name: string; slug?: string | null }
}

export interface CategoryAssignment {
  id: string
  userId: string
  categoryId: string
  assignedAt: string
  /** When true, only listed `UserToolAllow` tools in this category are visible to the user. */
  restrictStandardTools?: boolean
  category: Category
  assignedBy?: { id: string; name: string }
}

export interface ActivityLog {
  id: string
  userId: string
  toolId?: string
  action: 'login' | 'logout' | 'tool_launch'
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: { id: string; name: string; email: string; role: string }
  tool?: { id: string; name: string; url: string; category?: { name: string } }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
