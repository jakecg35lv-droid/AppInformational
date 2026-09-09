/* ══════════════════════════════════════════════════════════
   TIPOFF FANTASY — informational site
   SERVICE WORKER KILL SWITCH

   The app used to be served from tipofffantasy.com and registered a
   service worker at this exact path, scoped to the whole origin. That
   worker caches the app shell and serves same-origin requests
   cache-first, so visitors who loaded the old site keep getting the
   APP instead of this landing page.

   A 404 here would eventually clear it, but browsers are slow and
   inconsistent about that. This file replaces the old worker, wipes
   every cache it created, unregisters itself, and reloads open tabs.

   It deliberately registers NO fetch handler, so nothing is
   intercepted while it is briefly active.

   Do not delete this file. Removing it would 404 again and could
   resurrect the problem for anyone who still has the old worker.
══════════════════════════════════════════════════════════ */

self.addEventListener('install', () => {
  // Take over immediately instead of waiting for existing tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Delete every cache on this origin (the old tipoff-vNNN caches)
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      // ignore — cache API may be unavailable
    }

    // 2. Remove this worker so the origin goes back to plain networking
    try {
      await self.registration.unregister();
    } catch (e) {
      // ignore
    }

    // 3. Reload any open tabs so they fetch the real landing page
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        if ('navigate' in client) client.navigate(client.url);
      }
    } catch (e) {
      // ignore
    }
  })());
});

/* No fetch listener on purpose: all requests go straight to the network. */
