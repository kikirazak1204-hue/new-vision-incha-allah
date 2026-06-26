import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function BonInterventionForm({ mission, token, onSuccess, onClose }) {
    const [descriptionTravail, setDescriptionTravail] = useState('');
    const [montantMainOeuvre, setMontantMainOeuvre] = useState('');
    const [piecesOutils, setPiecesOutils] = useState('');
    const [montantPiecesOutils, setMontantPiecesOutils] = useState('');
    const [sending, setSending] = useState(false);
    const [erreur, setErreur] = useState('');

    const montantFinal = (parseFloat(montantMainOeuvre) || 0) + (parseFloat(montantPiecesOutils) || 0);

    const handleSubmit = async () => {
        setErreur('');
        if (!descriptionTravail.trim() || !montantMainOeuvre) {
            setErreur("La description du travail et le montant de la main-d'œuvre sont obligatoires.");
            return;
        }

        setSending(true);
        try {
            const r = await fetch(`${API}/api/bons-intervention`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    reservationId: mission.id,
                    descriptionTravail,
                    montantMainOeuvre: parseFloat(montantMainOeuvre),
                    piecesOutils: piecesOutils || null,
                    montantPiecesOutils: parseFloat(montantPiecesOutils) || 0,
                })
            }).then(r => r.json());

            if (r.success) {
                onSuccess && onSuccess(r.data);
            } else {
                setErreur(r.message || "Erreur lors de la création du bon d'intervention.");
            }
        } catch (err) {
            setErreur('Erreur de connexion au serveur.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#0E1320] border border-purple-500/20 rounded-3xl shadow-2xl overflow-hidden">

                <div className="px-6 py-5 bg-white/[0.02] border-b border-white/[0.07] flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Mission #{mission.id}</span>
                        <h3 className="text-xl font-black text-white mt-0.5">📋 Bon d'intervention</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm">✕</button>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

                    {erreur && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-300 text-sm font-medium">
                            {erreur}
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Description du travail effectué *
                        </label>
                        <textarea
                            value={descriptionTravail}
                            onChange={(e) => setDescriptionTravail(e.target.value)}
                            placeholder="Ex : Remplacement du joint du robinet, débouchage de l'évier..."
                            className="w-full h-28 bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Montant main-d'œuvre (FCFA) *
                        </label>
                        <input
                            type="number"
                            value={montantMainOeuvre}
                            onChange={(e) => setMontantMainOeuvre(e.target.value)}
                            placeholder="Ex : 10000"
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all font-bold"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                            Pièces / outils utilisés <span className="text-slate-600 font-normal">(optionnel)</span>
                        </label>
                        <input
                            value={piecesOutils}
                            onChange={(e) => setPiecesOutils(e.target.value)}
                            placeholder="Ex : 1 joint, 1 tuyau PVC..."
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all mb-3"
                        />
                        <input
                            type="number"
                            value={montantPiecesOutils}
                            onChange={(e) => setMontantPiecesOutils(e.target.value)}
                            placeholder="Montant pièces/outils (FCFA) — optionnel"
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        />
                    </div>

                    <div className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-4 flex justify-between items-center">
                        <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">Montant total final</span>
                        <span className="text-2xl font-black text-amber-400">{montantFinal.toLocaleString()} FCFA</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                        ⚠️ Ce bon sera envoyé au client pour validation. Une fois validé, le compte à rebours de 48h pour le dépôt de votre commission démarre automatiquement.
                    </p>
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={handleSubmit}
                        disabled={sending}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black rounded-2xl text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {sending ? 'Envoi en cours...' : '✅ Envoyer le bon au client'}
                    </button>
                </div>
            </div>
        </div>
    );
}