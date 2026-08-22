import { afterEach, beforeEach, expect, test, vi } from "vitest"

const firebaseMocks = vi.hoisted(() => ({
  apiPut: vi.fn(),
  getMessaging: vi.fn(() => ({ name: "messaging" })),
  getToken: vi.fn(),
  initializeApp: vi.fn(() => ({ name: "app" })),
  isSupported: vi.fn(),
  onMessage: vi.fn(() => vi.fn()),
}))

vi.mock("firebase/app", () => ({
  getApp: vi.fn(),
  getApps: vi.fn(() => []),
  initializeApp: firebaseMocks.initializeApp,
}))

vi.mock("firebase/messaging", () => ({
  getMessaging: firebaseMocks.getMessaging,
  getToken: firebaseMocks.getToken,
  isSupported: firebaseMocks.isSupported,
  onMessage: firebaseMocks.onMessage,
}))

vi.mock("../../shared/api/client", () => ({
  apiClient: {
    put: firebaseMocks.apiPut,
  },
}))

const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
)

function stubNotification(permission: NotificationPermission) {
  class NotificationStub {
    static permission = permission
    static requestPermission = vi.fn(async () => permission)
  }

  vi.stubGlobal("Notification", NotificationStub)
}

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
  vi.clearAllMocks()
  stubFirebaseEnv()
  firebaseMocks.isSupported.mockResolvedValue(true)
  firebaseMocks.getToken.mockResolvedValue("test-registration-token")
  firebaseMocks.apiPut.mockResolvedValue({
    id: 1,
    deviceType: "DESKTOP",
    browser: "OTHER",
    lastRegisteredAt: "2026-08-22T10:00:00",
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()

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

test("권한을 허용하면 FCM 토큰을 백엔드에 등록한다", async () => {
  const serviceWorkerRegistration = { scope: "http://localhost:3000/" }
  const register = vi.fn(async () => serviceWorkerRegistration)
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  })
  stubNotification("granted")

  const { enablePushNotifications } = await import("./push-notifications")

  await expect(enablePushNotifications()).resolves.toMatchObject({ id: 1 })
  expect(register).toHaveBeenCalledWith(
    expect.stringContaining("/firebase-messaging-sw.js?"),
    { scope: "/" },
  )
  expect(firebaseMocks.getToken).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      serviceWorkerRegistration,
      vapidKey: "test-vapid-key",
    }),
  )
  expect(firebaseMocks.apiPut).toHaveBeenCalledWith("push-tokens", {
    registrationToken: "test-registration-token",
    deviceType: "DESKTOP",
    browser: expect.any(String),
  })
  expect(firebaseMocks.onMessage).toHaveBeenCalledOnce()
})

test("브라우저 알림 권한이 차단되면 토큰을 요청하지 않는다", async () => {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn() },
  })
  stubNotification("denied")

  const { enablePushNotifications } = await import("./push-notifications")

  await expect(enablePushNotifications()).rejects.toEqual(
    expect.objectContaining({
      code: "PERMISSION_DENIED",
    }),
  )
  expect(firebaseMocks.getToken).not.toHaveBeenCalled()
  expect(firebaseMocks.apiPut).not.toHaveBeenCalled()
})
