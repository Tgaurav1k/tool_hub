import { apiRequest } from '@toolhub/auth'
import type { ActivityLog, PaginatedResponse } from './types'

export async function getActivityLogs(params?: {
  page?: number
  limit?: number
  action?: string
  userId?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.action) searchParams.set('action', params.action)
  if (params?.userId) searchParams.set('userId', params.userId)

  const query = searchParams.toString()
  return apiRequest<PaginatedResponse<ActivityLog>>(`/activity${query ? `?${query}` : ''}`)
}

export async function logToolLaunch(toolId: string) {
  return apiRequest<{ log: ActivityLog }>('/activity', {
    method: 'POST',
    body: { toolId, action: 'tool_launch' },
  })
}
