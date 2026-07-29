const CACHE_NAME = 'mindtrack-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/maya',
  '/dashboard/journal',
  '/dashboard/analytics',
  '/dashboard/history',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Network first for API calls
  if (event.request.url.includes('railway.app')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request)
      )
    )
    return
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
    })
  )
})
