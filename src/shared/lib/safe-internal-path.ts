const INTERNAL_BASE_URL = new URL("https://namatdang.invalid")

function hasControlCharacter(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || codePoint === 0x7f
  })
}

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback = "/",
) {
  const candidate = value?.trim()
  if (
    !candidate ||
    candidate.includes("\\") ||
    hasControlCharacter(candidate)
  ) {
    return fallback
  }

  let decodedCandidate: string
  try {
    decodedCandidate = decodeURIComponent(candidate)
  } catch {
    return fallback
  }

  if (
    decodedCandidate.includes("\\") ||
    decodedCandidate.startsWith("//") ||
    hasControlCharacter(decodedCandidate)
  ) {
    return fallback
  }

  try {
    const url = new URL(candidate, INTERNAL_BASE_URL)
    if (url.origin !== INTERNAL_BASE_URL.origin) return fallback

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
