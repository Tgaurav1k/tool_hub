import { apiRequest } from '@toolhub/auth'
import type { CategoryAssignment } from './types'

export async function getUserAssignments(userId: string) {
  return apiRequest<{ assignments: CategoryAssignment[]; explicitToolIds: string[] }>(
    `/assignments/${userId}`,
  )
}

export async function assignCategories(
  userId: string,
  categoryIds: string[],
  explicitToolIds?: string[],
  options?: { suppressNotification?: boolean },
) {
  return apiRequest<{ assignments: CategoryAssignment[]; explicitToolIds: string[] }>(
    '/assignments',
    {
      method: 'POST',
      body: {
        userId,
        categoryIds,
        explicitToolIds,
        suppressNotification: options?.suppressNotification,
      },
    },
  )
}

export async function removeAssignment(userId: string, categoryId: string) {
  return apiRequest<{ message: string }>(`/assignments/${userId}/${categoryId}`, {
    method: 'DELETE',
  })
}
