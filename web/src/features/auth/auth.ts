import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, must } from '../../api/client'

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

/** Deletes the account with the salon, its figures and every plan. */
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const result = await api.DELETE('/api/auth/account')
      if (!result.response.ok) throw new ApiError(result.response.status, 'Could not delete the account.')
    },
    onSuccess: () => queryClient.clear(),
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

/** Browsers signed in to this account, this device first. */
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => must(await api.GET('/api/auth/sessions')),
    staleTime: 60_000,
  })
}

/** Signs one other device out; it has to sign in again on its next request. */
export function useSignOutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.DELETE('/api/auth/sessions/{id}', { params: { path: { id } } })
      if (!result.response.ok && result.response.status !== 404) throw new ApiError(result.response.status, 'Could not sign out that device.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useSignOutOtherSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const result = await api.POST('/api/auth/sessions/sign-out-others')
      if (!result.response.ok) throw new ApiError(result.response.status, 'Could not sign out the other devices.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
