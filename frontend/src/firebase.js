// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Config récupérée depuis Firebase Console → Paramètres du projet → Général
const firebaseConfig = {
    apiKey: "AIzaSyBiATb2AAPBH2Y2ORvVQnPsNIXG6YDYFdg",
    authDomain: "kanari-service.firebaseapp.com",
    projectId: "kanari-service",
    storageBucket: "kanari-service.firebasestorage.app",
    messagingSenderId: "456787867761",
    appId: "1:456787867761:web:55a3bd96d1e2cb606383d0",
    // measurementId retiré volontairement : Analytics n'est pas nécessaire pour les notifications
};

// Clé VAPID récupérée depuis Firebase Console → Paramètres du projet → Cloud Messaging → Configuration Web
const VAPID_KEY = "BBVm5rsH3jNwpvjaX4xRGYA6Unnl-9PhSGz0f1wjQU9X0zFoq9EtbFAPSXs9zwyZO0RPxk3MXbe_w-2WINyhwaY";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Demande la permission de notification au navigateur, puis récupère le token FCM.
 * Retourne le token (string) si accepté, ou null si refusé/échec.
 */
export async function demanderPermissionNotification() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("🔕 Permission de notification refusée par l'utilisateur.");
            return null;
        }

        // Enregistre le service worker dédié à Firebase Messaging (fichier séparé de sw.js)
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn("🔕 Aucun token FCM obtenu.");
            return null;
        }

        return token;
    } catch (err) {
        console.error("❌ Erreur lors de la récupération du token FCM :", err);
        return null;
    }
}

/**
 * Écoute les notifications reçues PENDANT que l'app est ouverte au premier plan.
 * (Les notifications reçues quand l'app est fermée/en arrière-plan sont gérées
 * par firebase-messaging-sw.js, pas par cette fonction.)
 */
export function ecouterNotificationsPremierPlan(callback) {
    onMessage(messaging, (payload) => {
        console.log("🔔 Notification reçue (premier plan) :", payload);
        callback && callback(payload);
    });
}

export { messaging };