import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, must, unwrap, type ChangeDto, type SaveScenarioRequest } from '../../api/client'
import { useDebounced } from '../../lib/useDebounced'

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => must(await api.GET('/api/scenarios')),
  })
}

export function useScenario(id: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: async () => unwrap(await api.GET('/api/scenarios/{id}', { params: { path: { id: id! } } })),
    enabled: !!id,
  })
}

/** Results are recalculated by the API on every request; the browser only displays them. */
export function useScenarioResults(id: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', id, 'results'],
    queryFn: async () => must(await api.GET('/api/scenarios/{id}/results', { params: { path: { id: id! } } })),
    enabled: !!id,
  })
}

export function useAllScenarioResults(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['scenarios', id, 'results'],
      queryFn: async () => must(await api.GET('/api/scenarios/{id}/results', { params: { path: { id } } })),
    })),
  })
}

/** Live preview: runs unsaved changes on the server shortly after the owner stops typing. */
export function useSimulation(draft: { horizonMonths: number; changes: ChangeDto[] } | null) {
  const debounced = useDebounced(draft, 450)
  return useQuery({
    queryKey: ['simulate', debounced],
    queryFn: async () => must(await api.POST('/api/scenarios/simulate', { body: debounced! })),
    enabled: !!debounced && debounced.changes.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  })
}

export function useSaveScenario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: SaveScenarioRequest }) =>
      id
        ? must(await api.PUT('/api/scenarios/{id}', { params: { path: { id } }, body }))
        : must(await api.POST('/api/scenarios', { body })),
    onSuccess: (scenario) => {
      queryClient.setQueryData(['scenarios', scenario.id], scenario)
      return queryClient.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })
}

export function useDeleteScenario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.DELETE('/api/scenarios/{id}', { params: { path: { id } } })
      if (!result.response.ok) throw new Error('Could not delete the plan.')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenarios'] }),
  })
}
