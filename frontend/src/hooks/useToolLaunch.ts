import { useMutation } from '@tanstack/react-query'
import { activityApi } from '@toolhub/api-client'

export function useToolLaunch() {
  const mutation = useMutation({
    mutationFn: async ({ toolId, url }: { toolId: string; url: string }) => {
      await activityApi.logToolLaunch(toolId)
      window.open(url, '_blank')
    },
  })

  const launch = (toolId: string, url: string) => {
    mutation.mutate({ toolId, url })
  }

  return { launch, isLaunching: mutation.isPending }
}
