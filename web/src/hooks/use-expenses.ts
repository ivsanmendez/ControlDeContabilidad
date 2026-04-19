import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Expense, PaginatedExpenses, ExpenseFilters, CreateExpenseRequest, UpdateExpenseRequest } from '@/types/expense'

export function useExpense(id: number) {
  return useQuery<Expense>({
    queryKey: ['expense', id],
    queryFn: () => apiFetch<Expense>(`/expenses/${id}`),
    enabled: id > 0,
  })
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery<PaginatedExpenses>({
    queryKey: ['expenses', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.page) params.set('page', String(filters.page))
      if (filters.page_size) params.set('page_size', String(filters.page_size))
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.category_id) params.set('category_id', String(filters.category_id))
      if (filters.search) params.set('search', filters.search)
      const qs = params.toString()
      return apiFetch<PaginatedExpenses>(`/expenses${qs ? `?${qs}` : ''}`)
    },
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

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateExpenseRequest }) =>
      apiFetch<Expense>(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense', id] })
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
