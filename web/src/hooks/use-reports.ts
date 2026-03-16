import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { MonthlyBalanceReport } from '@/types/report'

export function useMonthlyBalance(year: number) {
  return useQuery<MonthlyBalanceReport>({
    queryKey: ['reports', 'monthly-balance', year],
    queryFn: () => apiFetch<MonthlyBalanceReport>(`/reports/monthly-balance?year=${year}`),
    enabled: year >= 2000,
  })
}
