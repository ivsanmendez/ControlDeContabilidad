export type Contributor = {
  ID: number
  HouseNumber: string
  Name: string
  Phone: string
  UserID: number
  HouseID: number | null
  CreatedAt: string
  UpdatedAt: string
}

export type CreateContributorRequest = {
  house_number: string
  name: string
  phone: string
  house_id: number | null
}

export type UpdateContributorRequest = {
  house_number: string
  name: string
  phone: string
  house_id: number | null
}
