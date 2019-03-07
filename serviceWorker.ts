/// <reference lib="webworker" />
(function (self: ServiceWorkerGlobalScope) {
    const CACHE_NAME = 'HealthTracker';
    self.addEventListener('install', ev => {
        ev.waitUntil(self.skipWaiting());
    });
    self.addEventListener('activate', ev => {
        ev.waitUntil(self.caches.keys()
            .then(cacheNames => Promise.all(cacheNames.map(name => {
                console.log('deleting old cache', name);
                if (name != CACHE_NAME) {
                    return self.caches.delete(name)
                } else {
                    return Promise.resolve(false);
                }
            })))
            .then(() => self.clients.claim()));
    })
    self.addEventListener('fetch', ev => {
        ev.respondWith(handleFetch(ev));
    });
    async function handleFetch(ev: FetchEvent): Promise<Response> {
        return fetch(ev.request).then(r => {
            if (!r.ok) {
                return fallbackResponse(ev.request).then(res => {
                    if (!res) {
                        return r;
                    }
                    return res;
                }).catch(() => r);
            }
            return self.caches.open(CACHE_NAME).then(cache => {
                return cache.put(ev.request, r.clone())
                    .then(() => r)
                    .catch(() => r);
            })
        })
        .catch(e => {
            return fallbackResponse(ev.request)
        });
    }

    async function fallbackResponse(req: Request): Promise<Response> {
        let cache = await self.caches.open('DnDCharacterManager');
        return await cache.match(req);
    }
})(self as unknown as ServiceWorkerGlobalScope);