const admin = require('firebase-admin');

let firebaseReady = false;

// Remplace par le nom exact de ton bucket (visible dans Firebase Console > Storage, ex: "kanari-service.appspot.com" ou "kanari-service.firebasestorage.app")
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'TON-PROJET-ID.appspot.com';

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // 🌐 MODE PRODUCTION (Render)
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: STORAGE_BUCKET
            });
        }
        firebaseReady = true;
        console.log('✅ Firebase Admin & Storage initialisés avec succès (Production / Render)');
    } else {
        // 💻 MODE LOCAL (Ton PC)
        const serviceAccount = require('./serviceAccountKey.json');
        
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: STORAGE_BUCKET
            });
        }
        firebaseReady = true;
        console.log('✅ Firebase Admin & Storage initialisés avec succès (Local / JSON)');
    }
} catch (err) {
    console.warn('⚠️ Firebase non configuré ou erreur d\'initialisation — notifications et storage cloud désactivés.');
    console.log('💡 Raison :', err.message);
}

if (!firebaseReady) {
    module.exports = {
        messaging: () => ({
            send: async (payload) => {
                console.log('🔕 Notification ignorée (Firebase non activé) :', payload?.notification?.title || 'Pas de titre');
                return null;
            }
        }),
        storage: () => {
            throw new Error('Firebase Storage non configuré (fichier serviceAccountKey.json manquant en local).');
        }
    };
} else {
    module.exports = admin;
}