export type ContributionCategory = {
  ID: number
  Name: string
  Description: string
  IsActive: boolean
  UserID: number
  CreatedAt: string
  UpdatedAt: string
}

export type CreateCategoryRequest = {
  name: string
  description: string
}

export type UpdateCategoryRequest = {
  name: string
  description: string
  is_active: boolean
}
