import { apiRequest } from '@toolhub/auth'

export interface RoleRow {
  slug: string
  label: string
  description: string | null
  sortOrder: number
}

export async function getRoles() {
  return apiRequest<{ roles: RoleRow[] }>('/roles')
}
