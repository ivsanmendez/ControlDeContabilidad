import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { MonthlyBalanceReport, HouseReport } from '@/types/report'

export function useHouseReport(houseID: number, year: number) {
  return useQuery<HouseReport>({
    queryKey: ['reports', 'house', houseID, year],
    queryFn: () => apiFetch<HouseReport>(`/houses/${houseID}/report?year=${year}`),
    enabled: houseID > 0 && year >= 2000,
  })
}

export function useMonthlyBalance(year: number) {
  return useQuery<MonthlyBalanceReport>({
    queryKey: ['reports', 'monthly-balance', year],
    queryFn: () => apiFetch<MonthlyBalanceReport>(`/reports/monthly-balance?year=${year}`),
    enabled: year >= 2000,
  })
}
