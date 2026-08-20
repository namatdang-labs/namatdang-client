import { ApiError } from "../../shared/api/client"

type ErrorPayload = {
  message?: unknown
}

function hasMessage(payload: unknown): payload is ErrorPayload {
  return typeof payload === "object" && payload !== null && "message" in payload
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && hasMessage(error.payload)) {
    const message = error.payload.message

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  if (error instanceof TypeError) {
    return "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."
  }

  return fallback
}
