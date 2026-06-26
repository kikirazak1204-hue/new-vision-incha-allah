const admin = require('firebase-admin');

// Configuration dynamique : s'adapte entre ton PC (Local) et Render (Production)
let firebaseReady = false;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // 🌐 MODE PRODUCTION (Render) : Lecture depuis la variable d'environnement
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        firebaseReady = true;
        console.log('✅ Firebase Admin initialisé avec succès (Production / Render)');
    } else {
        // 💻 MODE LOCAL (Ton PC) : Lecture depuis le fichier JSON
        const serviceAccount = require('./serviceAccountKey.json');
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        firebaseReady = true;
        console.log('✅ Firebase Admin initialisé avec succès (Local / JSON)');
    }
} catch (err) {
    console.warn('⚠️ Firebase non configuré ou erreur d\'initialisation — notifications désactivées pour le moment.');
    console.log('💡 Raison :', err.message);
}

// Si Firebase n'est pas prêt, on exporte un objet "factice" qui ne plante
// pas quand reservationController.js appelle admin.messaging().send(...)
if (!firebaseReady) {
    module.exports = {
        messaging: () => ({
            send: async (payload) => {
                console.log('🔕 Notification ignorée (Firebase non activé) :', payload?.notification?.title || 'Pas de titre');
                return null;
            }
        })
    };
} else {
    module.exports = admin;
}