import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap, type BaselineInput } from '../../api/client'

export function useBaseline() {
  return useQuery({
    queryKey: ['baseline'],
    queryFn: async () => unwrap(await api.GET('/api/baseline')),
  })
}

/** Calculated by the API's scenario engine; the browser only displays it. */
export function useBaselineSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['baseline', 'summary'],
    queryFn: async () => unwrap(await api.GET('/api/baseline/summary')),
    enabled,
  })
}

export function useSaveBaseline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: BaselineInput) => unwrap(await api.PUT('/api/baseline', { body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['baseline'] }).then(() =>
      queryClient.invalidateQueries({ queryKey: ['business'] })),
  })
}
