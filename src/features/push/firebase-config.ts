import type { FirebaseOptions } from "firebase/app"

type FirebaseMessagingConfig = {
  firebaseOptions: FirebaseOptions
  vapidKey: string
}

function optionalValue(value: string | undefined) {
  return value?.trim() || undefined
}

export function getFirebaseMessagingConfig(): FirebaseMessagingConfig | null {
  const apiKey = optionalValue(import.meta.env.VITE_FIREBASE_API_KEY)
  const projectId = optionalValue(import.meta.env.VITE_FIREBASE_PROJECT_ID)
  const messagingSenderId = optionalValue(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  )
  const appId = optionalValue(import.meta.env.VITE_FIREBASE_APP_ID)
  const vapidKey = optionalValue(import.meta.env.VITE_FIREBASE_VAPID_KEY)

  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return null
  }

  return {
    firebaseOptions: {
      apiKey,
      authDomain: optionalValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
      projectId,
      storageBucket: optionalValue(
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      ),
      messagingSenderId,
      appId,
    },
    vapidKey,
  }
}
