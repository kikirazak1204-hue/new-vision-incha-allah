import React, { useEffect, useMemo, useState } from 'react';
import { getServices, registerUser, registerFournisseur } from '../util/api';

/*
  KANARI — inscription simple et fiable
  Principes :
  - Un profil peut choisir PLUSIEURS services.
  - Les champs secondaires restent optionnels au premier passage.
  - Les documents de transport ne sont demandés que pour les activités
    Livraison / Transport (ou un service dont le nom contient ces mots).
  - Les informations manquantes peuvent être complétées plus tard par Kanari.
  - Le contrat dépend du type de profil et sa version est envoyée au backend.

  ✅ CORRIGÉ : le textarea de description et trois labels de cases à
  cocher n'avaient aucune couleur de texte explicite. Le reste de
  l'application étant en thème sombre, ces éléments héritaient d'une
  couleur de texte claire par défaut — invisible sur ce formulaire à
  fond blanc. Chaque élément texte a maintenant une couleur explicite.
*/

const TYPES = {
  prestataire: 'Prestataire',
  partenaire: 'Partenaire',
  fournisseur: 'Fournisseur',
};

const PAYMENTS = [
  { id: 'NITA', name: 'NITA', mark: 'N', note: 'Paiement / transfert' },
  { id: 'AMANA', name: 'AMANA', mark: 'A', note: 'Paiement / transfert' },
  { id: 'Z CASH', name: 'Z CASH', mark: 'Z', note: 'Paiement / transfert' },
  { id: 'AIRTEL MONEY', name: 'Airtel Money', mark: 'A', note: 'Mobile money' },
  { id: 'CORIS BANK', name: 'Coris Bank', mark: 'CB', note: 'Compte bancaire' },
  { id: 'ORABANK', name: 'Orabank', mark: 'O', note: 'Compte bancaire' },
  { id: 'AUTRE', name: 'Autre', mark: '+', note: 'À préciser' },
];

const CONTRACTS = {
  prestataire: {
    title: 'Contrat de collaboration — Prestataire de services',
    text: 'Kanari organise la réception des demandes, la coordination, le suivi de la mission et la relation avec le client.',
    clauses: [
      'Les informations communiquées doivent être exactes et mises à jour.',
      'Le Prestataire exécute les prestations correspondant aux services qu’il a déclarés.',
      'Kanari peut recevoir, coordonner, suivre et documenter les missions.',
      'Le Prestataire reste responsable de l’exécution technique de son intervention.',
      'Les paiements, commissions, annulations et litiges sont tracés par référence de mission.',
      'Aucun volume minimum de missions n’est garanti sauf accord écrit spécifique.',
    ],
  },
  partenaire: {
    title: 'Contrat de partenariat commercial — Partenaire',
    text: 'Kanari structure une relation commerciale avec le Partenaire pour les produits, services ou opportunités convenus.',
    clauses: [
      'Le Partenaire fournit des informations exactes sur son activité et ses représentants.',
      'Kanari peut assurer visibilité, réception de demandes, coordination et suivi.',
      'Les conditions commerciales, commissions et responsabilités sont définies avant opération.',
      'Aucune exclusivité n’est présumée sans accord écrit.',
      'Les commandes et transactions éligibles doivent rester traçables.',
    ],
  },
  fournisseur: {
    title: 'Contrat fournisseur / approvisionnement — Kanari',
    text: 'Profil destiné aux fournisseurs de produits ou ressources, au Niger ou à l’étranger.',
    clauses: [
      'Le Fournisseur communique son identité, son pays d’établissement et les documents disponibles.',
      'Produits, prix, délais, livraison et paiement sont définis avant chaque opération.',
      'Kanari peut organiser les commandes, le suivi et la traçabilité des opérations convenues.',
      'Les documents fiscaux, commerciaux, douaniers ou réglementaires requis peuvent être demandés.',
      'Toute commission, marge ou rémunération de Kanari est définie avant l’opération.',
    ],
  },
};

const Input = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
      {label}{required && <b className="text-amber-500"> *</b>}
    </span>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
    />
  </label>
);

