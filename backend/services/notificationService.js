const nodemailer = require('nodemailer');

// Configuration pour l'email (Gmail avec mot de passe d'app)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL_USER || 'kikirazak1204@gmail.com',
        pass: process.env.EMAIL_PASSWORD || ''
    }
});

// Envoyer email de notification
async function sendAdminNotificationEmail(adminEmail, reservation) {
    const emailContent = `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
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
                <td style="padding: 10px;">${reservation.telephone}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">🔧 Service</td>
                <td style="padding: 10px;">${reservation.serviceNom || 'Plomberie'}</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; font-weight: bold;">📝 Description</td>
                <td style="padding: 10px;">${reservation.description || '(aucune)'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">📅 Date</td>
                <td style="padding: 10px;">${new Date(reservation.createdAt).toLocaleString('fr-FR')}</td>
            </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1565c0;"><strong>👉 <a href="http://localhost:5173/admin" style="color: #1565c0;">Voir dans le panel admin</a></strong></p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            Incha-Allah Platform | ${new Date().getFullYear()}
        </p>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'noreply@incha-allah.com',
            to: adminEmail,
            subject: `🔔 NOUVELLE RÉSERVATION #${reservation.id}`,
            html: emailContent
        });
        console.log(`✅ Email envoyé à ${adminEmail}`);
        return true;
    } catch (err) {
        console.error(`❌ Erreur email:`, err.message);
        return false;
    }
}

// Envoyer SMS via API (DÉSACTIVÉ POUR L'INSTANT)
// ⏸️ SMS désactivé - Utiliser seulement l'email pour les notifications
async function sendAdminNotificationSMS(adminPhone, reservation) {
    // SMS désactivé - peut être intégré plus tard avec Twilio ou similaire
    return true;
}

module.exports = {
    sendAdminNotificationEmail,
    sendAdminNotificationSMS
};
