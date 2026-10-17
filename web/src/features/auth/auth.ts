import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../api/client'

export interface Credentials {
  email: string
  password: string
}

/** The signed-in owner, or null when signed out. */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const result = await api.GET('/api/auth/manage/info')
      if (result.response.status === 401) return null
      if (!result.response.ok) throw new ApiError(result.response.status, 'Could not check sign-in.')
      return result.data ?? null
    },
    retry: false,
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const result = await api.POST('/api/auth/login', {
        params: { query: { useCookies: true } },
        body: credentials,
      })
      if (!result.response.ok) throw new ApiError(result.response.status, 'Email or password is incorrect.')
    },
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const result = await api.POST('/api/auth/register', { body: credentials })
      if (!result.response.ok) {
        const errors = (result.error as { errors?: Record<string, string[]> } | undefined)?.errors
        throw new ApiError(result.response.status, errors ? Object.values(errors).flat().join(' ') : 'Could not create the account.')
      }
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.POST('/api/auth/logout')
    },
    onSuccess: () => queryClient.clear(),
  })
}
