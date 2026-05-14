import React, { useEffect, useState } from 'react';

export default function WhatsAppSetup() {
    const [status, setStatus] = useState('loading');
    const [qrImage, setQrImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/whatsapp-status`);
            const data = await res.json();
            setStatus(data.connected ? 'connected' : 'waiting');
            setLoading(false);

            if (!data.connected) {
                // Charger le QR code
                setQrImage(`${import.meta.env.VITE_API_URL}/api/whatsapp/qr-code?t=${Date.now()}`);
            }
        } catch (err) {
            console.error('Erreur vérification WhatsApp:', err);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-10 flex items-center justify-center">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">
                        📱 Configuration WhatsApp
                    </h1>

                    {loading ? (
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white/60">Vérification...</p>
                        </div>
                    ) : status === 'connected' ? (
                        <div className="text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-xl font-semibold text-green-400 mb-2">Connecté!</h2>
                            <p className="text-white/60 text-sm">WhatsApp est prêt à recevoir les notifications</p>
                            <button
                                onClick={() => window.location.href = '/admin'}
                                className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                Aller au Dashboard Admin
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-white/60 text-sm mb-4">
                                📸 Scannez ce code QR avec WhatsApp
                            </p>
                            {qrImage && (
                                <img 
                                    src={qrImage} 
                                    alt="QR Code WhatsApp"
                                    className="w-full max-w-xs mx-auto bg-white p-2 rounded-lg mb-4"
                                />
                            )}
                            <p className="text-white/40 text-xs">
                                Rafraîchir la page pour mettre à jour
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                            >
                                🔄 Rafraîchir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
