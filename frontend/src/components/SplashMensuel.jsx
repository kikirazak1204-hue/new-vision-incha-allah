import React, { useEffect, useState } from 'react';

// ════════════════════════════════════════════════════════════════
// SPLASH MENSUEL — animation "chute du logo" affichée une seule fois
// par mois civil, à l'ouverture de l'application.
//
// Limite technique importante : il est impossible de faire "tomber"
// la vraie icône posée sur l'écran d'accueil du téléphone — ni Android
// ni iOS ne donnent à une application ce contrôle, natif ou web. Ce
// composant recrée l'effet DANS l'application, juste après l'ouverture :
// le logo tombe en plein écran, un message personnalisé apparaît, puis
// tout disparaît automatiquement.
//
// Utilisation : monter <SplashMensuel /> une seule fois, au niveau
// racine de l'app (dans App.jsx, avant les <Routes>).
// ════════════════════════════════════════════════════════════════

const CLE_STOCKAGE = 'kanari_dernier_splash_mois';
const DUREE_AFFICHAGE_MS = 4000;

function moisActuel() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getPrenomUtilisateur() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.prenom || user.nom || null;
    } catch {
        return null;
    }
}

export default function SplashMensuel() {
    const [visible, setVisible] = useState(false);
    const [etape, setEtape] = useState('chute'); // 'chute' -> 'message' -> 'sortie'

    useEffect(() => {
        let dejaAffiche;
        try {
            dejaAffiche = localStorage.getItem(CLE_STOCKAGE);
        } catch {
            dejaAffiche = null;
        }

        if (dejaAffiche === moisActuel()) return;

        setVisible(true);

        const timerMessage = setTimeout(() => setEtape('message'), 900);
        const timerSortie = setTimeout(() => setEtape('sortie'), DUREE_AFFICHAGE_MS - 600);
        const timerFin = setTimeout(() => {
            setVisible(false);
            try { localStorage.setItem(CLE_STOCKAGE, moisActuel()); } catch { }
        }, DUREE_AFFICHAGE_MS);

        return () => {
            clearTimeout(timerMessage);
            clearTimeout(timerSortie);
            clearTimeout(timerFin);
        };
    }, []);

    if (!visible) return null;

    const prenom = getPrenomUtilisateur();

    return (
        <div
            className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#061a3a] transition-opacity duration-500 ${
                etape === 'sortie' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            <style>{`
                @keyframes kanariChute {
                    0%   { transform: translateY(-140vh) scale(0.6); opacity: 0; }
                    55%  { transform: translateY(6%) scale(1.05); opacity: 1; }
                    72%  { transform: translateY(-2%) scale(0.98); }
                    86%  { transform: translateY(1%) scale(1.01); }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes kanariMessage {
                    0%   { transform: translateY(12px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .kanari-logo-chute {
                    animation: kanariChute 0.9s cubic-bezier(0.34, 1.2, 0.64, 1) both;
                }
                .kanari-message-entree {
                    animation: kanariMessage 0.5s ease-out both;
                }
            `}</style>

            <div className="kanari-logo-chute flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-400 shadow-2xl shadow-amber-500/30">
                <span className="text-6xl font-black text-[#061a3a]">K</span>
            </div>

            {etape !== 'chute' && (
                <div className="kanari-message-entree mt-8 text-center px-6">
                    <p className="text-2xl font-black text-white">
                        {prenom ? `Bonjour ${prenom}` : 'Bonjour'}
                    </p>
                    <p className="mt-2 text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
                        Merci de faire confiance à Kanari Service ce mois-ci.
                    </p>
                </div>
            )}
        </div>
    );
}