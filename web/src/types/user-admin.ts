export type UserAdmin = {
  id: number
  email: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export type UpdateRoleRequest = { role: 'user' | 'admin' }
export type UpdatePasswordRequest = { password: string }