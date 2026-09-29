import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '@toolhub/api-client'

const QUERY_KEY = ['user-favorites'] as const

export function useFavorites() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await favoritesApi.getFavorites()
      return new Set(data.toolIds)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (toolId: string) => favoritesApi.toggleFavorite(toolId),
    onMutate: async (toolId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY })
      const prev = qc.getQueryData<Set<string>>(QUERY_KEY) ?? new Set()
      const next = new Set(prev)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      qc.setQueryData(QUERY_KEY, next)
      return { prev }
    },
    onError: (_err, _toolId, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    favoriteIds: query.data ?? new Set<string>(),
    isLoading: query.isLoading,
    toggle: toggleMutation.mutate,
  }
}
