import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { House, HouseDetail, CreateHouseRequest, UpdateHouseRequest } from '@/types/house'

export function useHouses() {
  return useQuery<House[]>({
    queryKey: ['houses'],
    queryFn: () => apiFetch<House[]>('/houses'),
  })
}

export function useHouse(id: number) {
  return useQuery<HouseDetail>({
    queryKey: ['houses', id],
    queryFn: () => apiFetch<HouseDetail>(`/houses/${id}`),
    enabled: id > 0,
  })
}

export function useCreateHouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHouseRequest) =>
      apiFetch<House>('/houses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] })
    },
  })
}

export function useUpdateHouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHouseRequest }) =>
      apiFetch<House>(`/houses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['houses'] })
      queryClient.invalidateQueries({ queryKey: ['houses', id] })
    },
  })
}

export function useDeleteHouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/houses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] })
    },
  })
}

export function useAssignContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ houseID, contributorID }: { houseID: number; contributorID: number }) =>
      apiFetch<undefined>(`/houses/${houseID}/contributors`, {
        method: 'POST',
        body: JSON.stringify({ contributor_id: contributorID }),
      }),
    onSuccess: (_result, { houseID }) => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseID] })
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

export function useUnassignContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ houseID, contributorID }: { houseID: number; contributorID: number }) =>
      apiFetch<undefined>(`/houses/${houseID}/contributors/${contributorID}`, { method: 'DELETE' }),
    onSuccess: (_result, { houseID }) => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseID] })
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}