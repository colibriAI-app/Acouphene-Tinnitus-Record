const CACHE = "tinnitus-tracker-v1";
self.addEventListener("fetch", e => {
  e.respondWith(caches.open(CACHE).then(c =>
    c.match(e.request).then(r => r || fetch(e.request).then(res => {
      c.put(e.request, res.clone());
      return res;
    })
  )));
});
