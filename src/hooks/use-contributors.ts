import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type {
  Contributor,
  CreateContributorRequest,
  UpdateContributorRequest,
} from '@/types/contributor'

export function useContributors() {
  return useQuery<Contributor[]>({
    queryKey: ['contributors'],
    queryFn: () => apiFetch<Contributor[]>('/contributors'),
  })
}

export function useContributor(id: number) {
  return useQuery<Contributor>({
    queryKey: ['contributors', id],
    queryFn: () => apiFetch<Contributor>(`/contributors/${id}`),
    enabled: id > 0,
  })
}

export function useCreateContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContributorRequest) =>
      apiFetch<Contributor>('/contributors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

export function useUpdateContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContributorRequest }) =>
      apiFetch<Contributor>(`/contributors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}

export function useDeleteContributor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/contributors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] })
    },
  })
}
