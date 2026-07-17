import React, { useState, useEffect } from 'react';
import { adminCreerReservation, getServices, getFournisseursParService } from '../util/api';
import { X, CheckCircle, Loader2, PhoneCall } from 'lucide-react';

export default function CreateMissionModal({ onClose, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [accordTelephone, setAccordTelephone] = useState(false); // 📞 Ajout option Cas 3

    const [formData, setFormData] = useState({
        clientNom: '',
        telephone: '',
        serviceId: '',
        fournisseurId: '',
        dateIntervention: '',
        adresse: '',
        besoin: ''
    });

    // 1. Chargement initial des services
    useEffect(() => {
        getServices().then(data => {
            const liste = Array.isArray(data) ? data : (data?.data || []);
            setServices(liste);
            if (liste.length > 0) {
                setFormData(prev => ({ ...prev, serviceId: liste[0].id.toString() }));
            }
        });
    }, []);

    // 2. Chargement et réinitialisation du prestataire à chaque changement de service
    useEffect(() => {
        const loadFournisseurs = async () => {
            if (!formData.serviceId) return;
            try {
                const res = await getFournisseursParService(formData.serviceId);
                setFournisseurs(res?.data || []);
                // 🟢 CORRECTION 1 : On vide le prestataire précédent pour éviter le "prestataire fantôme"
                setFormData(prev => ({ ...prev, fournisseurId: '' }));
            } catch (e) {
                setFournisseurs([]);
                setFormData(prev => ({ ...prev, fournisseurId: '' }));
            }
        };
        loadFournisseurs();
    }, [formData.serviceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminCreerReservation({
                ...formData,
                serviceId: parseInt(formData.serviceId, 10),
                fournisseurId: formData.fournisseurId ? parseInt(formData.fournisseurId, 10) : null,
                accordTelephone // 🟢 Envoi de l'info pour validation directe au backend
            });
            onRefresh();
            onClose();
        } catch (err) {
            alert("Erreur lors de la création : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-black border border-violet-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header Violet */}
                <div className="px-6 py-4 border-b border-violet-900 flex justify-between items-center bg-violet-950/30">
                    <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
                        <CheckCircle className="text-violet-500" size={20} /> Nouvelle Mission
                    </h2>
                    <button onClick={onClose} className="text-violet-400 hover:text-white transition"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Infos Client */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Client</label>
                            {/* 🟢 CORRECTION 2 : Ajout de l'attribut "value" pour contrôler l'input */}
                            <input
                                value={formData.clientNom}
                                onChange={e => setFormData({ ...formData, clientNom: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Téléphone</label>
                            <input
                                value={formData.telephone}
                                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                                required
                            />
                        </div>
                    </div>

                    {/* Services & Prestataires */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Service</label>
                            <select
                                value={formData.serviceId}
                                onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                            >
                                {services.map(s => <option key={s.id} value={s.id} className="bg-slate-950">{s.nom}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Prestataire</label>
                            <select
                                value={formData.fournisseurId}
                                onChange={e => setFormData({ ...formData, fournisseurId: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                            >
                                <option value="" className="bg-slate-950">--- Sélectionner ---</option>
                                {fournisseurs.map(f => <option key={f.id} value={f.id} className="bg-slate-950">{f.nom || f.prenom || `Prestataire #${f.id}`}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Lieu & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Date Intervention</label>
                            <input
                                type="datetime-local"
                                value={formData.dateIntervention}
                                onChange={e => setFormData({ ...formData, dateIntervention: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Lieu (Adresse)</label>
                            <input
                                value={formData.adresse}
                                onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition"
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-violet-400 font-bold tracking-widest">Description du besoin</label>
                        <textarea
                            value={formData.besoin}
                            onChange={e => setFormData({ ...formData, besoin: e.target.value })}
                            className="w-full bg-violet-950/20 border border-violet-900 rounded-lg p-3 text-white outline-none focus:border-violet-500 transition h-24"
                            placeholder="Détails de la mission..."
                        />
                    </div>

                    {/* 🟢 CORRECTION 3 : Option pour accord téléphonique direct à la création */}
                    {formData.fournisseurId && (
                        <div className="p-3 bg-violet-950/20 border border-violet-900/50 rounded-xl">
                            <label className="flex items-center gap-2 text-xs text-violet-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={accordTelephone}
                                    onChange={(e) => setAccordTelephone(e.target.checked)}
                                    className="rounded border-violet-900 bg-black text-violet-600 focus:ring-0"
                                />
                                <span className="flex items-center gap-1 font-semibold text-violet-400">
                                    <PhoneCall size={14} /> Accord téléphonique obtenu (Valider directement sans attente)
                                </span>
                            </label>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-lg shadow-violet-900/20 flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Valider la Mission"}
                    </button>
                </form>
            </div>
        </div>
    );
}