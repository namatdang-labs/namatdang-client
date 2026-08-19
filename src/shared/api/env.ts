const DEFAULT_API_BASE_URL = "/api"

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "")
  return trimmed || DEFAULT_API_BASE_URL
}

export const clientEnv = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  ),
})
