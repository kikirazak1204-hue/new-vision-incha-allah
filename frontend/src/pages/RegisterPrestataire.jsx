import React, { useEffect, useState } from 'react';
import { getServices, registerUser, registerFournisseur } from '../util/api';

const SERVICES_DIPLOME = ['médecin', 'docteur', 'avocat', 'enseignant', 'professeur', 'comptable', 'architecte', 'ingénieur', 'pharmacien', 'infirmier', 'notaire'];

const requiresDiplome = (serviceName) => {
    if (!serviceName) return false;
    return SERVICES_DIPLOME.some((s) => serviceName.toLowerCase().includes(s));
};

function FileUpload({ label, preview, onChange, optional }) {
    return (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/60 p-4 cursor-pointer hover:border-purple-500/40 transition min-h-[140px]">
            {preview ? (
                <img src={preview} alt="aperçu" className="h-24 w-full object-cover rounded-xl" />
            ) : (
                <span className="text-slate-500 text-sm text-center">
                    {label}{optional && <span className="ml-1 text-slate-600">(optionnel)</span>}
                </span>
            )}
            <input type="file" accept="image/*,.pdf" onChange={onChange} className="hidden" />
            <span className="text-xs text-slate-600">
                {preview ? '✅ Fichier sélectionné — cliquer pour changer' : 'Cliquer pour choisir'}
            </span>
        </label>
    );
}

