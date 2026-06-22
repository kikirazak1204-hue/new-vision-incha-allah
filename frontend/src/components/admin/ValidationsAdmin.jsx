import React, { useEffect, useState } from 'react';
// Remplace "../util/api" par "../../util/api"
import { getAdminFournisseurs, updateStatutFournisseur } from "../../util/api";
const STATUTS = {
    EN_ATTENTE:    { label: 'En attente',    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
    EN_EVALUATION: { label: 'En analyse',    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',       dot: 'bg-sky-400' },
    CONFORME:      { label: 'Validés',       badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    SUSPENDU:      { label: 'Rejetés',       badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    dot: 'bg-rose-400' },
};

export default function ValidationsAdmin() {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState('EN_ATTENTE');
    const [selected, setSelected] = useState(null);
    const [imgZoom, setImgZoom] = useState(null);

    const fetchFournisseurs = async () => {
        setLoading(true);
        try {
            // Remplacement du fetch barbare par ta fonction d'API
            const res = await getAdminFournisseurs(filtreStatut);
            setFournisseurs(res.data || []);
            // Auto-sélectionne le premier de la liste s'il y en a un
            if (res.data?.length > 0) setSelected(res.data[0]);
            else setSelected(null);
        } catch (err) { 
            console.error("Erreur de chargement des dossiers :", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchFournisseurs(); 
    }, [filtreStatut]);

    const modifierStatut = async (id, nouveauStatut) => {
        if (!window.confirm(`Passer le dossier en statut [ ${STATUTS[nouveauStatut].label} ] ?`)) return;
        
        try {
            const res = await updateStatutFournisseur(id, nouveauStatut);
            if (res.success || res.data) {
                setFournisseurs(prev => prev.filter(f => f.id !== id));
                setSelected(null);
            }
        } catch (err) { 
            alert("Échec de l'opération sur le serveur."); 
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Barre des filtres en "Pills" */}
            <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
                {Object.entries(STATUTS).map(([key, val]) => (
                    <button 
                        key={key} 
                        onClick={() => setFiltreStatut(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            filtreStatut === key 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`}></span>
                        {val.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Colonne Gauche : Liste des dossiers (Span 4) */}
                <div className="lg:col-span-4 space-y-3">
                    <div className="px-1 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Dossiers reçus</span>
                        <span>{fournisseurs.length}</span>
                    </div>

                    {loading ? (
                        <div className="p-6 text-center text-slate-600 text-xs animate-pulse bg-slate-900/40 rounded-2xl border border-slate-800">
                            Lecture des flux KYC...
                        </div>
                    ) : fournisseurs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                            <p className="text-slate-500 text-xs">Aucun dossier dans cette file</p>
                        </div>
                    ) : (
                        fournisseurs.map(f => (
                            <div 
                                key={f.id} 
                                onClick={() => setSelected(f)}
                                className={`p-4 rounded-2xl cursor-pointer border transition-all text-left relative overflow-hidden ${
                                    selected?.id === f.id 
                                        ? 'border-purple-500/80 bg-slate-900 shadow-xl shadow-purple-950/20' 
                                        : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/50 hover:border-slate-700'
                                }`}
                            >
                                {selected?.id === f.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500"></div>
                                )}
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white text-sm">
                                        {f.nomEntreprise || f.nom || 'Entreprise N/A'}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 font-mono">#{f.id}</span>
                                </div>
                                <p className="text-xs text-purple-400 font-medium mt-0.5">
                                    {f.service?.nom || 'Général'}
                                </p>
                                <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
                                    <span>{f.telephone || 'Pas de tel'}</span>
                                    <span className="text-slate-500">{f.email?.split('@')[0]}@...</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Colonne Droite : Le Visualiseur de Dossier (Span 8) */}
                <div className="lg:col-span-8">
                    {selected ? (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl relative overflow-hidden">
                            
                            {/* Ruban de fond stylisé */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            {/* En-tête de la fiche */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-white">{selected.nomEntreprise || selected.nom}</h2>
                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${STATUTS[filtreStatut].badge}`}>
                                            {STATUTS[filtreStatut].label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Postulant au service : <strong className="text-purple-400">{selected.service?.nom || 'Non spécifié'}</strong>
                                    </p>
                                </div>

                                {/* Actions de décision */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {filtreStatut !== 'CONFORME' && (
                                        <button 
                                            onClick={() => modifierStatut(selected.id, 'CONFORME')} 
                                            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5"
                                        >
                                            <span>✓</span> Approuver
                                        </button>
                                    )}
                                    {filtreStatut !== 'SUSPENDU' && (
                                        <button 
                                            onClick={() => modifierStatut(selected.id, 'SUSPENDU')} 
                                            className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <span>✕</span> Rejeter
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Données de contact rapides */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs">
                                <div>
                                    <span className="text-slate-500 block mb-0.5">Responsable</span>
                                    <span className="text-slate-200 font-semibold">{selected.nom || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-0.5">E-mail</span>
                                    <span className="text-slate-200 font-mono">{selected.email || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-0.5">Téléphone</span>
                                    <span className="text-slate-200 font-mono">{selected.telephone || '—'}</span>
                                </div>
                            </div>

                            {/* Galerie des documents officiels */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pièces justificatives (KYC)</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'cniRecto', label: "Pièce d'identité (Recto)" },
                                        { key: 'cniVerso', label: "Pièce d'identité (Verso)" },
                                        { key: 'selfie',   label: "Selfie de vérification" },
                                        { key: 'diplome',  label: "Certificat / Diplôme" }
                                    ].map(doc => (
                                        <div key={doc.key} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-semibold text-slate-300">{doc.label}</span>
                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                                                    {selected[doc.key] ? 'Fichier OK' : 'Manquant'}
                                                </span>
                                            </div>

                                            {selected[doc.key] ? (
                                                <div 
                                                    className="relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-zoom-in group/img"
                                                    onClick={() => setImgZoom(`${import.meta.env.VITE_API_URL}/uploads/${selected[doc.key]}`)}
                                                >
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}/uploads/${selected[doc.key]}`}
                                                        className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                                                        alt={doc.label}
                                                    />
                                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="px-3 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-lg border border-slate-700 backdrop-blur-sm shadow-lg">
                                                            🔍 Agrandir
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-36 rounded-xl border border-dashed border-slate-800 flex items-center justify-center bg-slate-950/20 text-slate-600 text-xs">
                                                    Non fourni
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center border border-slate-800 rounded-3xl bg-slate-900/30 text-slate-500 space-y-2">
                            <span className="text-3xl">📂</span>
                            <p className="text-sm">Sélectionnez un dossier à gauche pour examiner les pièces</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Zoom plein écran */}
            {imgZoom && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn cursor-zoom-out" 
                    onClick={() => setImgZoom(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img src={imgZoom} className="w-full h-full object-contain rounded-2xl shadow-2xl border border-slate-800" alt="Zoom document" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-xs font-mono">
                            Cliquez n'importe où pour fermer
                        </span>
                    </div>
                </div>
            )}

        </div>
    );
}