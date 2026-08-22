import { afterEach, beforeEach, expect, test, vi } from "vitest"

const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
)

function stubFirebaseEnv() {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "test-api-key")
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com")
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "test-project")
  vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "test.appspot.com")
  vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "123456789")
  vi.stubEnv("VITE_FIREBASE_APP_ID", "1:123456789:web:test")
  vi.stubEnv("VITE_FIREBASE_VAPID_KEY", "test-vapid-key")
}

beforeEach(() => {
  vi.resetModules()
  stubFirebaseEnv()
})

afterEach(() => {
  vi.unstubAllEnvs()

  if (originalServiceWorkerDescriptor) {
    Object.defineProperty(
      navigator,
      "serviceWorker",
      originalServiceWorkerDescriptor,
    )
  } else {
    Reflect.deleteProperty(navigator, "serviceWorker")
  }
})

test("Firebase 설정을 포함해 PWA 서비스 워커를 등록한다", async () => {
  const serviceWorkerRegistration = { scope: "http://localhost:5173/" }
  const register = vi.fn(async () => serviceWorkerRegistration)
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  })

  const { registerPwaServiceWorker } = await import("./register-pwa")

  await expect(registerPwaServiceWorker()).resolves.toBe(
    serviceWorkerRegistration,
  )
  expect(register).toHaveBeenCalledWith(
    expect.stringMatching(
      /^\/firebase-messaging-sw\.js\?.*apiKey=test-api-key/,
    ),
    { scope: "/" },
  )
})

test("서비스 워커를 지원하지 않는 브라우저에서는 등록하지 않는다", async () => {
  Reflect.deleteProperty(navigator, "serviceWorker")

  const { registerPwaServiceWorker } = await import("./register-pwa")

  await expect(registerPwaServiceWorker()).resolves.toBeNull()
})
