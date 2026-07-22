const admin = require('../config/firebase-admin');

const sendPushNotification = async ({ token, topic, title, body, data }) => {
  try {
    if (!token && !topic) {
      console.warn('⚠️ Push notification skipped: token and topic manquants');
      return null;
    }

    const payload = {
      notification: {
        title,
        body,
      },
      ...(data ? { data } : {}),
      ...(token ? { token } : { topic }),
    };

    if (typeof admin.messaging !== 'function') {
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