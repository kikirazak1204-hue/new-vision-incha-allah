const nodemailer = require('nodemailer');
const admin = require('../config/firebase-admin');

// ==========================================
// 1. CONFIGURATION EMAIL (Nodemailer)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL_USER || 'kikirazak1204@gmail.com',
        pass: process.env.EMAIL_PASSWORD || ''
    }
});

// ==========================================
// 2. ENVOI NOTIFICATION PUSH (Firebase FCM)
// ==========================================
/**
 * Envoie une notification Push instantanée au téléphone/navigateur
 */
async function envoyerNotificationPush(fcmToken, title, body, dataPayload = {}) {
    if (!fcmToken) {
        console.log("ℹ️ Push ignoré : aucun token FCM fourni.");
        return null;
    }

    try {
        // 💡 CORRECTION ANTI-CRASH : Firebase exige que 'data' ne contienne QUE des chaînes de caractères (String)
        const safeDataPayload = {};
        if (dataPayload) {
            for (const key in dataPayload) {
                safeDataPayload[key] = String(dataPayload[key]);
            }
        }

        const message = {
            token: fcmToken,
            notification: { title, body },
            data: safeDataPayload // On utilise le payload sécurisé
        };

        const response = await admin.messaging().send(message);
        console.log("🚀 Notification Push envoyée avec succès :", response);
        return response;
    } catch (error) {
        // On catch l'erreur au lieu de laisser le serveur crasher
        console.error("❌ Échec envoi Push FCM :", error.message);
        return null; 
    }
}

// ==========================================
// 3. ENVOI EMAIL DE NOTIFICATION (Nodemailer)
// ==========================================
/**
 * Envoie un email récapitulatif à l'administrateur ou au prestataire
 */
async function sendAdminNotificationEmail(adminEmail, reservation) {
    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">🔔 NOUVELLE RÉSERVATION</h2>
        
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; font-weight: bold;">ID Réservation</td>
                <td style="padding: 10px;">#${reservation.id}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">👤 Client</td>
                <td style="padding: 10px;">${reservation.clientNom || 'Anonyme'}</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; font-weight: bold;">📱 Téléphone</td>
                <td style="padding: 10px;">${reservation.telephone || 'Non renseigné'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">🔧 Service</td>
                <td style="padding: 10px;">${reservation.serviceNom || 'Intervention'}</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; font-weight: bold;">📝 Description</td>
                <td style="padding: 10px;">${reservation.description || '(aucune)'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">📅 Date</td>
                <td style="padding: 10px;">${new Date(reservation.createdAt || Date.now()).toLocaleString('fr-FR')}</td>
            </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1565c0;"><strong>👉 <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" style="color: #1565c0;">Voir dans le panel admin</a></strong></p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            Kanari Service Platform | ${new Date().getFullYear()}
        </p>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.ADMIN_EMAIL_USER || process.env.EMAIL_USER || 'noreply@kanari-service.com',
            to: adminEmail,
            subject: `🔔 NOUVELLE RÉSERVATION #${reservation.id}`,
            html: emailContent
        });
        console.log(`✅ Email envoyé avec succès à ${adminEmail}`);
        return true;
    } catch (err) {
        console.error(`❌ Erreur envoi email:`, err.message);
        return false;
    }
}

// ==========================================
// 4. ENVOI SMS (Désactivé pour l'instant)
// ==========================================
async function sendAdminNotificationSMS(adminPhone, reservation) {
    return true;
}

module.exports = {
    envoyerNotificationPush,
    sendAdminNotificationEmail,
    sendAdminNotificationSMS
};