// Service worker for asset delivery and caching
const CACHE_NAME = 'comparator-cache-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    })
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request)
          .then((res) => {
            if (res.status === 200) {
              const resClone = res.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone))
            }
            return res
          })
          .catch(() => cached)
      )
    })
  )
})
