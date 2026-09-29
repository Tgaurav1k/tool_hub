import { apiRequest } from '@toolhub/auth'
import type { UserToolAssignmentRow } from './types'

export async function getUserToolAssignments(userId: string) {
  return apiRequest<{ assignments: UserToolAssignmentRow[] }>(`/tool-assignments/${userId}`)
}

export async function syncUserToolAssignments(
  userId: string,
  toolAssignments: { toolId: string; toolRole: 'user' | 'admin' }[],
  password?: string,
) {
  return apiRequest<{ assignments: UserToolAssignmentRow[]; syncWarnings?: string[] }>(
    `/tool-assignments/${userId}`,
    {
      method: 'PUT',
      body: { toolAssignments, ...(password ? { password } : {}) },
    },
  )
}
