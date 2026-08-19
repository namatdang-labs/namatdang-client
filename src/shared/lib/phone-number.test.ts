import { describe, expect, test } from "vitest"
import { formatKoreanPhoneNumber } from "./phone-number"

describe("formatKoreanPhoneNumber", () => {
  test.each([
    ["", ""],
    ["010", "010"],
    ["0101", "010-1"],
    ["01012345678", "010-1234-5678"],
    ["0101234567", "010-123-4567"],
    ["0212345678", "02-1234-5678"],
    ["021234567", "02-123-4567"],
    ["0311234567", "031-123-4567"],
    ["(010) 1234-5678", "010-1234-5678"],
    ["01012345678999", "010-1234-5678"],
  ])("%s를 %s로 포맷한다", (input, expected) => {
    expect(formatKoreanPhoneNumber(input)).toBe(expected)
  })
})
