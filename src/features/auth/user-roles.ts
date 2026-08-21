import type { UserRole } from "./auth-api"

type UserWithRoles = {
  roles?: unknown
}

export function hasUserRole(user: unknown, role: UserRole) {
  if (!user || typeof user !== "object") return false

  const { roles } = user as UserWithRoles

  return Array.isArray(roles) && roles.includes(role)
}
