export type PaymentMethod = 'cash' | 'transfer' | 'other'

export type Contribution = {
  ID: number
  ContributorID: number
  CategoryID: number
  Amount: number
  Month: number
  Year: number
  PaymentDate: string
  PaymentMethod: PaymentMethod
  UserID: number
  CreatedAt: string
  UpdatedAt: string
}

// ContributionDetail is the response DTO enriched with contributor and category info via JOIN.
export type ContributionDetail = Contribution & {
  HouseNumber: string
  ContributorName: string
  Phone: string
  CategoryName: string
}

export type CreateContributionRequest = {
  contributor_id: number
  category_id: number
  amount: number
  month: number
  year: number
  payment_date: string
  payment_method: PaymentMethod
}

export type UpdateContributionRequest = CreateContributionRequest
