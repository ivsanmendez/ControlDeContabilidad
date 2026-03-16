export type User = {
  id: number
  email: string
  role: string
}

export type TokenPair = {
  access_token: string
  refresh_token: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
}

export type RefreshRequest = {
  refresh_token: string
}

export type LogoutRequest = {
  refresh_token: string
}

export type ApiError = {
  error: string
}
