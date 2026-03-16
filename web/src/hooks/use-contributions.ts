import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ContributionDetail, CreateContributionRequest, UpdateContributionRequest } from '@/types/contribution'

export function useContributions(contributorId?: number, year?: number) {
  const params = new URLSearchParams()
  if (contributorId) params.set('contributor_id', String(contributorId))
  if (year) params.set('year', String(year))
  const qs = params.toString()

  return useQuery<ContributionDetail[]>({
    queryKey: ['contributions', contributorId ?? '', year ?? ''],
    queryFn: () => apiFetch<ContributionDetail[]>(`/contributions${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContributionRequest) =>
      apiFetch<ContributionDetail>('/contributions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] })
    },
  })
}

export function useUpdateContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContributionRequest }) =>
      apiFetch<ContributionDetail>(`/contributions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] })
    },
  })
}

export function useDeleteContribution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/contributions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] })
    },
  })
}
