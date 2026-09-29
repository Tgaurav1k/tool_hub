import { apiRequest } from '@toolhub/auth'

export async function getFavorites() {
  return apiRequest<{ toolIds: string[] }>('/favorites')
}

export async function toggleFavorite(toolId: string) {
  return apiRequest<{ favorited: boolean; toolId: string }>(`/favorites/${toolId}`, {
    method: 'POST',
  })
}

export async function removeFavorite(toolId: string) {
  return apiRequest<{ favorited: boolean; toolId: string }>(`/favorites/${toolId}`, {
    method: 'DELETE',
  })
}
