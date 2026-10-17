import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'

export function useBusiness() {
  return useQuery({
    queryKey: ['business'],
    queryFn: async () => unwrap(await api.GET('/api/business')),
  })
}

export function useSaveBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; staffCount: number }) => unwrap(await api.PUT('/api/business', { body })),
    onSuccess: (business) => queryClient.setQueryData(['business'], business),
  })
}
