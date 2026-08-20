import { clientEnv } from "./env"
import {
  clearAccessToken,
  getAccessToken,
  notifyAuthenticationRequired,
} from "../../features/auth/auth-session"

type ApiRequestInit = Omit<RequestInit, "body" | "credentials"> & {
  auth?: boolean
  json?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown) {
    super(`API request failed with status ${status}`)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path: string) {
  return `${clientEnv.apiBaseUrl}/${path.replace(/^\/+/, "")}`
}

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined

  const text = await response.text()
  if (!text) return undefined

  const contentType = response.headers.get("content-type") ?? ""
  return contentType.includes("application/json") ? JSON.parse(text) : text
}

async function request<T>(path: string, init: ApiRequestInit = {}) {
  const { auth = true, json, ...fetchInit } = init
  const headers = new Headers(fetchInit.headers)
  const accessToken = auth ? getAccessToken() : null

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(buildUrl(path), {
    ...fetchInit,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
  })
  const payload = await parseResponse(response)

  if (!response.ok) {
    if (
      response.status === 401 &&
      auth &&
      accessToken &&
      getAccessToken() === accessToken
    ) {
      clearAccessToken()
      notifyAuthenticationRequired()
    }

    throw new ApiError(response.status, payload)
  }

  return payload as T
}

export const apiClient = {
  get: <T>(path: string, init?: ApiRequestInit) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, json?: unknown, init?: ApiRequestInit) =>
    request<T>(path, { ...init, method: "POST", json }),
  put: <T>(path: string, json?: unknown, init?: ApiRequestInit) =>
    request<T>(path, { ...init, method: "PUT", json }),
  patch: <T>(path: string, json?: unknown, init?: ApiRequestInit) =>
    request<T>(path, { ...init, method: "PATCH", json }),
  delete: <T>(path: string, init?: ApiRequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
}
