import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type {
  AccessControl,
  AccessControlWithHouse,
  AccessControlStatus,
  CreateAccessControlRequest,
  UpdateAccessControlRequest,
} from '@/types/house'

export function useAllAccessControls() {
  return useQuery<AccessControlWithHouse[]>({
    queryKey: ['access-controls', 'all'],
    queryFn: () => apiFetch<AccessControlWithHouse[]>('/access-controls'),
  })
}

export function useAccessControls(houseID: number) {
  return useQuery<AccessControl[]>({
    queryKey: ['access-controls', houseID],
    queryFn: () => apiFetch<AccessControl[]>(`/houses/${houseID}/access-controls`),
    enabled: houseID > 0,
  })
}

export function usePendingSync() {
  return useQuery<AccessControl[]>({
    queryKey: ['access-controls', 'pending-sync'],
    queryFn: () => apiFetch<AccessControl[]>('/access-controls/pending-sync'),
  })
}

export function useCreateAccessControl(houseID: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAccessControlRequest) =>
      apiFetch<AccessControl>(`/houses/${houseID}/access-controls`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-controls', houseID] })
    },
  })
}

export function useUpdateAccessControl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccessControlRequest }) =>
      apiFetch<AccessControl>(`/access-controls/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['access-controls'] })
      queryClient.invalidateQueries({ queryKey: ['access-control', id] })
    },
  })
}

export function useChangeAccessControlStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AccessControlStatus }) =>
      apiFetch<AccessControl>(`/access-controls/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-controls'] })
    },
  })
}

export function useMarkAccessControlSynced() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<AccessControl>(`/access-controls/${id}/sync`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-controls'] })
      queryClient.invalidateQueries({ queryKey: ['access-controls', 'pending-sync'] })
    },
  })
}

export function useDeleteAccessControl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/access-controls/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-controls'] })
    },
  })
}

export function useLookupAccessControlByCode() {
  const [result, setResult] = useState<AccessControl | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const lookup = useCallback(async (code: string) => {
    setResult(null)
    setError(null)
    setIsLoading(true)
    try {
      const ac = await apiFetch<AccessControl>(
        `/access-controls/lookup?code=${encodeURIComponent(code)}`
      )
      setResult(ac)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { lookup, reset, result, error, isLoading }
}

export function useEvaluateHouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (houseID: number) =>
      apiFetch<undefined>('/access-controls/evaluate', {
        method: 'POST',
        body: JSON.stringify({ house_id: houseID }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-controls'] })
    },
  })
}