export default function RegisterPrestataire({ setCurrentView }) {
    const [form, setForm] = useState({
        nom: '',
        nomEntreprise: '',
        email: '',
        password: '',
        telephone: '',
        ville: '',
        adresse: '',
        quartier: '',
        secteur: '',
        description: '',
        serviceId: '',
        hasTransport: false,
        hasMateriel: false,
        immatriculation: '',
        anneesExperience: '',
        saitLireEcrire: '',
        referenceClient: '',
    });

    const [files, setFiles] = useState({
        cniRecto: null,
        cniVerso: null,
        selfie: null,
        diplome: null,
        vehicule: null,
    });

    const [previews, setPreviews] = useState({
        cniRecto: null,
        cniVerso: null,
        selfie: null,
        diplome: null,
        vehicule: null,
    });

    const [services, setServices] = useState([]);
    const [selectedServiceName, setSelectedServiceName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getServices()
            .then((res) => setServices(res.data || []))
            .catch((err) => { console.error('Erreur chargement services :', err); setServices([]); });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'serviceId') {
            const svc = services.find((s) => String(s.id) === String(value));
            setSelectedServiceName(svc ? svc.nom : '');
        }
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFile = (field) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFiles((prev) => ({ ...prev, [field]: file }));
        setPreviews((prev) => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

    const diplomeRequired = requiresDiplome(selectedServiceName);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!form.nom || !form.email || !form.password || !form.nomEntreprise || !form.serviceId) {
            setMessage('❌ Merci de remplir les champs obligatoires.'); return;
        }
        if (!files.cniRecto) { setMessage('❌ La photo CNI (recto) est obligatoire.'); return; }
        if (!files.cniVerso) { setMessage('❌ La photo CNI (verso) est obligatoire.'); return; }
        if (!files.selfie) { setMessage('❌ La photo personnelle (selfie) est obligatoire.'); return; }
        if (!form.saitLireEcrire) { setMessage('❌ Veuillez indiquer si vous savez lire et écrire le français.'); return; }
        if (diplomeRequired && !files.diplome) { setMessage('❌ Un diplôme ou certificat est obligatoire pour ce service.'); return; }
        if (form.hasTransport && !files.vehicule) { setMessage('❌ La photo du véhicule est obligatoire si vous avez le transport.'); return; }

        setLoading(true);
        try {
            const auth = await registerUser({
                nom: form.nom,
                email: form.email,
                password: form.password,
                telephone: form.telephone,
                ville: form.ville,
                role: 'fournisseur',
            });

            if (!auth.success || !auth.token) throw new Error(auth.message || 'Erreur lors de la création du compte.');

            localStorage.setItem('token', auth.token);
            localStorage.setItem('user', JSON.stringify(auth.user));

            const formData = new FormData();
            formData.append('userId', auth.user.id);
            formData.append('serviceId', form.serviceId);
            formData.append('nomEntreprise', form.nomEntreprise);
            formData.append('adresse', form.adresse);
            formData.append('quartier', form.quartier);
            formData.append('secteur', form.secteur);
            formData.append('telephone', form.telephone);
            formData.append('description', form.description);
            formData.append('hasTransport', form.hasTransport);
            formData.append('hasMateriel', form.hasMateriel);
            formData.append('anneesExperience', form.anneesExperience);
            formData.append('saitLireEcrire', form.saitLireEcrire);
            formData.append('referenceClient', form.referenceClient);
            if (form.hasTransport) formData.append('immatriculation', form.immatriculation);

            formData.append('cniRecto', files.cniRecto);
            formData.append('cniVerso', files.cniVerso);
            formData.append('selfie', files.selfie);
            if (files.diplome) formData.append('diplome', files.diplome);
            if (files.vehicule) formData.append('photoVehicule', files.vehicule);

            const profil = await registerFournisseur(formData, auth.token);

            if (!profil.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error(profil.message || 'Erreur création profil fournisseur.');
            }

            setMessage('✅ Inscription réussie ! Redirection en cours...');
            setTimeout(() => setCurrentView && setCurrentView('dashboardPrestataire'), 1200);
        } catch (err) {
            console.error('Erreur inscription fournisseur :', err);
            setMessage('❌ ' + (err.message || 'Erreur serveur. Réessayez plus tard.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased px-4 py-10">
            <div className="max-w-4xl mx-auto bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-xl">

                <div className="mb-8 text-center">
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
                        🏢 Espace prestataire
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Inscription Fournisseur</h1>
                    <p className="mt-3 text-slate-400 text-sm sm:text-base">
                        Rejoignez la plateforme pour proposer vos prestations et accéder à votre espace prestataire.
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 rounded-2xl p-4 text-center font-semibold text-sm border ${message.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                        {message}
                    </div>
                )}

                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>

                    {/* ── SECTION 1 ── */}
                    <div className="col-span-2">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Informations personnelles
                        </p>
                    </div>

                    <input name="nom" type="text" value={form.nom} onChange={handleChange}
                        placeholder="Votre nom *" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="Email *" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="password" type="password" value={form.password} onChange={handleChange}
                        placeholder="Mot de passe *" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="telephone" type="tel" value={form.telephone} onChange={handleChange}
                        placeholder="Téléphone" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="ville" type="text" value={form.ville} onChange={handleChange}
                        placeholder="Ville" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="adresse" type="text" value={form.adresse} onChange={handleChange}
                        placeholder="Adresse" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="quartier" type="text" value={form.quartier} onChange={handleChange}
                        placeholder="Quartier" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <input name="secteur" type="text" value={form.secteur} onChange={handleChange}
                        placeholder="Secteur" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />

                    {/* ── SECTION 2 ── */}
                    <div className="col-span-2 mt-2">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Entreprise & Service
                        </p>
                    </div>

                    <input name="nomEntreprise" type="text" value={form.nomEntreprise} onChange={handleChange}
                        placeholder="Nom de l'entreprise *" className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    <select name="serviceId" value={form.serviceId} onChange={handleChange}
                        className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-purple-500/50 outline-none transition">
                        <option value="">Sélectionnez votre service *</option>
                        {services.map((service) => (
                            <option key={service.id} value={service.id} className="bg-slate-900 text-white">{service.nom}</option>
                        ))}
                    </select>

                    <textarea name="description" value={form.description} onChange={handleChange}
                        placeholder="Description de votre activité"
                        className="w-full col-span-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition min-h-[100px]" />

                    {/* ── SECTION 3 ── */}
                    <div className="col-span-2 mt-2">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Expérience & Compétences
                        </p>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-slate-400 text-sm mb-2">Depuis combien d'années exercez-vous ce travail ?</label>
                        <select name="anneesExperience" value={form.anneesExperience} onChange={handleChange}
                            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-purple-500/50 outline-none transition">
                            <option value="">Sélectionnez</option>
                            <option value="moins1" className="bg-slate-900">Moins d'1 an</option>
                            <option value="1-2" className="bg-slate-900">1 à 2 ans</option>
                            <option value="3-5" className="bg-slate-900">3 à 5 ans</option>
                            <option value="6-10" className="bg-slate-900">6 à 10 ans</option>
                            <option value="plus10" className="bg-slate-900">Plus de 10 ans</option>
                        </select>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-slate-400 text-sm mb-2">Savez-vous lire et écrire le français ? *</label>
                        <div className="flex gap-3">
                            <label className="flex-1 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 cursor-pointer hover:border-purple-500/30 transition">
                                <input type="radio" name="saitLireEcrire" value="oui" checked={form.saitLireEcrire === 'oui'} onChange={handleChange} className="h-4 w-4 accent-purple-500" />
                                <span className="text-sm text-slate-200">✅ Oui</span>
                            </label>
                            <label className="flex-1 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 cursor-pointer hover:border-purple-500/30 transition">
                                <input type="radio" name="saitLireEcrire" value="non" checked={form.saitLireEcrire === 'non'} onChange={handleChange} className="h-4 w-4 accent-purple-500" />
                                <span className="text-sm text-slate-200">❌ Non</span>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-slate-400 text-sm mb-2">
                            Numéro d'un client ou d'une entreprise satisfait(e) <span className="text-slate-600">(optionnel)</span>
                        </label>
                        <input name="referenceClient" type="tel" value={form.referenceClient} onChange={handleChange}
                            placeholder="Ex: +227 90 00 00 00"
                            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition" />
                    </div>

                    {/* ── SECTION 4 ── */}
                    <div className="col-span-2 mt-2">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Capacités
                        </p>
                    </div>

                    <div className="col-span-2 grid gap-4 md:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 cursor-pointer hover:border-purple-500/30 transition">
                            <input type="checkbox" name="hasTransport" checked={form.hasTransport} onChange={handleChange} className="h-4 w-4 rounded accent-purple-500" />
                            <span className="text-slate-200">🚗 Transport disponible</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 cursor-pointer hover:border-purple-500/30 transition">
                            <input type="checkbox" name="hasMateriel" checked={form.hasMateriel} onChange={handleChange} className="h-4 w-4 rounded accent-purple-500" />
                            <span className="text-slate-200">🛠️ Matériel disponible</span>
                        </label>
                    </div>

                    {form.hasTransport && (
                        <div className="col-span-2 grid gap-4 md:grid-cols-2">
                            <FileUpload label="📸 Photo du véhicule *" preview={previews.vehicule} onChange={handleFile('vehicule')} />
                            <input name="immatriculation" type="text" value={form.immatriculation} onChange={handleChange}
                                placeholder="Numéro d'immatriculation"
                                className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none transition self-start" />
                        </div>
                    )}

                    {/* ── SECTION 5 ── */}
                    <div className="col-span-2 mt-2">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full" /> Documents d'identité
                        </p>
                    </div>

                    <div className="col-span-2 grid gap-4 md:grid-cols-3">
                        <FileUpload label="🪪 CNI Recto *" preview={previews.cniRecto} onChange={handleFile('cniRecto')} />
                        <FileUpload label="🪪 CNI Verso *" preview={previews.cniVerso} onChange={handleFile('cniVerso')} />
                        <FileUpload label="🤳 Photo personnelle (selfie) *" preview={previews.selfie} onChange={handleFile('selfie')} />
                    </div>

                    <div className="col-span-2">
                        {diplomeRequired && (
                            <p className="text-amber-400 text-sm mb-2 font-semibold">
                                ⚠️ Ce service exige un diplôme ou certificat professionnel.
                            </p>
                        )}
                        <FileUpload
                            label={diplomeRequired ? "🎓 Diplôme / Certification *" : "🎓 Diplôme / Certification"}
                            preview={previews.diplome}
                            onChange={handleFile('diplome')}
                            optional={!diplomeRequired}
                        />
                    </div>

                    {/* ── BOUTON ── */}
                    <button type="submit" disabled={loading}
                        className={`col-span-2 py-4 rounded-2xl font-bold transition mt-4 ${loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/10 hover:shadow-purple-600/20 hover:opacity-95'}`}>
                        {loading ? '⏳ Inscription en cours...' : "✅ S'inscrire comme fournisseur"}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-500 text-sm">
                    Déjà inscrit ?{' '}
                    <button onClick={() => setCurrentView && setCurrentView('login')} className="text-purple-400 hover:text-purple-300 font-semibold transition">
                        Connectez-vous
                    </button>
                </p>
            </div>
        </div>
    );
}