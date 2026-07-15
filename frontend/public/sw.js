// sw.js - Service Worker Kanari
const CACHE_NAME = 'kanari-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // 1. NE PAS INTERCEPTER les appels API (Backend Render)
    if (event.request.url.includes('/api/')) {
        return; 
    }

    // 2. Stratégie réseau pour le reste du site
    event.respondWith(
        fetch(event.request).catch(() => {
            // Retourne une réponse en cas d'échec réseau (mode hors ligne)
            return new Response("Hors ligne", { status: 503, statusText: "Offline" });
        })
    );
});