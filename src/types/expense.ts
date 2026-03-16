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

export type CreateExpenseRequest = {
  description: string
  amount: number
  category_id: number
  date: string
}
