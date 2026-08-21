import { hasUserRole } from "./user-roles"

test("roles 배열에서 회원 권한을 확인한다", () => {
  expect(hasUserRole({ roles: ["CONSUMER"] }, "CONSUMER")).toBe(true)
  expect(hasUserRole({ roles: ["CONSUMER"] }, "OWNER")).toBe(false)
  expect(hasUserRole({ roles: ["CONSUMER", "OWNER"] }, "OWNER")).toBe(true)
})

test("이전 단일 role 응답은 현재 권한 계약으로 해석하지 않는다", () => {
  expect(hasUserRole({ role: "OWNER" }, "OWNER")).toBe(false)
})