const Select = ({ label, name, value, onChange, required = false, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
      {label}{required && <b className="text-amber-500"> *</b>}
    </span>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm !text-[#061a3a] placeholder:!text-slate-400 outline-none focus:border-amber-400"
    >
      {children}
    </select>
  </label>
);

const Textarea = ({ label, name, value, onChange, placeholder = '', rows = 4 }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm !text-[#061a3a] placeholder:!text-slate-400 outline-none focus:border-amber-400"
    />
  </label>
);

const FileBox = ({ label, file, onChange, required = false, hint = 'JPG, PNG ou PDF' }) => (
  <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-amber-400">
    <span className="block text-sm font-semibold text-slate-700">
      {label}{required && <b className="text-amber-500"> *</b>}
    </span>
    <span className="mt-1 block text-xs text-slate-500">{file ? file.name : hint}</span>
    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onChange} className="mt-3 w-full text-xs text-slate-600" />
  </label>
);

function PaymentCard({ payment, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        selected ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/30' : 'border-slate-200 bg-white hover:border-amber-300'
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#061a3a] text-sm font-black text-amber-400">
        {payment.mark}
      </span>
      <span>
        <span className="block text-sm font-black text-[#061a3a]">{payment.name}</span>
        <span className="block text-xs text-slate-500">{payment.note}</span>
      </span>
      {selected && <span className="ml-auto text-lg font-black text-amber-500">✓</span>}
    </button>
  );
}

function Title({ n, title, desc }) {
  return (
    <div className="mb-7">
      <div className="mb-2 text-xs font-black uppercase tracking-[.2em] text-amber-500">{n}</div>
      <h2 className="text-2xl font-black text-[#061a3a]">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

// Case à cocher réutilisable — texte toujours explicitement coloré,
// jamais dépendant d'un thème hérité.
const CheckboxLine = ({ checked, onChange, name, children }) => (
  <label className="flex gap-3 text-sm leading-6 text-slate-700">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-1 h-5 w-5 shrink-0 accent-amber-400"
    />
    <span className="text-slate-700">{children}</span>
  </label>
);

export default function RegisterPartenaireKanari({ setCurrentView }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedServiceNames, setSelectedServiceNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    typeProfil: 'prestataire',
    nom: '',
    email: '',
    password: '',
    telephone: '',
    numeroUrgence: '',
    pays: 'Niger',
    ville: '',
    quartier: '',
    secteur: '',
    adresse: '',
    langues: '',
    serviceIds: [],
    nomEntreprise: '',
    statutJuridique: '',
    nif: '',
    rccm: '',
    numeroRegistreEtranger: '',
    paysImmatriculation: '',
    experience: '',
    description: '',
    saitLireEcrire: '',
    hasMateriel: false,
    methodePaiement: '',
    numeroPaiement: '',
    devisePaiement: 'FCFA',
    accepteContrat: false,
    accepteConditions: false,
  });

  const [files, setFiles] = useState({
    cniRecto: null,
    cniVerso: null,
    selfie: null,
    diplome: null,
    vehicule: null,
    justificatifVehicule: null,
    justificatifEntreprise: null,
    documentFiscal: null,
    catalogue: null,
  });

  useEffect(() => {
    getServices()
      .then((r) => setServices(r.data || []))
      .catch(() => setServices([]));
  }, []);

  const contract = CONTRACTS[form.typeProfil];
  const international = form.pays !== 'Niger';

  const transportRequired = useMemo(() => {
    const text = selectedServiceNames.join(' ').toLowerCase();
    return /transport|livraison|chauffeur|taxi|moto|coursier|logistique/.test(text);
  }, [selectedServiceNames]);

  const diplomaPossible = useMemo(() => {
    const text = selectedServiceNames.join(' ').toLowerCase();
    return /médecin|docteur|avocat|enseignant|professeur|comptable|architecte|ingénieur|pharmacien|infirmier|notaire/.test(text);
  }, [selectedServiceNames]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'typeProfil' ? { accepteContrat: false } : {}),
    }));
  };

  const toggleService = (id) => {
    const service = services.find((s) => String(s.id) === String(id));
    setForm((p) => {
      const exists = p.serviceIds.some((x) => String(x) === String(id));
      const next = exists ? p.serviceIds.filter((x) => String(x) !== String(id)) : [...p.serviceIds, id];
      return { ...p, serviceIds: next };
    });
    setSelectedServiceNames((current) => {
      if (!service) return current;
      const exists = form.serviceIds.some((x) => String(x) === String(id));
      return exists ? current.filter((x) => x !== service.nom) : [...current, service.nom];
    });
  };

  const file = (key) => (e) => setFiles((p) => ({ ...p, [key]: e.target.files?.[0] || null }));

  const validate = () => {
    if (step === 1 && (!form.nom || !form.telephone || !form.password)) {
      return 'Nom, téléphone et mot de passe sont obligatoires.';
    }
    if (step === 2 && form.typeProfil === 'prestataire' && form.serviceIds.length === 0) {
      return 'Sélectionnez au moins un service.';
    }
    if (step === 2 && !form.nomEntreprise) return 'Indiquez au moins votre nom professionnel ou votre activité.';
    if (step === 3 && (!form.pays || !form.ville)) return 'Le pays et la ville sont obligatoires.';
    if (step === 4 && form.typeProfil === 'prestataire' && !files.cniRecto) {
      return 'Une pièce d’identité est nécessaire pour commencer la vérification.';
    }
    if (step === 4 && transportRequired && !files.vehicule) {
      return 'Pour un service de transport/livraison, ajoutez la photo du véhicule.';
    }
    if (step === 5 && !form.methodePaiement) return 'Choisissez un moyen de paiement/reversement.';
    if (step === 5 && !form.numeroPaiement) return 'Indiquez le numéro ou la référence de paiement.';
    if (step === 6 && (!form.accepteContrat || !form.accepteConditions)) {
      return 'Acceptez le contrat et les conditions pour terminer.';
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) return setMessage({ type: 'error', text: err });
    setMessage({});
    setStep((s) => Math.min(6, s + 1));
  };

  const prev = () => {
    setMessage({});
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setMessage({ type: 'error', text: err });
    setLoading(true);
    setMessage({});

    try {
      const auth = await registerUser({
        nom: form.nom,
        email: form.email || undefined,
        password: form.password,
        telephone: form.telephone,
        ville: form.ville,
        role: 'fournisseur',
      });

      if (!auth?.success || !auth?.token) throw new Error(auth?.message || 'Création du compte impossible.');
      localStorage.setItem('token', auth.token);
      localStorage.setItem('user', JSON.stringify(auth.user));

      const data = new FormData();
      data.append('userId', auth.user.id);

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'password' || key === 'serviceIds') return;
        if (value !== '' && value != null) data.append(key, String(value));
      });

      form.serviceIds.forEach((id) => data.append('serviceIds[]', String(id)));
      data.append('serviceIds', JSON.stringify(form.serviceIds));
      data.append('serviceNames', JSON.stringify(selectedServiceNames));

      data.append('contractType', form.typeProfil);
      data.append('contractVersion', '1.1');
      data.append('contractTitle', contract.title);
      data.append('contractAccepted', String(form.accepteContrat));
      data.append('transportRequired', String(transportRequired));
      data.append('registrationMode', 'simple_progressive');

      Object.entries(files).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      const profile = await registerFournisseur(data, auth.token);
      if (!profile?.success) throw new Error(profile?.message || 'Erreur lors de la création du profil.');

      setMessage({
        type: 'success',
        text: 'Dossier envoyé. Kanari peut maintenant vérifier le profil et compléter les informations manquantes si nécessaire.',
      });
      setTimeout(() => setCurrentView?.('dashboardPrestataire'), 1800);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setMessage({ type: 'error', text: err.message || 'Erreur serveur.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Compte', 'Services', 'Localisation', 'Vérification', 'Paiement', 'Contrat'];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <header className="bg-[#061a3a] px-6 py-7 text-white md:px-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[.25em] text-amber-400">KANARI SERVICE</div>
              <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">Créer votre profil professionnel</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Inscription rapide. Les informations secondaires peuvent être complétées après l’inscription.
              </p>
            </div>
            <div className="hidden h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-3xl font-black text-[#061a3a] md:grid">K</div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-6">
            {steps.map((s, i) => (
              <div key={s} className={`rounded-xl px-2 py-2 text-center text-xs font-bold ${step === i + 1 ? 'bg-amber-400 text-[#061a3a]' : step > i + 1 ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-400'}`}>
                {i + 1}. {s}
              </div>
            ))}
          </div>
        </header>

        <form onSubmit={submit} className="p-6 md:p-10">
          {message.text && (
            <div className={`mb-6 rounded-2xl p-4 text-sm font-semibold ${message.type === 'error' ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </div>
          )}

          {step === 1 && (
            <>
              <Title n="01 — COMPTE" title="Qui êtes-vous ?" desc="Nous demandons uniquement le nécessaire pour créer le compte." />
              <div className="mb-6 grid gap-3 md:grid-cols-3">
                {Object.entries(TYPES).map(([id, label]) => (
                  <label key={id} className={`cursor-pointer rounded-2xl border p-4 ${form.typeProfil === id ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                    <input type="radio" name="typeProfil" value={id} checked={form.typeProfil === id} onChange={change} className="mr-2 accent-amber-400" />
                    <span className="font-black text-[#061a3a]">{label}</span>
                  </label>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nom complet / représentant" name="nom" value={form.nom} onChange={change} required />
                <Input label="Téléphone principal" name="telephone" type="tel" value={form.telephone} onChange={change} required />
                <Input label="Email" name="email" type="email" value={form.email} onChange={change} placeholder="Optionnel" />
                <Input label="Numéro d'urgence" name="numeroUrgence" type="tel" value={form.numeroUrgence} onChange={change} placeholder="Optionnel" />
                <Input label="Mot de passe" name="password" type="password" value={form.password} onChange={change} required />
                <Input label="Langues parlées" name="langues" value={form.langues} onChange={change} placeholder="Français, Zarma, Haoussa..." />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Title n="02 — SERVICES" title="Que proposez-vous ?" desc="Vous pouvez sélectionner plusieurs services. Ne remplissez pas ce qui ne vous concerne pas." />
              {form.typeProfil === 'prestataire' && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                  <b className="text-[#061a3a]">Plusieurs services autorisés :</b> sélectionnez tous les métiers que vous pouvez réellement assurer.
                </div>
              )}

              {form.typeProfil === 'prestataire' && (
                <div className="grid max-h-80 gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  {services.length ? services.map((s) => {
                    const active = form.serviceIds.some((id) => String(id) === String(s.id));
                    return (
                      <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${active ? 'border-amber-400 bg-white' : 'border-slate-200 bg-white'}`}>
                        <input type="checkbox" checked={active} onChange={() => toggleService(s.id)} className="h-5 w-5 accent-amber-400" />
                        <span className="text-sm font-semibold text-slate-700">{s.nom}</span>
                      </label>
                    );
                  }) : <p className="text-sm text-slate-500">Impossible de charger les services. Vérifiez l’API.</p>}
                </div>
              )}

              {selectedServiceNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedServiceNames.map((name) => <span key={name} className="rounded-full bg-[#061a3a] px-3 py-1 text-xs font-bold text-white">{name}</span>)}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Input label="Nom professionnel / activité" name="nomEntreprise" value={form.nomEntreprise} onChange={change} required placeholder="Ex. Abdo Électricité" />
                <Select label="Statut juridique" name="statutJuridique" value={form.statutJuridique} onChange={change}>
                  <option value="">Non renseigné</option>
                  <option>Indépendant</option>
                  <option>Entreprise Individuelle</option>
                  <option>SARL / Société</option>
                  <option>Association / Organisation</option>
                  <option>Coopérative</option>
                  <option>Autre</option>
                </Select>
                <Select label="Expérience" name="experience" value={form.experience} onChange={change}>
                  <option value="">Non renseignée</option>
                  <option>Débutant</option>
                  <option>Intermédiaire</option>
                  <option>Confirmé</option>
                  <option>Expert</option>
                </Select>
                <Input label="NIF" name="nif" value={form.nif} onChange={change} placeholder="Optionnel au départ" />
                <Input label="RCCM" name="rccm" value={form.rccm} onChange={change} placeholder="Optionnel au départ" />
                {/* ✅ CORRIGÉ : label sans couleur de texte explicite ajoutée */}
                <label className="flex items-center rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="hasMateriel" checked={form.hasMateriel} onChange={change} className="mr-3 h-5 w-5 accent-amber-400" /> Matériel disponible
                </label>
                <div className="md:col-span-2">
                  {/* ✅ CORRIGÉ : textarea remplacé par le composant Textarea avec couleur explicite */}
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={change}
                    rows={4}
                    placeholder="Spécialités, zones couvertes, produits ou précisions... (optionnel)"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Title n="03 — LOCALISATION" title="Où intervenez-vous ?" desc="Le pays et la ville suffisent pour commencer. Le reste peut être ajouté plus tard." />
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Pays" name="pays" value={form.pays} onChange={change} required>
                  <option>Niger</option><option>Nigeria</option><option>Bénin</option><option>Togo</option><option>Ghana</option><option>Côte d'Ivoire</option><option>Sénégal</option><option>France</option><option>Autre</option>
                </Select>
                <Input label="Ville" name="ville" value={form.ville} onChange={change} required />
                <Input label="Quartier / zone" name="quartier" value={form.quartier} onChange={change} placeholder="Optionnel" />
                <Input label="Secteur / arrondissement" name="secteur" value={form.secteur} onChange={change} placeholder="Optionnel" />
                <div className="md:col-span-2"><Input label="Adresse professionnelle" name="adresse" value={form.adresse} onChange={change} placeholder="Optionnel au départ" /></div>
              </div>
              {international && (
                <div className="mt-5 grid gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:grid-cols-2">
                  <div className="md:col-span-2 text-sm font-semibold text-blue-900">Profil hors Niger : les documents d’immatriculation seront complétés selon le pays.</div>
                  <Input label="N° d'immatriculation étranger" name="numeroRegistreEtranger" value={form.numeroRegistreEtranger} onChange={change} placeholder="Optionnel au premier passage" />
                  <Input label="Pays d'immatriculation" name="paysImmatriculation" value={form.paysImmatriculation} onChange={change} placeholder="Optionnel au premier passage" />
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Title n="04 — VÉRIFICATION" title="Les documents essentiels" desc="Nous évitons de demander des documents inutiles. Kanari pourra demander les pièces complémentaires après étude." />
              <div className="grid gap-4 md:grid-cols-2">
                {form.typeProfil === 'prestataire' ? (
                  <>
                    <FileBox label="Pièce d’identité — Recto" file={files.cniRecto} onChange={file('cniRecto')} required />
                    <FileBox label="Pièce d’identité — Verso" file={files.cniVerso} onChange={file('cniVerso')} hint="Optionnel si non nécessaire" />
                    <FileBox label="Selfie de vérification" file={files.selfie} onChange={file('selfie')} hint="Optionnel — pourra être demandé par Kanari" />
                    <FileBox label="Diplôme / certificat" file={files.diplome} onChange={file('diplome')} required={diplomaPossible} hint={diplomaPossible ? 'Recommandé / requis selon le métier' : 'Optionnel selon le service'} />
                    {transportRequired && (
                      <>
                        <FileBox label="Photo du véhicule" file={files.vehicule} onChange={file('vehicule')} required hint="Obligatoire pour Transport / Livraison" />
                        <FileBox label="Carte grise / immatriculation" file={files.justificatifVehicule} onChange={file('justificatifVehicule')} hint="Photo ou PDF — obligatoire selon le véhicule et le service" />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <FileBox label="Justificatif d'entreprise / activité" file={files.justificatifEntreprise} onChange={file('justificatifEntreprise')} hint="Optionnel au premier passage" />
                    <FileBox label="Document fiscal / registre" file={files.documentFiscal} onChange={file('documentFiscal')} hint="NIF, RCCM ou équivalent — optionnel au départ" />
                    <FileBox label="Catalogue / offre commerciale" file={files.catalogue} onChange={file('catalogue')} hint="Optionnel" />
                  </>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                <b className="text-[#061a3a]">Principe Kanari :</b> inscription ≠ validation définitive. Un dossier peut être créé avec les informations essentielles puis passer en vérification. Les éléments manquants pourront être demandés plus tard.
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Title n="05 — PAIEMENT" title="Où recevoir vos règlements ?" desc="Choisissez le moyen que Kanari utilisera pour les reversements ou règlements. Les autres informations peuvent être complétées plus tard." />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PAYMENTS.map((p) => <PaymentCard key={p.id} payment={p} selected={form.methodePaiement === p.id} onClick={() => setForm((x) => ({ ...x, methodePaiement: p.id }))} />)}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Input label="Numéro / référence de paiement" name="numeroPaiement" value={form.numeroPaiement} onChange={change} required placeholder="Ex. numéro mobile ou compte" />
                <Select label="Devise" name="devisePaiement" value={form.devisePaiement} onChange={change}>
                  <option>FCFA</option><option>EUR</option><option>USD</option><option>Autre</option>
                </Select>
              </div>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-slate-700">
                <b className="text-[#061a3a]">Important :</b> ces cartes sont des repères visuels intégrés à l’interface. Si Kanari dispose des logos officiels des opérateurs, remplacez le carré avec la lettre par leur image officielle dans <code>PaymentCard</code>.
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <Title n="06 — CONTRAT" title="Dernière étape" desc="Le document présenté correspond au type de profil choisi au début." />
              <div className="overflow-hidden rounded-2xl border border-amber-200">
                <div className="bg-[#061a3a] p-5 text-white">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Document contractuel</div>
                  <h3 className="text-lg font-black text-white">{contract.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{contract.text}</p>
                </div>
                <div className="max-h-72 overflow-y-auto p-5">
                  <ol className="space-y-3 text-sm leading-6 text-slate-700">
                    {contract.clauses.map((c, i) => <li key={i}><b className="mr-2 text-amber-500">{i + 1}.</b>{c}</li>)}
                  </ol>
                </div>
                {/* ✅ CORRIGÉ : CheckboxLine garantit un texte toujours visible */}
                <div className="border-t bg-slate-50 p-5">
                  <CheckboxLine
                    checked={form.accepteContrat}
                    onChange={(e) => setForm((p) => ({ ...p, accepteContrat: e.target.checked }))}
                  >
                    Je confirme avoir lu le document correspondant à mon profil et j’accepte les conditions présentées par Kanari.<b className="text-amber-500"> *</b>
                  </CheckboxLine>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <CheckboxLine
                  checked={form.accepteConditions}
                  onChange={change}
                  name="accepteConditions"
                >
                  Je confirme que les informations fournies sont exactes et j’accepte les règles générales de vérification, suivi, paiement, commission et gestion des incidents Kanari.<b className="text-amber-500"> *</b>
                </CheckboxLine>
              </div>
            </>
          )}

          <div className="mt-8 flex justify-between border-t border-slate-200 pt-6">
            {step > 1 ? (
              <button type="button" onClick={prev} className="rounded-xl border px-6 py-3 text-sm font-bold text-slate-700">Retour</button>
            ) : (
              <button type="button" onClick={() => setCurrentView?.('login')} className="text-sm font-semibold text-slate-500">J’ai déjà un compte</button>
            )}
            {step < 6 ? (
              <button type="button" onClick={next} className="rounded-xl bg-[#061a3a] px-7 py-3 text-sm font-bold text-white">Continuer</button>
            ) : (
              <button type="submit" disabled={loading} className="rounded-xl bg-amber-400 px-7 py-3 text-sm font-black text-[#061a3a] disabled:opacity-60">
                {loading ? 'Envoi du dossier...' : 'Créer mon profil Kanari'}
              </button>
            )}
          </div>
        </form>

        <footer className="bg-slate-50 py-6 text-center text-xs text-slate-400">KANARI SERVICE — Un réseau pour tous</footer>
      </div>
    </div>
  );
}