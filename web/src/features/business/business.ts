import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'

export const fetchBusiness = async () => unwrap(await api.GET('/api/business'))

export function useBusiness() {
  return useQuery({ queryKey: ['business'], queryFn: fetchBusiness })
}

export function useSaveBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; staffCount: number; version?: number }) => unwrap(await api.PUT('/api/business', { body })),
    onSuccess: (business) => queryClient.setQueryData(['business'], business),
  })
}
