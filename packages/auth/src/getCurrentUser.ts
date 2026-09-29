import { apiRequest } from './apiRequest'
import type { AuthUser } from './types'

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await apiRequest<{ user: AuthUser }>('/auth/me')
    return data.user
  } catch {
    return null
  }
}
