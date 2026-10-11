import { useEffect } from 'react';
import { demanderPermissionNotification, ecouterNotificationsPremierPlan } from '../firebase';

const API = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

// Demande la permission et envoie le jeton FCM au serveur, une fois l'utilisateur connecté.
// N'affiche rien. Ne plante jamais l'application.
export default function NotificationsInit() {
    useEffect(() => {
        let annule = false;

        const enregistrer = async () => {
            try {
                const authToken = localStorage.getItem('token');
                if (!authToken) return; // pas connecté : on ne demande rien

                if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
                if (Notification.permission === 'denied') return;

                const fcm = await demanderPermissionNotification();
                if (!fcm || annule) return;

                // Évite de renvoyer le même jeton à chaque chargement
                if (localStorage.getItem('fcm_token_envoye') === fcm) return;

                const res = await fetch(`${API}/api/users/fcm-token`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ fcm_token: fcm }),
                });
                if (res.ok) localStorage.setItem('fcm_token_envoye', fcm);
            } catch (e) {
                console.warn('Notifications non activées :', e?.message || e);
            }
        };

        enregistrer();

        // Notification pendant que l'appli est ouverte
        try {
            ecouterNotificationsPremierPlan((payload) => {
                const { title, body } = payload?.notification || {};
                if (title && Notification.permission === 'granted') new Notification(title, { body });
            });
        } catch { /* ignoré */ }

        return () => { annule = true; };
    }, []);

    return null;
}