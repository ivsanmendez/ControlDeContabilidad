export type ContributorMonthlyPayment = {
  month: number
  amount: number
}

export type ContributorReport = {
  contributor_id: number
  name: string
  house_number: string
  phone: string
  camera_access: boolean
  total_paid: number
  payments: ContributorMonthlyPayment[]
}

export type HouseMonthSummary = {
  month: number
  income: number
}

export type HouseReport = {
  house_id: number
  house_name: string
  house_address: string
  year: number
  contributors: ContributorReport[]
  months: HouseMonthSummary[]
  total_income: number
}

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
