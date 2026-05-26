import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getServices, registerUser } from '../util/api';

const SERVICES_FALLBACK = [
    { id: 'ELECTRICITE', nom: 'Électricité', emoji: '🔌' },
    { id: 'PLOMBERIE', nom: 'Plomberie', emoji: '🚰' },
    { id: 'MECANIQUE', nom: 'Mécanique', emoji: '🚗' },
    { id: 'TRANSPORTS', nom: 'Transports', emoji: '🚚' },
    { id: 'MENAGE', nom: 'Ménage', emoji: '🧹' },
    { id: 'COUTURE', nom: 'Couture', emoji: '👗' },
    { id: 'COUIFFURE', nom: 'Coiffure / Beauté', emoji: '💇‍♀️' },
    { id: 'BATIMENT', nom: 'Bâtiment', emoji: '🏗️' },
    { id: 'REPARATION', nom: 'Réparation', emoji: '🛠️' },
    { id: 'LIVRAISION', nom: 'Livraison', emoji: '🚴‍♂️' },
    { id: 'ALIMENTATION', nom: 'Alimentation', emoji: '🛒' },
    { id: 'EDUCTION', nom: 'Éducation', emoji: '📚' },
    { id: 'MEDECINE', nom: 'Médecine', emoji: '🏥' },
    { id: 'SECURITE', nom: 'Sécurité', emoji: '🛡️' },
    { id: 'SPORT', nom: 'Sport', emoji: '🏋️‍♂️' },
    { id: 'DIVERTISSEMENT', nom: 'Divertissement', emoji: '🎉' },
    { id: 'HOTELLERIE', nom: 'Hôtellerie', emoji: '🏨' },
    { id: 'LOCATION', nom: 'Location', emoji: '🔑' },
    { id: 'AVOCAT', nom: 'Avocat / Juridique', emoji: '⚖️' },
    { id: 'ARTISANAT', nom: 'Artisanat', emoji: '🧵' },
    { id: 'FLEURISTE', nom: 'Fleuriste', emoji: '🌸' },
    { id: 'ACCESOIRE', nom: 'Accessoires', emoji: '🎒' },
    { id: 'FOURNISSEUR_PRODUIT', nom: 'Fournisseur de produits', emoji: '📦' },
    { id: 'MISSION', nom: 'Mission / Freelance', emoji: '💼' },
    { id: 'RENCONTRE', nom: 'Rencontre / Réseau', emoji: '🤝' },
    { id: 'ASSSURENCE', nom: 'Assurance', emoji: '📄' },
    { id: 'PRISE', nom: 'Prise de rendez-vous', emoji: '📅' },
    { id: 'CAISSE', nom: 'Caisse / Paiement', emoji: '💳' },
    { id: 'BENEVOLLA', nom: 'Bénévolat', emoji: '🤲' },
    { id: 'CLIMATISATION', nom: 'Climatisation', emoji: '❄️' },
];

const ETAPES = [
    { id: 1, label: 'Infos personnelles', icon: '👤' },
    { id: 2, label: 'Documents identité', icon: '📄' },
    { id: 3, label: 'Services & Équipement', icon: '🛠️' },
    { id: 4, label: 'Confirmation', icon: '✅' },
];

