export type Contributor = {
  ID: number
  HouseNumber: string
  Name: string
  Phone: string
  UserID: number
  HouseID: number | null
  CameraAccess: boolean
  CameraEmail: string
  CameraPhone: string
  CreatedAt: string
  UpdatedAt: string
}

export type CreateContributorRequest = {
  house_number: string
  name: string
  phone: string
  house_id: number | null
  camera_access: boolean
  camera_email: string
  camera_phone: string
}

export type UpdateContributorRequest = {
  house_number: string
  name: string
  phone: string
  house_id: number | null
  camera_access: boolean
  camera_email: string
  camera_phone: string
}
