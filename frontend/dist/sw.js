// sw.js - Le service worker doit être actif pour valider la PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // On laisse passer les requêtes normalement, mais le fait d'écouter
    // l'événement fetch permet au navigateur de valider la PWA.
    event.respondWith(fetch(event.request));
});