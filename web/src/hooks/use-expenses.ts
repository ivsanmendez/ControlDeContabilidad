import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Expense, CreateExpenseRequest } from '@/types/expense'

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => apiFetch<Expense[]>('/expenses'),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) =>
      apiFetch<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<undefined>(`/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
