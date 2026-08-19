import { apiClient } from "../../shared/api/client"

export type UserRole = "CONSUMER" | "OWNER"

export type LoginRequestDto = {
  email: string
  password: string
}

export type LoginUserResponseDto = {
  id: number
  email: string
  name: string
  role: UserRole
}

export type LoginResponseDto = {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: number
  user: LoginUserResponseDto
}

export type SignupRequestDto = {
  email: string
  password: string
  name: string
  phoneNumber: string
}

export type SignupResponseDto = {
  id: number
  email: string
  name: string
  phoneNumber: string
  role: UserRole
}

export function login(request: LoginRequestDto) {
  return apiClient.post<LoginResponseDto>("/auth/login", request, {
    auth: false,
  })
}

export function signup(request: SignupRequestDto) {
  return apiClient.post<SignupResponseDto>("/auth/signup", request, {
    auth: false,
  })
}
