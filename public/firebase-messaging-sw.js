/* global URL, caches, clients, fetch, firebase, importScripts, self */

const CACHE_NAME = "namatdang-app-shell-v1"
const CACHE_PREFIX = "namatdang-app-shell-"
const scriptUrl = new URL(self.location.href)
const isDevelopment = scriptUrl.searchParams.get("development") === "true"
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/brand/pwa-icon-192.png",
  "/brand/pwa-icon-512.png",
]

self.addEventListener("install", (event) => {
  if (isDevelopment) {
    self.skipWaiting()
    return
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (isDevelopment) return

  const request = event.request
  const requestUrl = new URL(request.url)

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone()
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put("/", responseCopy))
          }
          return response
        })
        .catch(() => caches.match("/")),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cachedResponse) =>
        cachedResponse ??
        fetch(request).then((response) => {
          if (response.ok) {
            const responseCopy = response.clone()
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseCopy))
          }
          return response
        }),
    ),
  )
})

importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js",
)
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js",
)

const requiredConfigKeys = ["apiKey", "projectId", "messagingSenderId", "appId"]
const optionalConfigKeys = ["authDomain", "storageBucket"]

const firebaseConfig = Object.fromEntries(
  [...requiredConfigKeys, ...optionalConfigKeys]
    .map((key) => [key, scriptUrl.searchParams.get(key)?.trim()])
    .filter(([, value]) => value),
)

if (requiredConfigKeys.every((key) => firebaseConfig[key])) {
  firebase.initializeApp(firebaseConfig)
  firebase.messaging()
}
