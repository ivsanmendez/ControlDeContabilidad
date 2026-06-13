import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { UserAdmin, CreateUserRequest, UpdateRoleRequest, UpdatePasswordRequest } from '@/types/user-admin'

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      apiFetch<UserAdmin>('/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUsers() {
  return useQuery<UserAdmin[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserAdmin[]>('/users'),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) =>
      apiFetch<UserAdmin>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePasswordRequest }) =>
      apiFetch<undefined>(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify(data) }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}