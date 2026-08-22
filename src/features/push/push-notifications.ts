import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app"
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging"

import { apiClient } from "../../shared/api/client"
import { registerPwaServiceWorker } from "../pwa/register-pwa"
import { getFirebaseMessagingConfig } from "./firebase-config"

const DEFAULT_NOTIFICATION_LINK = "/notifications"

export type PushNotificationSetupErrorCode =
  "CONFIG_MISSING" | "PERMISSION_DENIED" | "TOKEN_UNAVAILABLE" | "UNSUPPORTED"

export class PushNotificationSetupError extends Error {
  readonly code: PushNotificationSetupErrorCode

  constructor(code: PushNotificationSetupErrorCode) {
    super(code)
    this.name = "PushNotificationSetupError"
    this.code = code
  }
}

type PushDeviceType = "ANDROID" | "DESKTOP" | "IOS"

type PushTokenResponse = {
  id: number
  deviceType: PushDeviceType
  browser: string
  lastRegisteredAt: string
}

let stopForegroundMessages: (() => void) | null = null

function getFirebaseApp(firebaseOptions: FirebaseOptions) {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseOptions)
}

function detectPushDeviceType(): PushDeviceType {
  const userAgent = navigator.userAgent
  const isTouchMac =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1

  if (/android/i.test(userAgent)) return "ANDROID"
  if (/iPad|iPhone|iPod/i.test(userAgent) || isTouchMac) return "IOS"
  return "DESKTOP"
}

function detectBrowserName() {
  const userAgent = navigator.userAgent

  if (/Edg\//i.test(userAgent)) return "EDGE"
  if (/Firefox\//i.test(userAgent)) return "FIREFOX"
  if (/CriOS\//i.test(userAgent)) return "CHROME_IOS"
  if (/Chrome\//i.test(userAgent)) return "CHROME"
  if (/Safari\//i.test(userAgent)) return "SAFARI"
  return "OTHER"
}

function getSafeNotificationLink(value: string | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NOTIFICATION_LINK
  }

  const url = new URL(value, window.location.origin)
  if (url.origin !== window.location.origin) return DEFAULT_NOTIFICATION_LINK

  return `${url.pathname}${url.search}${url.hash}`
}

function showForegroundNotification(payload: MessagePayload) {
  if (Notification.permission !== "granted") return

  const title = payload.notification?.title?.trim() || "남았당 알림"
  const notification = new Notification(title, {
    body: payload.notification?.body,
    icon: "/brand/namatdang-icon.png",
    tag: payload.messageId,
  })

  notification.onclick = () => {
    window.focus()
    window.location.assign(getSafeNotificationLink(payload.data?.linkUrl))
    notification.close()
  }
}

function startForegroundMessageListener(
  messaging: ReturnType<typeof getMessaging>,
) {
  stopForegroundMessages?.()
  stopForegroundMessages = onMessage(messaging, showForegroundNotification)
}

export async function enablePushNotifications() {
  const config = getFirebaseMessagingConfig()
  if (!config) throw new PushNotificationSetupError("CONFIG_MISSING")

  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    !("serviceWorker" in navigator) ||
    !(await isSupported())
  ) {
    throw new PushNotificationSetupError("UNSUPPORTED")
  }

  if (Notification.permission === "denied") {
    throw new PushNotificationSetupError("PERMISSION_DENIED")
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission()
  if (permission !== "granted") {
    throw new PushNotificationSetupError("PERMISSION_DENIED")
  }

  const firebaseApp = getFirebaseApp(config.firebaseOptions)
  const messaging = getMessaging(firebaseApp)
  const serviceWorkerRegistration = await registerPwaServiceWorker()
  if (!serviceWorkerRegistration) {
    throw new PushNotificationSetupError("UNSUPPORTED")
  }
  const registrationToken = await getToken(messaging, {
    serviceWorkerRegistration,
    vapidKey: config.vapidKey,
  })

  if (!registrationToken) {
    throw new PushNotificationSetupError("TOKEN_UNAVAILABLE")
  }

  const pushToken = await apiClient.put<PushTokenResponse>("push-tokens", {
    registrationToken,
    deviceType: detectPushDeviceType(),
    browser: detectBrowserName(),
  })

  startForegroundMessageListener(messaging)
  return pushToken
}
