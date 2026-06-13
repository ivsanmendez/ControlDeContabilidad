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
  CameraAccess: boolean
  CameraEmail: string
  CameraPhone: string
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

export type AccessControlStatus = 'active' | 'warning' | 'inactive'

export type AccessControl = {
  ID: number
  HouseID: number
  Code: string
  AdminNumber: string
  Status: AccessControlStatus
  PhysicalSyncedAt: string | null
  Notes: string
  CreatedAt: string
  UpdatedAt: string
}

export type AccessControlWithHouse = AccessControl & {
  HouseName: string
}

export type CreateAccessControlRequest = {
  code: string
  admin_number: string
  notes: string
}

export type UpdateAccessControlRequest = {
  code: string
  admin_number: string
  notes: string
}

export type ChangeAccessControlStatusRequest = {
  status: AccessControlStatus
}

export type VehicleAccessControlEntry = {
  AccessControlID: number
  Code: string
  AdminNumber: string
  AssignedAt: string
}

export type Vehicle = {
  ID: number
  HouseID: number
  Plate: string
  Color: string
  Brand: string
  Model: string
  Notes: string
  CreatedAt: string
  UpdatedAt: string
  AccessControls: VehicleAccessControlEntry[] | null
}

export type CreateVehicleRequest = {
  plate: string
  color: string
  brand: string
  model: string
  notes: string
}

export type UpdateVehicleRequest = {
  plate: string
  color: string
  brand: string
  model: string
  notes: string
}