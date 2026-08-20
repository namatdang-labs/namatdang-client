import { queryOptions } from "@tanstack/react-query"

import { apiClient } from "../../shared/api/client"

export type CurrentUser = {
  id: number
  email: string
  name: string
  phoneNumber: string
  role: "CONSUMER" | "OWNER"
  createdAt: string
  updatedAt: string
}

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<CurrentUser>("users/me"),
  })
