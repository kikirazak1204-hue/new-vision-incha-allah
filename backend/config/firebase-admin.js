const fs = require('fs');
const path = require('path');
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
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
        if (fs.existsSync(localKeyPath)) {
            serviceAccount = require(localKeyPath);
        }
    }

    if (serviceAccount) {
        if (serviceAccount.private_key) {
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
        console.log('✅ Firebase Admin & Storage initialisés. Bucket :', storageBucket || '(défaut projet)');
    } else {
        console.warn('⚠️ Aucune clé Firebase trouvée (FIREBASE_SERVICE_ACCOUNT absent et serviceAccountKey.json inexistant) — stockage cloud inactif.');
    }
} catch (err) {
    console.warn('⚠️ Erreur initialisation Firebase :', err.message);
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