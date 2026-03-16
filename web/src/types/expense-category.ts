export type ExpenseCategory = {
  ID: number
  Name: string
  Description: string
  IsActive: boolean
  UserID: number
  CreatedAt: string
  UpdatedAt: string
}

export type CreateExpenseCategoryRequest = {
  name: string
  description: string
}

export type UpdateExpenseCategoryRequest = {
  name: string
  description: string
  is_active: boolean
}
