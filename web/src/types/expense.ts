export type Expense = {
  ID: number
  UserID: number
  Description: string
  Amount: number
  CategoryID: number
  CategoryName: string
  Date: string
  CreatedAt: string
  UpdatedAt: string
}

export type PaginatedExpenses = {
  items: Expense[]
  total: number
  page: number
  page_size: number
}

export type ExpenseFilters = {
  date_from?: string
  date_to?: string
  category_id?: number
  search?: string
  page?: number
  page_size?: number
}

export type CreateExpenseRequest = {
  description: string
  amount: number
  category_id: number
  date: string
}

export type UpdateExpenseRequest = {
  description: string
  amount: number
  category_id: number
  date: string
}

export type ExpenseReceiptData = {
  folio: string
  expense_id: number
  description: string
  category_name: string
  amount: number
  date: string
  signer_name: string
  generated_at: string
}

export type ExpenseReceiptSignatureResponse = {
  folio: string
  data: ExpenseReceiptData
  signature: string
  certificate: string
}
