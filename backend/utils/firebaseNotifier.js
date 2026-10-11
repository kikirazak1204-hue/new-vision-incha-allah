let admin = null;
try {
  admin = require('../config/firebase-admin');
} catch (e) {
  console.warn('⚠️ Firebase Admin indisponible, les push seront ignorés :', e.message);
}

const sendPushNotification = async ({ token, topic, userId, title, body, data }) => {
  try {
    // Résolution du jeton à partir de l'utilisateur (si userId fourni)
    if (!token && !topic && userId) {
      const { User } = require('../models'); // import tardif : évite tout cycle au démarrage
      const user = await User.findByPk(userId, { attributes: ['id', 'fcmToken'] });
      token = user?.fcmToken || null;
    }

    if (!token && !topic) {
      console.warn('⚠️ Push notification skipped: token et topic manquants');
      return null;
    }

    // FCM exige des valeurs de type texte dans `data`
    const dataTexte = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;

    const payload = {
      notification: { title, body },
      ...(dataTexte ? { data: dataTexte } : {}),
      ...(token ? { token } : { topic }),
    };

    if (!admin || typeof admin.messaging !== 'function') {
      console.warn('⚠️ Firebase messaging non disponible, notification ignorée.');
      return null;
    }

    return await admin.messaging().send(payload);
  } catch (error) {
    console.error('⚠️ Erreur sendPushNotification:', error.message || error);
    return null;
  }
};

module.exports = { sendPushNotification };