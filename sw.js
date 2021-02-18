self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.open('dynamic').then(function (cache) {
      return cache.match(event.request).then(function (response) {
        const fetchPromise = fetch(event.request).then(function (networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    }),
  );
});