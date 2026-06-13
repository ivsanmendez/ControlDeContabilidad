import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { UserAdmin, HouseAssignment, CreateUserRequest, UpdateRoleRequest, UpdatePasswordRequest } from '@/types/user-admin'

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

export function useHouseUsers(houseID: number) {
  return useQuery<UserAdmin[]>({
    queryKey: ['house-users', houseID],
    queryFn: () => apiFetch<UserAdmin[]>(`/houses/${houseID}/users`),
    enabled: houseID > 0,
  })
}

export function useUserHouses(userID: number) {
  return useQuery<HouseAssignment[]>({
    queryKey: ['user-houses', userID],
    queryFn: () => apiFetch<HouseAssignment[]>(`/users/${userID}/houses`),
    enabled: userID > 0,
  })
}

export function useAssignHouseToUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userID, houseID }: { userID: number; houseID: number }) =>
      apiFetch<undefined>(`/users/${userID}/houses`, {
        method: 'POST',
        body: JSON.stringify({ house_id: houseID }),
      }),
    onSuccess: (_r, { userID }) => {
      queryClient.invalidateQueries({ queryKey: ['user-houses', userID] })
    },
  })
}

export function useUnassignHouseFromUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userID, houseID }: { userID: number; houseID: number }) =>
      apiFetch<undefined>(`/users/${userID}/houses/${houseID}`, { method: 'DELETE' }),
    onSuccess: (_r, { userID }) => {
      queryClient.invalidateQueries({ queryKey: ['user-houses', userID] })
    },
  })
}