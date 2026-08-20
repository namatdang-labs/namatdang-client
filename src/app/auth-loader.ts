import { redirect, type LoaderFunctionArgs } from "react-router"

import {
  clearAccessToken,
  hasUsableAccessToken,
} from "../features/auth/auth-session"

export function requireAuthentication({ request }: LoaderFunctionArgs) {
  if (hasUsableAccessToken()) return null

  clearAccessToken()

  const requestUrl = new URL(request.url)
  const redirectTo = `${requestUrl.pathname}${requestUrl.search}`

  return redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
}
