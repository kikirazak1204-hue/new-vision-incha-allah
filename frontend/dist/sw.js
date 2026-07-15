// sw.js - Actif pour valider la PWA (Kanari) sans bloquer React
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // 🚨 RÈGLE D'OR : On n'intercepte PAS les appels vers l'API Render ou localhost:5000 !
    if (event.request.url.includes('/api/') || event.request.url.includes('onrender.com')) {
        return; // Laisse le navigateur gérer l'API normalement
    }

    // Pour les fichiers de l'app (HTML, CSS, JS), on laisse passer de façon sécurisée
    event.respondWith(
        fetch(event.request).catch(() => {
            // Si le réseau échoue (mode hors ligne), on évite le crash fatal "Uncaught Promise"
            return new Response("Hors ligne", { status: 503, statusText: "Offline" });
        })
    );
});