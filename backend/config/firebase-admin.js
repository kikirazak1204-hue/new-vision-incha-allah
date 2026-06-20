const admin = require('firebase-admin');

// ⚠️ TEMPORAIRE — Firebase pas encore configuré côté Kanari.
// Le fichier serviceAccountKey.json doit être généré depuis
// console.firebase.google.com puis placé dans backend/config/.
// En attendant, on neutralise l'init pour ne pas faire planter le serveur.

let firebaseReady = false;

try {
    const serviceAccount = require('./serviceAccountKey.json');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    firebaseReady = true;
    console.log('✅ Firebase Admin initialisé');
} catch (err) {
    console.warn('⚠️ Firebase non configuré (serviceAccountKey.json manquant) — notifications désactivées pour le moment.');
}

// Si Firebase n'est pas prêt, on exporte un objet "factice" qui ne plante
// pas quand reservationController.js appelle admin.messaging().send(...)
if (!firebaseReady) {
    module.exports = {
        messaging: () => ({
            send: async () => {
                console.log('🔕 Notification ignorée (Firebase non configuré encore)');
                return null;
            }
        })
    };
} else {
    module.exports = admin;
}