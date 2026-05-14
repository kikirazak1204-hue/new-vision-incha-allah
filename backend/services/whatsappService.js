const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

let sock = null;
let qrCode = null;
let isReady = false;
const authPath = path.join(__dirname, '../.wh-auth');

if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

// Initialiser WhatsApp avec Baileys
async function initWhatsApp() {
    try {
        console.log('📱 Initialisation WhatsApp...');
        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCode = await QRCode.toDataURL(qr);
                console.log('\n📱 QR Code généré - Scannez avec WhatsApp!');
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = reason !== DisconnectReason.loggedOut;
                console.log('❌ Connexion fermée - Reconnexion:', shouldReconnect);
                if (shouldReconnect) {
                    setTimeout(() => initWhatsApp(), 3000);
                }
                isReady = false;
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connecté et prêt!');
                isReady = true;
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error('❌ Erreur WhatsApp:', err.message);
    }
}

// Envoyer un message
async function sendWhatsAppMessage(phoneNumber, message) {
    try {
        if (!sock || !isReady) {
            console.warn('⚠️ WhatsApp pas prêt - message non envoyé');
            return false;
        }

        const number = phoneNumber.replace(/[^0-9]/g, '');
        const chatId = number + '@c.us';

        await sock.sendMessage(chatId, { text: message });
        console.log(`✅ Message envoyé à ${phoneNumber}`);
        return true;
    } catch (err) {
        console.error(`❌ Erreur envoi à ${phoneNumber}:`, err.message);
        return false;
    }
}

function isWhatsAppReady() {
    return isReady;
}

function getQRCode() {
    return qrCode;
}

module.exports = {
    initWhatsApp,
    sendWhatsAppMessage,
    isWhatsAppReady,
    getQRCode
};
