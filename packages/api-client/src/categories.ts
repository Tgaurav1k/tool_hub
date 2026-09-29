import { apiRequest } from '@toolhub/auth'
import type { Category, Tool } from './types'

export async function getCategories() {
  return apiRequest<{ categories: Category[] }>('/categories')
}

export async function getCategoryTools(categoryId: string) {
  return apiRequest<{ category: Category & { tools: Tool[] } }>(`/categories/${categoryId}/tools`)
}
