import type { FirebaseOptions } from "firebase/app"

import { getFirebaseMessagingConfig } from "../push/firebase-config"

const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js"

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration> | null =
  null

function buildServiceWorkerUrl(firebaseOptions?: FirebaseOptions) {
  const serviceWorkerUrl = new URL(SERVICE_WORKER_PATH, window.location.origin)

  if (firebaseOptions) {
    Object.entries(firebaseOptions).forEach(([key, value]) => {
      if (typeof value === "string" && value) {
        serviceWorkerUrl.searchParams.set(key, value)
      }
    })
  }

  if (import.meta.env.DEV) {
    serviceWorkerUrl.searchParams.set("development", "true")
  }

  return `${serviceWorkerUrl.pathname}${serviceWorkerUrl.search}`
}

export function registerPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve(null)
  }

  serviceWorkerRegistrationPromise ??= navigator.serviceWorker
    .register(
      buildServiceWorkerUrl(getFirebaseMessagingConfig()?.firebaseOptions),
      { scope: "/" },
    )
    .catch((error: unknown) => {
      serviceWorkerRegistrationPromise = null
      throw error
    })

  return serviceWorkerRegistrationPromise
}
