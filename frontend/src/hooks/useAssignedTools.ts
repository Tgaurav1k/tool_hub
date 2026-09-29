import { useQuery } from '@tanstack/react-query'
import { categoriesApi, type Category, type Tool } from '@toolhub/api-client'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    select: (raw) => (Array.isArray(raw?.categories) ? raw.categories : []),
  })
}

export function useAssignedTools() {
  const categoriesQuery = useCategories()
  const categoriesList: Category[] = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []
  const categoryIds = categoriesList.map((c) => c.id)

  const toolsQuery = useQuery({
    queryKey: ['assigned-tools', categoryIds],
    queryFn: async () => {
      if (categoriesList.length === 0) return [] as Tool[]
      const results = await Promise.all(
        categoriesList.map((cat) => categoriesApi.getCategoryTools(cat.id)),
      )
      return results.flatMap((r) => r.category.tools)
    },
    enabled: categoriesQuery.isSuccess && categoriesList.length > 0,
  })

  return {
    categories: categoriesList,
    tools: Array.isArray(toolsQuery.data) ? toolsQuery.data : [],
    isLoading: categoriesQuery.isLoading || toolsQuery.isLoading,
  }
}
