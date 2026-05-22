import React, { useState, useRef } from 'react';

export default function ReservationPage({ handleRetour, setCurrentView, selectedServices = [] }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [confirme, setConfirme] = useState(false);

    const [telephone, setTelephone] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);

    const [enregistrement, setEnregistrement] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [duree, setDuree] = useState(0);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const token = localStorage.getItem('token');
    let user = {};
    try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    const demarrerAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioURL(URL.createObjectURL(blob));
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setEnregistrement(true);
            setDuree(0);
            timerRef.current = setInterval(() => setDuree((d) => d + 1), 1000);
        } catch {
            setMessage('Micro non disponible. Vérifiez les permissions.');
        }
    };

    const arreterAudio = () => {
        mediaRecorderRef.current?.stop();
        setEnregistrement(false);
        clearInterval(timerRef.current);
    };

    const supprimerAudio = () => {
        setAudioBlob(null);
        setAudioURL(null);
        setDuree(0);
    };

    const formatDuree = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleSubmit = async () => {
        // ✅ Validation stricte
        if (!telephone || telephone.trim().length === 0) {
            return setMessage('❌ Entrez un numéro de téléphone valide.');
        }

        if (telephone.trim().length < 8) {
            return setMessage('❌ Le numéro doit avoir au moins 8 chiffres.');
        }

        setLoading(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('telephone', telephone.trim());
            formData.append('description', description?.trim() || '');
            formData.append('clientNom', user?.nom || 'Client anonyme');

            // Ajouter les services sélectionnés
            const serviceNames = selectedServices?.length > 0
                ? selectedServices.map(s => s.nom).join(', ')
                : 'Service non spécifié';
            formData.append('serviceNom', serviceNames);
            formData.append('servicesJSON', JSON.stringify(selectedServices || []));

            formData.append('montantEstime', '0');
            if (photo) formData.append('photo', photo);
            if (audioBlob) formData.append('audio', audioBlob, 'message.webm');

            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reservations`, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setConfirme(true);
            } else {
                // ✅ Afficher un message d'erreur descriptif
                const errorMessage = data.message || 'Erreur lors de la réservation. Vérifiez votre connexion et réessayez.';
                setMessage(`❌ ${errorMessage}`);
            }
        } catch (err) {
            console.error('Erreur submission:', err);
            setMessage('❌ Impossible de se connecter au serveur. Vérifiez votre connexion Internet.');
        } finally {
            setLoading(false);
        }
    };

    if (confirme) {
        const serviceText = selectedServices.length > 0
            ? `Les prestataires en ${selectedServices.map(s => s.nom.toLowerCase()).join(', ')} vont vous contacter rapidement.`
            : 'Un prestataire va vous contacter rapidement.';

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-6">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-xl font-semibold text-white mb-2">Demande envoyée !</h2>
                        <p className="text-white/60 text-sm mb-6">
                            {serviceText}
                        </p>
                        <button
                            onClick={() => setCurrentView?.('accueil')}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-6">
            <div className="max-w-lg mx-auto">
                <button
                    onClick={handleRetour}
                    className="mb-4 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-all"
                >
                    ← Retour
                </button>

                {/* Affichage des services sélectionnés */}
                {selectedServices.length > 0 ? (
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6">
                        <h3 className="text-white font-semibold mb-3">📋 Services sélectionnés</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedServices.map((service) => (
                                <div
                                    key={service.code}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600/40 border border-purple-400/50 rounded-lg"
                                >
                                    <span className="text-lg">{service.emoji}</span>
                                    <span className="text-white text-sm font-medium">{service.nom}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-indigo-200 text-xs mt-3">
                            Veuillez entrer vos coordonnées pour réserver ces services.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl">
                            🚰
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Plomberie</h3>
                            <p className="text-indigo-200 text-xs">Photo + numéro, et si possible un vocal.</p>
                        </div>
                    </div>
                )}

                {/* Pas d'alerte - réservation publique */}

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-5">

                    {/* Téléphone */}
                    <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wide mb-1">
                            Votre numéro *
                        </label>
                        <input
                            type="tel"
                            value={telephone}
                            onChange={(e) => { setTelephone(e.target.value); setMessage(''); }}
                            placeholder="+227 XX XX XX XX"
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-white placeholder-white/40 text-sm focus:border-purple-500 outline-none"
                        />
                    </div>

                    {/* Audio */}
                    <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">
                            🎙️ Message vocal
                        </label>
                        {!audioURL ? (
                            <button
                                onClick={enregistrement ? arreterAudio : demarrerAudio}
                                className={`w-full py-5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all
                                    ${enregistrement
                                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                        : 'bg-white/10 border-white/10 hover:bg-white/15 text-white'}`}
                            >
                                <span className={`text-4xl ${enregistrement ? 'animate-pulse' : ''}`}>
                                    {enregistrement ? '⏹️' : '🎙️'}
                                </span>
                                <span className="font-semibold text-sm">
                                    {enregistrement ? `Enregistrement… ${formatDuree(duree)}` : 'Appuyez pour parler'}
                                </span>
                            </button>
                        ) : (
                            <div className="bg-white/10 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-green-400 text-xl">🎙️</span>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-semibold">Message enregistré</p>
                                        <p className="text-white/50 text-xs">{formatDuree(duree)}</p>
                                    </div>
                                    <button
                                        onClick={supprimerAudio}
                                        className="text-white/40 hover:text-red-400 text-xs transition-colors"
                                    >
                                        ✕ Supprimer
                                    </button>
                                </div>
                                <audio src={audioURL} controls className="w-full h-8 rounded-lg" />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wide mb-1">
                            Description courte
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setMessage(''); }}
                            placeholder="Ex : fuite, robinet cassé, tuyau bouché..."
                            rows={3}
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-white placeholder-white/40 text-sm focus:border-purple-500 outline-none"
                        />
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="block text-white/60 text-xs uppercase tracking-wide mb-1">
                            Photo de la panne
                        </label>
                        <div
                            onClick={() => document.getElementById('photo-input').click()}
                            className="w-full bg-white/10 border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-white/15 transition-all"
                        >
                            {photo ? (
                                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                                    <span>📎</span>
                                    <span className="truncate max-w-xs">{photo.name}</span>
                                </div>
                            ) : (
                                <p className="text-white/40 text-sm">📷 Appuyez pour ajouter une photo</p>
                            )}
                        </div>
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files[0])}
                            className="hidden"
                        />
                    </div>

                    {message && <p className="text-red-400 text-sm">{message}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Envoi en cours…
                            </>
                        ) : (
                            '🚀 Envoyer ma demande'
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}