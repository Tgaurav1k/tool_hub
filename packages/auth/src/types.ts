export interface AuthUser {
  id: string
  name: string
  avatarUrl?: string | null
  email: string
  role: 'superadmin' | 'admin' | 'user'
  status: 'active' | 'pending' | 'inactive'
  categoryAssignments?: {
    category: {
      id: string
      name: string
      icon: string
      colorToken: string
    }
  }[]
}
