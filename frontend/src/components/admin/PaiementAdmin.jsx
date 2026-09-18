import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, DollarSign, TrendingUp, Clock, 
    CheckCircle2, XCircle, MoreVertical, Smartphone, 
    CreditCard, Banknote, ShieldCheck, Download
} from 'lucide-react';

// ============================================================================
// Utilitaires de formatage
// ============================================================================
const formatStatut = (statut) => {
    const config = {
        'complete': { label: 'Payé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        'en_attente': { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
        'echoue': { label: 'Échoué', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };
    return config[statut] || { label: statut, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
};

const getMethodIcon = (methode) => {
    switch(methode) {
        case 'mobile_money': return <Smartphone size={16} className="text-amber-500" />;
        case 'carte': return <CreditCard size={16} className="text-blue-500" />;
        case 'especes': return <Banknote size={16} className="text-emerald-500" />;
        default: return <DollarSign size={16} />;
    }
};

const formatMontant = (montant) => new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function PaiementAdmin() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState('tous');
    const [recherche, setRecherche] = useState('');

    // Simulation de récupération des données depuis ton backend
    useEffect(() => {
        setTimeout(() => {
            setTransactions([
                { id: 'TRX-98231', date: '2026-09-18T10:30:00', client: 'Safia Toure', service: 'Nettoyage Appartement', montantTotal: 25000, commission: 2500, methode: 'mobile_money', statut: 'complete' },
                { id: 'TRX-98232', date: '2026-09-18T11:15:00', client: 'Amadou Diallo', service: 'Plomberie', montantTotal: 15000, commission: 1500, methode: 'especes', statut: 'en_attente' },
                { id: 'TRX-98233', date: '2026-09-17T15:45:00', client: 'Marie Dubois', service: 'Réparation Climatisation', montantTotal: 45000, commission: 4500, methode: 'carte', statut: 'complete' },
                { id: 'TRX-98234', date: '2026-09-17T09:20:00', client: 'Ousmane Sy', service: 'Électricité', montantTotal: 12000, commission: 1200, methode: 'mobile_money', statut: 'echoue' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    // Statistiques globales
    const stats = {
        volumeTotal: transactions.filter(t => t.statut === 'complete').reduce((acc, curr) => acc + curr.montantTotal, 0),
        commissionsGagnees: transactions.filter(t => t.statut === 'complete').reduce((acc, curr) => acc + curr.commission, 0),
        enAttente: transactions.filter(t => t.statut === 'en_attente').length
    };

    // Filtrage
    const transactionsFiltrees = transactions.filter(t => {
        const matchRecherche = t.client.toLowerCase().includes(recherche.toLowerCase()) || t.id.toLowerCase().includes(recherche.toLowerCase());
        const matchStatut = filtreStatut === 'tous' || t.statut === filtreStatut;
        return matchRecherche && matchStatut;
    });

    const handleValiderPaiement = (id) => {
        if(window.confirm("Confirmez-vous que ce paiement en espèces a bien été perçu (ou que la commission a été réglée) ?")) {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, statut: 'complete' } : t));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-[#061a3a] p-4 md:p-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#061a3a] flex items-center gap-2">
                        <ShieldCheck className="text-[#430fd1]" size={32} />
                        Gestion des Paiements
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Supervisez les flux financiers et les commissions Kanari.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:border-[#13d484] transition">
                    <Download size={18} className="text-[#13d484]" /> Exporter CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={64} color="#430fd1" /></div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Volume des ventes</span>
                    <div className="text-3xl font-black text-[#061a3a] mt-2">{formatMontant(stats.volumeTotal)}</div>
                    <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-2">
                        <TrendingUp size={14} /> +12% ce mois
                    </span>
                </div>

                <div className="bg-[#430fd1] p-6 rounded-3xl shadow-lg border border-[#430fd1] relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-6 opacity-20"><TrendingUp size={64} color="#ffffff" /></div>
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Commissions Kanari</span>
                    <div className="text-3xl font-black text-white mt-2">{formatMontant(stats.commissionsGagnees)}</div>
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 mt-2">
                        Bénéfice net plateforme
                    </span>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Clock size={64} color="#f59e0b" /></div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">À valider (Espèces)</span>
                    <div className="text-3xl font-black text-[#061a3a] mt-2">{stats.enAttente}</div>
                    <span className="text-xs font-semibold text-amber-500 mt-2 block">
                        Paiements nécessitant votre action
                    </span>
                </div>
            </div>

            {/* Filtres et Recherche */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par ID, Client..." 
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:border-[#13d484] focus:ring-1 focus:ring-[#13d484]"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="text-slate-400" size={18} />
                    <select 
                        value={filtreStatut} 
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold outline-none focus:border-[#13d484]"
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="complete">Payés</option>
                        <option value="en_attente">En attente</option>
                        <option value="echoue">Échoués</option>
                    </select>
                </div>
            </div>

            {/* Table des Transactions */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-500 tracking-wider">
                                <th className="p-4 pl-6">ID Réf</th>
                                <th className="p-4">Client & Service</th>
                                <th className="p-4">Méthode</th>
                                <th className="p-4">Montant Total</th>
                                <th className="p-4 text-[#430fd1]">Commission</th>
                                <th className="p-4">Statut</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400">
                                        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#13d484] rounded-full animate-spin mx-auto mb-2"></div>
                                        Chargement des transactions...
                                    </td>
                                </tr>
                            ) : transactionsFiltrees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">Aucune transaction trouvée.</td>
                                </tr>
                            ) : (
                                transactionsFiltrees.map((trx) => {
                                    const statutInfo = formatStatut(trx.statut);
                                    const StatusIcon = statutInfo.icon;

                                    return (
                                        <tr key={trx.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 pl-6 font-bold text-slate-700">{trx.id}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-[#061a3a]">{trx.client}</div>
                                                <div className="text-xs text-slate-500">{trx.service}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg w-max border border-slate-200">
                                                    {getMethodIcon(trx.methode)}
                                                    <span className="text-xs font-bold text-slate-600 capitalize">
                                                        {trx.methode.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-black text-[#061a3a]">{formatMontant(trx.montantTotal)}</td>
                                            <td className="p-4 font-black text-[#13d484] bg-emerald-50/30">
                                                +{formatMontant(trx.commission)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider w-max ${statutInfo.color}`}>
                                                    <StatusIcon size={14} /> {statutInfo.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {trx.statut === 'en_attente' ? (
                                                    <button 
                                                        onClick={() => handleValiderPaiement(trx.id)}
                                                        className="px-3 py-1.5 bg-[#13d484] text-white rounded-lg text-xs font-bold hover:bg-emerald-500 shadow-sm transition"
                                                    >
                                                        Valider
                                                    </button>
                                                ) : (
                                                    <button className="p-1.5 text-slate-400 hover:text-[#430fd1] transition rounded-lg hover:bg-slate-100 mx-auto block">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}