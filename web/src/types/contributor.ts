export type Contributor = {
  ID: number
  HouseNumber: string
  Name: string
  Phone: string
  UserID: number
  CreatedAt: string
  UpdatedAt: string
}

export type CreateContributorRequest = {
  house_number: string
  name: string
  phone: string
}

export type UpdateContributorRequest = {
  name: string
  phone: string
}
