// Validation des paiements (commandes, missions, commissions, dépôts) — données réelles du serveur
import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle,
    Smartphone, CreditCard, Banknote, ShieldCheck, Download, RefreshCw, Undo2, Wallet
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const STATUTS = {
    en_attente: { label: 'À vérifier', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    valide: { label: 'Confirmé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejete: { label: 'Refusé', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    rembourse: { label: 'Remboursé', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Undo2 },
};
const TYPES = { COMMANDE: 'Commande boutique', MISSION: 'Mission', COMMISSION: 'Commission partenaire', DEPOT: 'Dépôt portefeuille' };
const MODES = {
    orange_money: 'Orange Money', moov_money: 'Moov Money', airtel_money: 'Airtel Money', amanata: 'Amanata',
    mynita: 'MyNita', virement_bancaire: 'Virement bancaire', mobile_money: 'Mobile Money', carte_bancaire: 'Carte',
    depot_kanari: 'Dépôt Kanari', especes: 'Espèces', portefeuille: 'Portefeuille Kanari'
};

const formatMontant = (m) => new Intl.NumberFormat('fr-FR').format(Number(m) || 0) + ' FCFA';
const origine = (p) => (p.typePaiement === 'DEPOT' ? 'Dépôt' : p.commandeId ? `Commande #${p.commandeId}` : p.reservationId ? `Mission #${p.reservationId}` : '—');
const commissionDe = (p) => (p.typePaiement === 'COMMISSION' ? Number(p.montant) : Number(p.commissionKanari) || 0);

function IconeMode({ mode }) {
    if (mode === 'especes') return <Banknote size={16} className="text-emerald-500" />;
    if (mode === 'carte_bancaire') return <CreditCard size={16} className="text-blue-500" />;
    if (mode === 'portefeuille') return <Wallet size={16} className="text-indigo-500" />;
    return <Smartphone size={16} className="text-amber-500" />;
}

export default function PaiementAdmin() {
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('en_attente');
    const [filtreType, setFiltreType] = useState('tous');
    const [recherche, setRecherche] = useState('');
    const [enCours, setEnCours] = useState(null);
    const token = localStorage.getItem('token');

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/paiements/admin/liste?limit=500`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || d.success === false) throw new Error(d.message || `Erreur ${r.status}`);
            setPaiements(d.data || []);
            setErreur('');
        } catch (e) { setErreur(e.message || 'Impossible de charger les paiements.'); }
        finally { setLoading(false); }
    }, [token]);
    useEffect(() => { charger(); }, [charger]);

    const changerStatut = async (p, statut) => {
        let motif = null;
        if (statut === 'valide') {
            if (!window.confirm(`Avez-vous bien reçu ${formatMontant(p.montant)} sur le compte Kanari (réf. ${p.referenceClient || p.transactionId}) ?`)) return;
        } else {
            motif = window.prompt(statut === 'rejete' ? 'Motif du refus (obligatoire) :' : 'Motif du remboursement (obligatoire) :');
            if (!motif || !motif.trim()) return;
            if (statut === 'rembourse' && !window.confirm('Le remboursement annule les gains du partenaire et la facture. Continuer ?')) return;
        }
        setEnCours(p.id);
        try {
            const r = await fetch(`${API}/api/paiements/admin/${p.id}/statut`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ statut, motif })
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || d.success === false) throw new Error(d.message || `Erreur ${r.status}`);
            await charger();
        } catch (e) { alert(e.message); }
        finally { setEnCours(null); }
    };

    const valides = paiements.filter((p) => p.statut === 'valide');
    const stats = {
        volume: valides.filter((p) => ['COMMANDE', 'MISSION'].includes(p.typePaiement)).reduce((s, p) => s + Number(p.montant), 0),
        commissions: valides.reduce((s, p) => s + commissionDe(p), 0),
        aValider: paiements.filter((p) => p.statut === 'en_attente').length,
    };

    const filtres = paiements.filter((p) => {
        const q = recherche.trim().toLowerCase();
        const matchQ = !q || [p.nom, p.telephone, p.referenceClient, p.transactionId, origine(p)].some((v) => String(v || '').toLowerCase().includes(q));
        return matchQ && (filtreStatut === 'tous' || p.statut === filtreStatut) && (filtreType === 'tous' || p.typePaiement === filtreType);
    });

    const exporterCsv = () => {
        const lignes = [['Date', 'Référence', 'Origine', 'Type', 'Client', 'Téléphone', 'Mode', 'Montant', 'Commission', 'Statut', 'Motif']]
            .concat(filtres.map((p) => [new Date(p.createdAt).toLocaleString('fr-FR'), p.referenceClient || p.transactionId, origine(p), TYPES[p.typePaiement] || p.typePaiement,
                p.nom, p.telephone, MODES[p.modePaiement] || p.modePaiement, p.montant, commissionDe(p), STATUTS[p.statut]?.label || p.statut, p.motif || '']));
        const csv = lignes.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `paiements-kanari-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-[#061a3a] p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><ShieldCheck className="text-[#430fd1]" size={32} /> Gestion des Paiements</h1>
                    <p className="text-slate-500 font-medium mt-1">Vérifiez chaque transfert sur le compte Kanari avant de confirmer. Une capture d'écran ne suffit jamais.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={charger} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:border-[#13d484] transition"><RefreshCw size={16} /> Actualiser</button>
                    <button onClick={exporterCsv} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:border-[#13d484] transition"><Download size={18} className="text-[#13d484]" /> Exporter CSV</button>
                </div>
            </div>

            {erreur && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold">{erreur}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={64} color="#430fd1" /></div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Volume des ventes confirmées</span>
                    <div className="text-3xl font-black mt-2">{formatMontant(stats.volume)}</div>
                </div>
                <div className="bg-[#430fd1] p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-6 opacity-20"><TrendingUp size={64} color="#ffffff" /></div>
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Commissions encaissées</span>
                    <div className="text-3xl font-black mt-2">{formatMontant(stats.commissions)}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Clock size={64} color="#f59e0b" /></div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Paiements à vérifier</span>
                    <div className="text-3xl font-black mt-2">{stats.aValider}</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input type="text" placeholder="Rechercher : nom, téléphone, référence, commande…" value={recherche} onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:border-[#13d484]" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Filter className="text-slate-400" size={18} />
                    <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none">
                        <option value="en_attente">À vérifier</option><option value="valide">Confirmés</option><option value="rejete">Refusés</option><option value="rembourse">Remboursés</option><option value="tous">Tous</option>
                    </select>
                    <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none">
                        <option value="tous">Tous les types</option>
                        {Object.entries(TYPES).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-4 pl-6">Référence</th><th className="p-4">Origine</th><th className="p-4">Payeur</th><th className="p-4">Moyen</th>
                                <th className="p-4">Montant</th><th className="p-4 text-[#430fd1]">Commission</th><th className="p-4">Statut</th><th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Chargement des paiements…</td></tr>
                            ) : filtres.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500 font-bold">Aucun paiement dans cette liste.</td></tr>
                            ) : filtres.map((p) => {
                                const st = STATUTS[p.statut] || { label: p.statut, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
                                const Icone = st.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition align-top">
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-slate-700 select-all">{p.referenceClient || p.transactionId}</div>
                                            <div className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleString('fr-FR')}</div>
                                        </td>
                                        <td className="p-4"><div className="font-bold">{origine(p)}</div><div className="text-xs text-slate-500">{TYPES[p.typePaiement] || p.typePaiement}</div></td>
                                        <td className="p-4"><div className="font-bold">{p.nom}</div><div className="text-xs text-slate-500 select-all">{p.telephone}</div></td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg w-max border border-slate-200">
                                                <IconeMode mode={p.modePaiement} /><span className="text-xs font-bold text-slate-600">{MODES[p.modePaiement] || p.modePaiement}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black">{formatMontant(p.montant)}</td>
                                        <td className="p-4 font-black text-[#13d484]">{commissionDe(p) > 0 ? `+${formatMontant(commissionDe(p))}` : '—'}</td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider w-max ${st.color}`}><Icone size={14} /> {st.label}</span>
                                            {p.motif && <div className="text-[11px] text-slate-500 mt-1 max-w-[180px]">Motif : {p.motif}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {p.statut === 'en_attente' && (
                                                <div className="flex gap-2 justify-center">
                                                    <button disabled={enCours === p.id} onClick={() => changerStatut(p, 'valide')} className="px-3 py-1.5 bg-[#13d484] text-white rounded-lg text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 transition">Valider</button>
                                                    <button disabled={enCours === p.id} onClick={() => changerStatut(p, 'rejete')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition">Refuser</button>
                                                </div>
                                            )}
                                            {p.statut === 'valide' && (
                                                <button disabled={enCours === p.id} onClick={() => changerStatut(p, 'rembourse')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-50 transition">Rembourser</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}