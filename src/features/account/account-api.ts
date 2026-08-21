import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "../../shared/api/client"
import type { UserRole } from "../auth/auth-api"

export type CurrentUser = {
  id: number
  email: string
  name: string
  phoneNumber: string
  roles: UserRole[]
  createdAt: string
  updatedAt: string
}

export type UpdateCurrentUserRequest = {
  name: string
  phoneNumber: string
}

export function getCurrentUser() {
  return apiClient.get<CurrentUser>("/users/me")
}

export function updateCurrentUser(request: UpdateCurrentUserRequest) {
  return apiClient.patch<CurrentUser>("/users/me", request)
}

export function deleteCurrentUser() {
  return apiClient.delete<void>("/users/me")
}

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  })
