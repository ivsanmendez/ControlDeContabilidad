import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from '@/types/house'

export function useVehicles(houseID: number) {
  return useQuery<Vehicle[]>({
    queryKey: ['vehicles', houseID],
    queryFn: () => apiFetch<Vehicle[]>(`/houses/${houseID}/vehicles`),
    enabled: houseID > 0,
  })
}

export function useCreateVehicle(houseID: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVehicleRequest) =>
      apiFetch<Vehicle>(`/houses/${houseID}/vehicles`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', houseID] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVehicleRequest }) =>
      apiFetch<Vehicle>(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useAssignAccessControl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleID, controlID }: { vehicleID: number; controlID: number }) =>
      apiFetch<undefined>(`/vehicles/${vehicleID}/access-controls/${controlID}`, {
        method: 'POST',
      }),
    onSuccess: (_result, { vehicleID }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleID] })
    },
  })
}

export function useUnassignAccessControl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleID, controlID }: { vehicleID: number; controlID: number }) =>
      apiFetch<undefined>(`/vehicles/${vehicleID}/access-controls/${controlID}`, {
        method: 'DELETE',
      }),
    onSuccess: (_result, { vehicleID }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleID] })
    },
  })
}