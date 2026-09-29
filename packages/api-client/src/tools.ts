import { apiRequest } from '@toolhub/auth'
import type { Tool } from './types'

export async function getTools(
  categoryId?: string,
  opts?: { requiresToolAssignment?: boolean },
) {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoryId', categoryId)
  if (opts?.requiresToolAssignment) params.set('requiresToolAssignment', 'true')
  const q = params.toString()
  return apiRequest<{ tools: Tool[] }>(`/tools${q ? `?${q}` : ''}`)
}

export async function getToolById(id: string) {
  return apiRequest<{ tool: Tool }>(`/tools/${id}`)
}

export async function createTool(data: {
  name: string
  description: string
  url: string
  icon?: string
  categoryId: string
  status?: 'active' | 'inactive' | 'new'
  slug?: string | null
  requiresToolAssignment?: boolean
}) {
  return apiRequest<{ tool: Tool }>('/tools', { method: 'POST', body: data })
}

export async function updateTool(id: string, data: Partial<Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'category'>>) {
  return apiRequest<{ tool: Tool }>(`/tools/${id}`, { method: 'PATCH', body: data })
}

export async function deleteTool(id: string) {
  return apiRequest<{ message: string }>(`/tools/${id}`, { method: 'DELETE' })
}
