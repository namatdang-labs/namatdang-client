import type { ChangeEvent } from "react"

const MAX_KOREAN_PHONE_DIGITS = 11

function positionAfterDigits(value: string, digitCount: number) {
  if (digitCount <= 0) return 0

  let seenDigits = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seenDigits += 1
    if (seenDigits === digitCount) return index + 1
  }

  return value.length
}

export function formatKoreanPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, MAX_KOREAN_PHONE_DIGITS)

  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, -4)}-${digits.slice(-4)}`
    }

    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function handlePhoneNumberChange(
  event: ChangeEvent<HTMLInputElement>,
  onChange: (event: ChangeEvent<HTMLInputElement>) => unknown,
) {
  const input = event.currentTarget
  const selectionStart = input.selectionStart ?? input.value.length
  const digitsBeforeCaret = input.value
    .slice(0, selectionStart)
    .replace(/\D/g, "").length

  input.value = formatKoreanPhoneNumber(input.value)
  const result = onChange(event)

  const nextCaret = positionAfterDigits(input.value, digitsBeforeCaret)
  input.setSelectionRange(nextCaret, nextCaret)

  return result
}
