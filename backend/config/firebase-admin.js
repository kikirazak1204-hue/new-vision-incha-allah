const admin = require('firebase-admin');

let firebaseReady = false;

const resolveStorageBucket = (serviceAccount) => {
    if (process.env.FIREBASE_STORAGE_BUCKET && process.env.FIREBASE_STORAGE_BUCKET.trim()) {
        return process.env.FIREBASE_STORAGE_BUCKET.trim();
    }
    if (serviceAccount && serviceAccount.project_id) {
        return `${serviceAccount.project_id}.appspot.com`;
    }
    return undefined;
};

try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // 🌐 MODE PRODUCTION (Render)
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        // 💻 MODE LOCAL (Ton PC)
        serviceAccount = require('./serviceAccountKey.json');
    }

    if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\n/g, '\n');
    }

    const storageBucket = resolveStorageBucket(serviceAccount);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            ...(storageBucket ? { storageBucket } : {})
        });
    }

    firebaseReady = true;
    console.log('✅ Firebase Admin & Storage initialisés avec succès. Bucket :', storageBucket || '(défaut projet)');
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
            throw new Error('Firebase Storage non configuré.');
        }
    };
} else {
    module.exports = admin;
}