export default function Register() {
    const [etape, setEtape] = useState(1);
    const [services, setServices] = useState(SERVICES_FALLBACK);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nom: '', ville: '', quartier: '', telephone: '',
        email: '', password: '', confirmPassword: '', description: '',
        hasTransport: false, hasMateriel: false,
    });

    const [docs, setDocs] = useState({
        cniRecto: null, cniVerso: null, selfie: null,
        diplome: null, carteProf: null,
    });
    const [previews, setPreviews] = useState({});
    const [servicesChoisis, setServicesChoisis] = useState([]);

    useEffect(() => {
        getServices()
            .then(res => {
                const data = res.data || [];
                setServices(data.length > 0 ? data : SERVICES_FALLBACK);
            })
            .catch(() => setServices(SERVICES_FALLBACK));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleDoc = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        setDocs(prev => ({ ...prev, [key]: file }));
        const reader = new FileReader();
        reader.onload = (ev) => setPreviews(prev => ({ ...prev, [key]: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const toggleService = (id) => {
        setServicesChoisis(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const validerEtape = () => {
        setMessage('');
        if (etape === 1) {
            if (!form.nom || !form.email || !form.password || !form.telephone || !form.ville) {
                setMessage('❌ Veuillez remplir tous les champs obligatoires.');
                return false;
            }
            if (form.password !== form.confirmPassword) {
                setMessage('❌ Les mots de passe ne correspondent pas.');
                return false;
            }
            if (form.password.length < 6) {
                setMessage('❌ Le mot de passe doit contenir au moins 6 caractères.');
                return false;
            }
        }
        if (etape === 2) {
            if (!docs.cniRecto || !docs.cniVerso || !docs.selfie) {
                setMessage('❌ La carte d\'identité (recto/verso) et le selfie sont obligatoires.');
                return false;
            }
        }
        if (etape === 3) {
            if (servicesChoisis.length === 0) {
                setMessage('❌ Veuillez choisir au moins un service.');
                return false;
            }
        }
        return true;
    };

    const suivant = () => { if (validerEtape()) setEtape(prev => prev + 1); };
    const precedent = () => { setMessage(''); setEtape(prev => prev - 1); };

    const handleSubmit = async () => {
        setLoading(true);
        setMessage('');
        try {
            const data = await registerUser({ ...form, role: 'fournisseur' });
            if (!data.success || !data.token) {
                setMessage('❌ ' + (data.message || 'Erreur lors de l\'inscription.'));
                return;
            }
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            const formData = new FormData();
            formData.append('nomEntreprise', form.nom);
            formData.append('adresse', form.ville);
            formData.append('quartier', form.quartier);
            formData.append('telephone', form.telephone);
            formData.append('email', form.email);
            formData.append('description', form.description);
            formData.append('userId', data.user.id);
            formData.append('serviceId', servicesChoisis[0]);
            formData.append('servicesIds', JSON.stringify(servicesChoisis));
            formData.append('hasTransport', form.hasTransport);
            formData.append('hasMateriel', form.hasMateriel);
            formData.append('statut', 'EN_ATTENTE');

            if (docs.cniRecto) formData.append('cniRecto', docs.cniRecto);
            if (docs.cniVerso) formData.append('cniVerso', docs.cniVerso);
            if (docs.selfie) formData.append('selfie', docs.selfie);
            if (docs.diplome) formData.append('diplome', docs.diplome);
            if (docs.carteProf) formData.append('carteProf', docs.carteProf);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/fournisseurs`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${data.token}` },
                    body: formData,
                }
            ).then(r => r.json());

            if (!res.success) {
                setMessage('❌ ' + (res.message || 'Erreur création fournisseur.'));
                return;
            }

            setMessage('✅ Dossier soumis ! En attente de validation par New Vision.');
            setTimeout(() => navigate('/dashboard-fournisseur'), 2500);

        } catch (err) {
            console.error('Erreur inscription:', err);
            setMessage('❌ Erreur serveur. Réessayez plus tard.');
        } finally {
            setLoading(false);
        }
    };

    const UploadDoc = ({ label, docKey, obligatoire }) => (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/80">
                {label} {obligatoire
                    ? <span className="text-red-400">*</span>
                    : <span className="text-white/40 text-xs">(optionnel)</span>}
            </label>
            <div className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
                ${previews[docKey] ? 'border-green-500 bg-green-900/20' : 'border-white/20 hover:border-white/40 bg-white/5'}`}>
                <input type="file" accept="image/*"
                    onChange={(e) => handleDoc(e, docKey)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                {previews[docKey] ? (
                    <div className="space-y-2">
                        <img src={previews[docKey]} alt={label} className="w-full h-32 object-cover rounded-lg" />
                        <p className="text-green-400 text-xs font-semibold">✅ {docs[docKey]?.name}</p>
                    </div>
                ) : (
                    <div className="py-4">
                        <p className="text-3xl mb-2">📎</p>
                        <p className="text-white/60 text-sm">Cliquez pour uploader</p>
                        <p className="text-white/30 text-xs mt-1">JPG, PNG — max 5MB</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen px-4 py-10 text-white">
            <div className="fixed inset-0 -z-10" style={{
                background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 30%, #1e0a3e 60%, #050d1f 100%)',
            }} />
            <div className="fixed inset-0 -z-10" style={{
                background: 'radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.2) 0%, transparent 50%)',
            }} />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Inscription Fournisseur</h1>
                    <p className="text-white/50 mt-2 text-sm">Rejoignez New Vision et proposez vos services</p>
                </div>

                {/* Barre progression */}
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                        {ETAPES.map((e, i) => (
                            <div key={e.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                        ${etape > e.id ? 'bg-green-500 text-white' :
                                            etape === e.id ? 'bg-purple-600 text-white ring-4 ring-purple-400/30' :
                                                'bg-white/10 text-white/40'}`}>
                                        {etape > e.id ? '✓' : e.icon}
                                    </div>
                                    <span className={`text-xs hidden sm:block ${etape === e.id ? 'text-white' : 'text-white/40'}`}>
                                        {e.label}
                                    </span>
                                </div>
                                {i < ETAPES.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-2 transition-all ${etape > e.id ? 'bg-green-500' : 'bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-8 space-y-6 shadow-xl">

                    {message && (
                        <div className={`text-center font-semibold p-3 rounded-xl border ${message.startsWith('✅')
                            ? 'text-green-400 bg-green-900/30 border-green-500/30'
                            : 'text-red-400 bg-red-900/30 border-red-500/30'}`}>
                            {message}
                        </div>
                    )}

                    {/* ÉTAPE 1 */}
                    {etape === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">👤 Informations personnelles</h2>
                            <p className="text-white/50 text-sm">Ces informations seront visibles sur votre profil public.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'nom', placeholder: 'Nom complet / Entreprise *', type: 'text' },
                                    { name: 'telephone', placeholder: 'Téléphone *', type: 'tel' },
                                    { name: 'ville', placeholder: 'Ville *', type: 'text' },
                                    { name: 'quartier', placeholder: 'Quartier / Zone', type: 'text' },
                                    { name: 'email', placeholder: 'Email *', type: 'email' },
                                ].map(f => (
                                    <input key={f.name} name={f.name} type={f.type}
                                        placeholder={f.placeholder} value={form[f.name]}
                                        onChange={handleChange}
                                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/10 focus:border-purple-500 outline-none" />
                                ))}
                            </div>
                            <textarea name="description" rows={3}
                                placeholder="Décrivez votre activité (optionnel)"
                                value={form.description} onChange={handleChange}
                                className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/10 focus:border-purple-500 outline-none resize-none" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="password" type="password" placeholder="Mot de passe *"
                                    value={form.password} onChange={handleChange}
                                    className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/10 focus:border-purple-500 outline-none" />
                                <input name="confirmPassword" type="password" placeholder="Confirmer mot de passe *"
                                    value={form.confirmPassword} onChange={handleChange}
                                    className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/10 focus:border-purple-500 outline-none" />
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 2 */}
                    {etape === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold">📄 Documents d'identité</h2>
                                <p className="text-white/50 text-sm mt-1">Confidentiels — utilisés uniquement pour vérifier votre identité.</p>
                            </div>
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                                <p className="text-red-400 font-semibold text-sm mb-4">🔴 Documents obligatoires</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <UploadDoc label="CNI — Recto" docKey="cniRecto" obligatoire />
                                    <UploadDoc label="CNI — Verso" docKey="cniVerso" obligatoire />
                                    <UploadDoc label="Selfie (photo de vous)" docKey="selfie" obligatoire />
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-white/60 font-semibold text-sm mb-4">🟡 Documents optionnels — accélèrent votre validation</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <UploadDoc label="Diplôme / Certificat" docKey="diplome" obligatoire={false} />
                                    <UploadDoc label="Carte professionnelle" docKey="carteProf" obligatoire={false} />
                                </div>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 text-blue-300 text-sm">
                                🔒 Documents chiffrés — accessibles uniquement par l'équipe New Vision.
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 3 */}
                    {etape === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">🛠️ Services & Équipement</h2>
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Vos services <span className="text-red-400">*</span></h3>
                                <p className="text-white/50 text-xs mb-3">Sélectionnez tous les services que vous proposez.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                                    {services.map(service => {
                                        const sid = service.id || service.code || service.nom;
                                        return (
                                            <label key={sid}
                                                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all
                                                    ${servicesChoisis.includes(sid)
                                                        ? 'bg-purple-600/30 border-purple-500 text-white'
                                                        : 'bg-white/5 border-white/10 hover:border-white/30 text-white/70'}`}>
                                                <input type="checkbox"
                                                    checked={servicesChoisis.includes(sid)}
                                                    onChange={() => toggleService(sid)}
                                                    className="accent-purple-500" />
                                                <span className="text-sm">{service.emoji} {service.nom}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {servicesChoisis.length > 0 && (
                                    <p className="mt-2 text-xs text-purple-300">{servicesChoisis.length} service(s) sélectionné(s)</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Vos capacités logistiques</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { name: 'hasTransport', icon: '🚗', title: 'J\'ai un transport', sub: 'Vélo, moto, voiture...' },
                                        { name: 'hasMateriel', icon: '🔧', title: 'J\'ai mon matériel', sub: 'Outils, équipements...' },
                                    ].map(item => (
                                        <label key={item.name}
                                            className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all
                                                ${form[item.name]
                                                    ? 'border-green-500 bg-green-900/20'
                                                    : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                                            <input type="checkbox" name={item.name}
                                                checked={form[item.name]} onChange={handleChange}
                                                className="accent-green-500 w-5 h-5" />
                                            <div>
                                                <p className="font-bold">{item.icon} {item.title}</p>
                                                <p className="text-sm text-white/50">{item.sub}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ÉTAPE 4 */}
                    {etape === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">✅ Récapitulatif</h2>
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                                    <h3 className="font-bold text-purple-400">👤 Informations</h3>
                                    <p><span className="text-white/50">Nom :</span> {form.nom}</p>
                                    <p><span className="text-white/50">Email :</span> {form.email}</p>
                                    <p><span className="text-white/50">Téléphone :</span> {form.telephone}</p>
                                    <p><span className="text-white/50">Ville :</span> {form.ville}{form.quartier && ` — ${form.quartier}`}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                                    <h3 className="font-bold text-purple-400">📄 Documents</h3>
                                    {[
                                        { key: 'cniRecto', label: 'CNI Recto', oblig: true },
                                        { key: 'cniVerso', label: 'CNI Verso', oblig: true },
                                        { key: 'selfie', label: 'Selfie', oblig: true },
                                        { key: 'diplome', label: 'Diplôme', oblig: false },
                                        { key: 'carteProf', label: 'Carte Pro', oblig: false },
                                    ].map(d => (
                                        <p key={d.key}>
                                            <span className="text-white/50">{d.label} :</span>{' '}
                                            {docs[d.key]
                                                ? <span className="text-green-400">✅ Uploadé</span>
                                                : <span className={d.oblig ? 'text-red-400' : 'text-white/30'}>
                                                    {d.oblig ? '❌ Manquant' : '— Non fourni'}
                                                </span>}
                                        </p>
                                    ))}
                                </div>
                                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-2">
                                    <h3 className="font-bold text-purple-400">🛠️ Services</h3>
                                    <p><span className="text-white/50">Services :</span>{' '}
                                        {servicesChoisis.map(id => {
                                            const s = services.find(s => (s.id || s.code || s.nom) === id);
                                            return s ? `${s.emoji} ${s.nom}` : id;
                                        }).join(', ')}
                                    </p>
                                    <p><span className="text-white/50">Transport :</span>{' '}
                                        {form.hasTransport ? <span className="text-green-400">✅ Oui</span> : <span className="text-yellow-400">⚠️ Non</span>}
                                    </p>
                                    <p><span className="text-white/50">Matériel :</span>{' '}
                                        {form.hasMateriel ? <span className="text-green-400">✅ Oui</span> : <span className="text-yellow-400">⚠️ Non</span>}
                                    </p>
                                </div>
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-blue-300 text-sm space-y-1">
                                    <p className="font-bold">ℹ️ Après l'inscription :</p>
                                    <p>• Votre dossier sera examiné par l'équipe New Vision</p>
                                    <p>• Un agent vous contactera pour une évaluation terrain</p>
                                    <p>• Une fois validé, votre profil sera visible par les clients</p>
                                    <p>• Statut initial : <span className="text-yellow-400 font-bold">EN ATTENTE DE VALIDATION</span></p>
                                </div>
                            </div>
                            <button onClick={handleSubmit} disabled={loading}
                                className={`w-full font-bold py-4 rounded-xl text-white text-lg transition-all
                                    ${loading ? 'bg-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-green-500 hover:scale-105'}`}>
                                {loading ? '⏳ Envoi du dossier...' : '🚀 Soumettre mon dossier'}
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-2">
                        {etape > 1
                            ? <button onClick={precedent} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">← Précédent</button>
                            : <div />}
                        {etape < 4 &&
                            <button onClick={suivant} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 rounded-xl font-bold transition-all">
                                Suivant →
                            </button>}
                    </div>
                </div>

                <p className="text-center text-white/50 text-sm pb-6">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-blue-400 hover:underline">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}