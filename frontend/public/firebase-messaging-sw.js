// public/firebase-messaging-sw.js
// ⚠️ Ce fichier doit être placé dans le dossier "public" du frontend
// (racine servie telle quelle, PAS dans src/) pour être accessible à l'URL /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Même config que src/firebase.js — un service worker ne peut pas importer
// depuis votre code source, donc elle est dupliquée ici volontairement.
firebase.initializeApp({
    apiKey: "AIzaSyBiATb2AAPBH2Y2ORvVQnPsNIXG6YDYFdg",
    authDomain: "kanari-service.firebaseapp.com",
    projectId: "kanari-service",
    storageBucket: "kanari-service.firebasestorage.app",
    messagingSenderId: "456787867761",
    appId: "1:456787867761:web:55a3bd96d1e2cb606383d0",
});

const messaging = firebase.messaging();

// Gère les notifications reçues quand l'app Kanari est fermée ou en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log("🔔 Notification reçue (arrière-plan) :", payload);

    const { title, body } = payload.notification || {};

    self.registration.showNotification(title || "Kanari Service", {
        body: body || "Vous avez une nouvelle notification.",
        icon: "/logo.png",
        badge: "/logo.png",
        data: payload.data || {},
    });
});

// Optionnel : au clic sur la notification, ouvrir/focus l'app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow("/");
        })
    );
});