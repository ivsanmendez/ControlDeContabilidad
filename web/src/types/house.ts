export type House = {
  ID: number
  Name: string
  Address: string
  Notes: string
  CreatedAt: string
  UpdatedAt: string
}

export type ContributorSummary = {
  ID: number
  Name: string
  HouseNumber: string
  Phone: string
}

export type HouseDetail = House & {
  Contributors: ContributorSummary[] | null
}

export type CreateHouseRequest = {
  name: string
  address: string
  notes: string
}

export type UpdateHouseRequest = {
  name: string
  address: string
  notes: string
}