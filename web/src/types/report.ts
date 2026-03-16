export type MonthSummary = {
  month: number
  income: number
  expenses: number
  balance: number
  cumulative_balance: number
}

export type MonthlyBalanceReport = {
  year: number
  months: MonthSummary[]
  total_income: number
  total_expenses: number
  total_balance: number
}
