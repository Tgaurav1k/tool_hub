import { apiRequest } from '@toolhub/auth'
import type { User } from './types'

export async function getUsers() {
  return apiRequest<{ users: User[] }>('/users')
}

export async function getUserById(id: string) {
  return apiRequest<{ user: User; explicitToolIds: string[] }>(`/users/${id}`)
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: 'user' | 'admin'
  categoryIds?: string[]
  toolAssignments?: { toolId: string; toolRole: 'user' | 'admin' }[]
}) {
  return apiRequest<{
    user: User
    linkedToolSyncWarnings?: string[]
    emailWarning?: string | null
  }>('/users', { method: 'POST', body: data })
}

export async function updateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'status' | 'role'>>) {
  return apiRequest<{ user: User }>(`/users/${id}`, { method: 'PATCH', body: data })
}

export async function deleteUser(id: string) {
  return apiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE' })
}

export async function resetUserPassword(id: string, newPassword: string) {
  return apiRequest<{
    message: string
    resyncedToolCount: number
    linkedToolSyncWarnings: string[]
  }>(`/users/${id}/reset-password`, { method: 'POST', body: { newPassword } })
}

export async function updateMyProfile(data: { name?: string; avatarDataUrl?: string | null }) {
  return apiRequest<{ user: User }>('/users/me/profile', { method: 'PATCH', body: data })
}
