import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X, Camera, FileText, MapPin, User, Phone, ArrowLeft, ArrowRight,
  Loader2, CheckCircle, AlertCircle, Mic, Square, CalendarDays,
  Clock, Repeat2, ClipboardList, LocateFixed, ImagePlus, Volume2,
  ShieldCheck, Plus, Minus
} from 'lucide-react';
import { demanderAbonnement } from '../util/api';

const FREQUENCES = [
  ['hebdomadaire', 'Chaque semaine'],
  ['quinzaine', 'Tous les 15 jours'],
  ['mensuel', 'Chaque mois']
];

const BRAND = {
  navy: '#061A3A',
  blue: '#123D72',
  gold: '#F2B632',
  paleGold: '#FFF7E5',
  paleBlue: '#EEF4FB'
};

const inputClass =
  'w-full min-h-[50px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#123D72] focus:ring-4 focus:ring-blue-900/10';

function SectionTitle({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2B632] text-sm font-black text-[#061A3A]">
        {number}
      </div>
      <div>
        <h3 className="text-base font-extrabold text-[#061A3A] sm:text-lg">{title}</h3>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
}

function ServiceDetailCard({ service, details, onChangeDetail, masquerPrix }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const photos = details.photos || [];
  const fichiers = details.fichiers || [];

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      photos.forEach(photo => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
    };
    // Preview URLs are owned by this card and cleaned up on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      alert("L'enregistrement vocal n'est pas disponible sur cet appareil ou navigateur.");
      return;
    }
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onChangeDetail('vocal', { blob: audioBlob, url: audioUrl });
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Erreur micro :', error);
      alert("Autorisez l'accès au microphone pour enregistrer votre message.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Prestation sélectionnée</p>
          <h4 className="mt-1 text-lg font-extrabold text-[#061A3A]">{service.nom || service.serviceNom}</h4>
        </div>
        <span className="rounded-full bg-[#FFF7E5] px-3 py-2 text-sm font-extrabold text-[#061A3A]">
          {masquerPrix ? 'Prix après étude' : `${Number(service.prix || service.tarif || 0).toLocaleString('fr-FR')} FCFA`}
        </span>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-bold text-slate-800">
          Expliquez ce dont vous avez besoin
        </label>
        <textarea
          rows={3}
          value={details.description || ''}
          onChange={e => onChangeDetail('description', e.target.value)}
          placeholder="Exemple : mon robinet fuit dans la cuisine..."
          className={`${inputClass} min-h-[108px] resize-y`}
        />
        <p className="mt-1 text-xs text-slate-500">Vous pouvez écrire simplement, avec vos propres mots.</p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <Volume2 size={19} className="text-[#123D72]" />
          <p className="text-sm font-extrabold text-[#061A3A]">Vous préférez parler ?</p>
          <span className="ml-auto rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">Facultatif</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">Enregistrez un message vocal pour expliquer votre besoin.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!recording ? (
            <button type="button" onClick={startRecording}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[#123D72] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#061A3A]">
              <Mic size={18} /> Enregistrer un vocal
            </button>
          ) : (
            <button type="button" onClick={stopRecording}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
              <Square size={16} /> Arrêter
            </button>
          )}
          {recording && <span className="text-sm font-semibold text-red-600">Enregistrement en cours…</span>}
        </div>
        {details.vocal?.url && (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="mb-2 text-xs font-bold text-slate-600">Votre message vocal est prêt :</p>
            <audio controls src={details.vocal.url} className="h-10 w-full" />
            <button type="button" onClick={() => onChangeDetail('removeVocal')}
              className="mt-2 text-xs font-bold text-red-600 underline">Supprimer le vocal</button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold text-[#061A3A]">Ajouter des photos</p>
            <p className="text-xs text-slate-500">Montrez-nous le problème (4 photos maximum).</p>
          </div>
          <ImagePlus className="text-[#123D72]" size={22} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={`${photo.file?.name || 'photo'}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
              <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label="Supprimer cette photo"
                onClick={() => onChangeDetail('removePhoto', index)}
                className="absolute right-1 top-1 rounded-full bg-red-600 p-1.5 text-white shadow">
                <X size={13} />
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-[#123D72] transition hover:border-[#123D72] hover:bg-[#EEF4FB]">
              <Camera size={23} />
              <span className="mt-1 text-[11px] font-bold">Ajouter</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => {
                  onChangeDetail('addPhotos', e.target.files);
                  e.target.value = '';
                }} />
            </label>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-sm font-extrabold text-[#061A3A]">Documents utiles</p>
        <p className="mb-3 text-xs text-slate-500">Facultatif : PDF ou document Word.</p>
        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#123D72] hover:bg-[#EEF4FB]">
          <FileText size={18} /> Choisir des documents
          <input type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
            onChange={e => {
              onChangeDetail('addFiles', e.target.files);
              e.target.value = '';
            }} />
        </label>
        {fichiers.length > 0 && (
          <ul className="mt-2 space-y-1">
            {fichiers.map((file, index) => (
              <li key={`${file.nom}-${index}`} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                <span className="truncate">{file.nom}</span>
                <button type="button" onClick={() => onChangeDetail('removeFile', index)}
                  className="font-bold text-red-600">Retirer</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function ReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [servicesSelectionnes, setServicesSelectionnes] = useState([]);
  const [fournisseurPreselectionne, setFournisseurPreselectionne] = useState(null);
  const [socle, setSocle] = useState({ clientNom: '', telephone: '', adresse: '', coords: null });
  const [detailsServices, setDetailsServices] = useState({});
  const [mode, setMode] = useState('unique');
  const [abo, setAbo] = useState({ frequence: 'hebdomadaire', jourPrefere: '', heure: '', dateDebut: '' });
  const estAbo = mode === 'abonnement';

  useEffect(() => {
    try {
      const state = location.state || {};
      let services = state.services;
      if (!services && state.service) services = [state.service];
      if (!services || services.length === 0) {
        services = JSON.parse(localStorage.getItem('kanari_cart') || '[]');
      }
      const fournisseur = state.fournisseur || JSON.parse(localStorage.getItem('selectedFournisseur') || 'null');
      const servicesAvecId = (Array.isArray(services) ? services : []).map((service, index) => ({
        ...service,
        safeId: service.safeId || service.id || service.realDbId || `srv_${index}`
      }));
      setServicesSelectionnes(servicesAvecId);
      setFournisseurPreselectionne(fournisseur);

      const userStored = JSON.parse(localStorage.getItem('user') || '{}');
      setSocle(previous => ({
        ...previous,
        clientNom: userStored.nom || userStored.name || '',
        telephone: userStored.telephone || userStored.phone || '',
        adresse: userStored.adresse || ''
      }));
    } catch (error) {
      console.error('Erreur de lecture des informations de réservation :', error);
      setMessage({ text: "Impossible de charger votre panier. Retournez aux services et réessayez.", type: 'error' });
    }
  }, [location]);

  const handleServiceDetailChange = (serviceId, action, payload) => {
    setDetailsServices(previous => {
      const current = previous[serviceId] || {};
      const updated = { ...current };
      if (action === 'description') updated.description = payload;
      if (action === 'vocal') updated.vocal = payload;
      if (action === 'removeVocal') {
        if (current.vocal?.url) URL.revokeObjectURL(current.vocal.url);
        updated.vocal = null;
      }
      if (action === 'addPhotos') {
        const available = Math.max(0, 4 - (current.photos || []).length);
        const newPhotos = Array.from(payload || []).filter(file => file.type.startsWith('image/'))
          .slice(0, available)
          .map(file => ({ file, preview: URL.createObjectURL(file) }));
        updated.photos = [...(current.photos || []), ...newPhotos];
      }
      if (action === 'removePhoto') {
        const removed = (current.photos || [])[payload];
        if (removed?.preview) URL.revokeObjectURL(removed.preview);
        updated.photos = (current.photos || []).filter((_, index) => index !== payload);
      }
      if (action === 'addFiles') {
        const allowed = Array.from(payload || []).filter(file =>
          /\.(pdf|doc|docx)$/i.test(file.name)
        );
        updated.fichiers = [...(current.fichiers || []), ...allowed.map(file => ({
          file, nom: file.name, taille: file.size
        }))];
      }
      if (action === 'removeFile') {
        updated.fichiers = (current.fichiers || []).filter((_, index) => index !== payload);
      }
      return { ...previous, [serviceId]: updated };
    });
  };

  const handleGeolocalisation = () => {
    if (!navigator.geolocation) {
      setMessage({ text: "La géolocalisation n'est pas disponible sur cet appareil. Indiquez votre quartier.", type: 'error' });
      return;
    }
    setMessage({ text: 'Recherche de votre position…', type: 'info' });
    navigator.geolocation.getCurrentPosition(
      position => {
        setSocle(previous => ({
          ...previous,
          coords: { lat: position.coords.latitude, lng: position.coords.longitude }
        }));
        setMessage({ text: 'Votre position GPS a été ajoutée à la demande.', type: 'success' });
      },
      error => {
        console.error('Erreur GPS :', error);
        setMessage({ text: "Position non trouvée. Vous pouvez simplement écrire votre quartier et un repère.", type: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const totalMontant = servicesSelectionnes.reduce(
    (total, service) => total + Number(service.prix || service.tarif || 0), 0
  );

  const soumettreAbonnement = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Connectez-vous à votre compte pour demander un abonnement.');
    if (!socle.adresse.trim()) throw new Error("Indiquez votre quartier ou un repère pour l'abonnement.");

    const adresseComplete = `Quartier/Zone: ${socle.adresse.trim()}${socle.coords ? ` | GPS: (${socle.coords.lat.toFixed(5)}, ${socle.coords.lng.toFixed(5)})` : ''}`;
    for (const service of servicesSelectionnes) {
      const details = detailsServices[service.safeId] || {};
      const serviceId = Number(service.realDbId ?? service.id ?? service.safeId);
      await demanderAbonnement({
        serviceId: Number.isFinite(serviceId) ? serviceId : 1,
        serviceNom: service.nom || service.serviceNom,
        telephone: socle.telephone.trim(),
        clientNom: socle.clientNom || undefined,
        adresse: adresseComplete,
        frequence: abo.frequence,
        jourPrefere: abo.jourPrefere || undefined,
        heure: abo.heure || undefined,
        dateDebut: abo.dateDebut || undefined,
        remarques: details.description || undefined
      });
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage({ text: '', type: '' });

    if (!socle.telephone.trim()) {
      setMessage({ text: 'Veuillez saisir votre numéro de téléphone.', type: 'error' });
      return;
    }
    if (servicesSelectionnes.length === 0) {
      setMessage({ text: "Votre panier est vide. Choisissez d'abord une prestation.", type: 'error' });
      return;
    }
    if (estAbo && !socle.adresse.trim()) {
      setMessage({ text: "Pour un abonnement, indiquez votre quartier ou un repère.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (estAbo) {
        await soumettreAbonnement();
        ['kanari_cart', 'selectedService', 'selectedFournisseur'].forEach(key => localStorage.removeItem(key));
        setMessage({
          text: "Votre demande d'abonnement a été reçue. Kanari étudie votre besoin et vous proposera un tarif. Aucun paiement ne sera demandé avant votre accord.",
          type: 'success'
        });
        setTimeout(() => navigate('/dashboard-client'), 2500);
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      const adresseAdmin = `${socle.adresse ? `Quartier / Zone : ${socle.adresse}` : 'Quartier non renseigné'}${socle.coords ? ` | GPS : [${socle.coords.lat}, ${socle.coords.lng}]` : ''}`;

      const donneesDeBase = {
        clientNom: socle.clientNom || 'Client Kanari',
        telephone: socle.telephone.trim(),
        adresse: adresseAdmin,
        coordonneesGps: socle.coords ? `${socle.coords.lat}, ${socle.coords.lng}` : null,
        fournisseurId: fournisseurPreselectionne?.id || fournisseurPreselectionne?._id || null,
        services: servicesSelectionnes.map(service => {
          const details = detailsServices[service.safeId] || {};
          return {
            serviceId: service.realDbId || service.id || service.safeId,
            safeId: service.safeId,
            nom: service.nom || service.serviceNom,
            prix: Number(service.prix || service.tarif || 0),
            description: details.description || ''
          };
        })
      };

      formData.append('donneesReservation', JSON.stringify(donneesDeBase));
      servicesSelectionnes.forEach(service => {
        const details = detailsServices[service.safeId] || {};
        (details.photos || []).forEach(photo => formData.append(`photo_${service.safeId}`, photo.file));
        (details.fichiers || []).forEach(file => formData.append(`document_${service.safeId}`, file.file));
        if (details.vocal?.blob) {
          formData.append(`vocal_${service.safeId}`, details.vocal.blob, 'vocal-besoin.webm');
        }
      });

      const API = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';
      const response = await fetch(`${API}/api/reservations/global`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Le serveur a renvoyé une réponse inattendue. Réessayez dans un instant.");
      }
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "La réservation n'a pas pu être envoyée.");
      }

      ['kanari_cart', 'selectedService', 'selectedFournisseur'].forEach(key => localStorage.removeItem(key));
      setMessage({ text: 'Votre demande a bien été envoyée à Kanari.', type: 'success' });
      setTimeout(() => navigate('/dashboard-client'), 1800);
    } catch (error) {
      console.error('Erreur de réservation :', error);
      setMessage({ text: error.message || 'Connexion impossible. Vérifiez votre réseau et réessayez.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fournisseurNom = fournisseurPreselectionne?.nom || fournisseurPreselectionne?.name;
  const formatPrix = value => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

  return (
    <main className="min-h-screen bg-[#F4F6F9] px-3 py-5 text-slate-800 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <header className="relative overflow-hidden bg-[#061A3A] px-5 py-6 text-white sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-20 right-20 h-44 w-44 rounded-full bg-[#F2B632]/10" />
          <button type="button" onClick={() => navigate(-1)}
            className="relative mb-5 inline-flex min-h-[40px] items-center gap-2 rounded-lg text-sm font-bold text-white/85 hover:text-[#F2B632]">
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2B632] text-[#061A3A]">
              <ClipboardList size={26} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F2B632]">KANARI SERVICE</p>
              <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
                {estAbo ? 'Demander un abonnement' : 'Votre réservation'}
              </h1>
            </div>
          </div>
          <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Décrivez simplement ce qu'il vous faut. Nous organisons votre demande et vous accompagnons jusqu'à la réalisation.
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">1. Vos informations</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">2. Votre besoin</span>
            <span className="rounded-full border border-[#F2B632]/50 bg-[#F2B632]/15 px-3 py-2 text-[#FFE3A0]">3. Confirmation</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-7 p-4 sm:p-8">
          {message.text && (
            <div role="status" aria-live="polite"
              className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold leading-relaxed ${
                message.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}>
              {message.type === 'error' ? <AlertCircle className="mt-0.5 shrink-0" size={20} /> :
                <CheckCircle className="mt-0.5 shrink-0" size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <section className="space-y-4">
            <SectionTitle number="1" title="Quel type de réservation ?" subtitle="Choisissez si vous avez besoin du service une seule fois ou régulièrement." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setMode('unique')}
                aria-pressed={!estAbo}
                className={`min-h-[92px] rounded-2xl border-2 p-4 text-left transition ${
                  !estAbo ? 'border-[#123D72] bg-[#EEF4FB] ring-2 ring-[#123D72]/10' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${!estAbo ? 'bg-[#123D72] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#061A3A]">Une seule fois</p>
                    <p className="mt-1 text-sm text-slate-600">Pour une intervention ponctuelle</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => setMode('abonnement')}
                aria-pressed={estAbo}
                className={`min-h-[92px] rounded-2xl border-2 p-4 text-left transition ${
                  estAbo ? 'border-[#123D72] bg-[#EEF4FB] ring-2 ring-[#123D72]/10' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${estAbo ? 'bg-[#123D72] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Repeat2 size={22} />
                  </div>
                  <div>
                    <p className="font-extrabold text-[#061A3A]">Régulièrement</p>
                    <p className="mt-1 text-sm text-slate-600">Chaque semaine ou chaque mois</p>
                  </div>
                </div>
              </button>
            </div>
            {estAbo && (
              <div className="rounded-2xl border border-[#F2B632]/50 bg-[#FFF7E5] p-4 text-sm leading-relaxed text-[#061A3A]">
                <p className="font-extrabold">Comment fonctionne l'abonnement ?</p>
                <p className="mt-1">Indiquez votre fréquence. Kanari étudie votre demande et vous communique une proposition. Aucun paiement n'est demandé avant votre accord.</p>
              </div>
            )}
          </section>

          <div className="h-px bg-slate-100" />

          <section className="space-y-4">
            <SectionTitle number="2" title="Comment vous contacter et vous trouver ?" subtitle="Ces informations permettent à notre équipe de vous joindre et de localiser le lieu de l'intervention." />
            <div>
              <label htmlFor="telephone" className="mb-2 block text-sm font-bold text-slate-800">
                Numéro de téléphone <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                <input id="telephone" type="tel" required value={socle.telephone}
                  onChange={event => setSocle(previous => ({ ...previous, telephone: event.target.value }))}
                  className={`${inputClass} pl-12`} placeholder="Exemple : 90 00 00 00" autoComplete="tel" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="clientNom" className="mb-2 block text-sm font-bold text-slate-800">Votre nom <span className="font-normal text-slate-500">(facultatif)</span></label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input id="clientNom" type="text" value={socle.clientNom}
                    onChange={event => setSocle(previous => ({ ...previous, clientNom: event.target.value }))}
                    className={`${inputClass} pl-12`} placeholder="Nom et prénom" autoComplete="name" />
                </div>
              </div>
              <div>
                <label htmlFor="adresse" className="mb-2 block text-sm font-bold text-slate-800">
                  Quartier et repère {estAbo && <span className="text-red-600">*</span>}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input id="adresse" type="text" value={socle.adresse}
                    onChange={event => setSocle(previous => ({ ...previous, adresse: event.target.value }))}
                    className={`${inputClass} pl-12`} placeholder="Ex. : Wadata, près du marché" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-[#123D72]"><LocateFixed size={22} /></div>
                  <div>
                    <p className="text-sm font-extrabold text-[#061A3A]">Préciser ma position GPS</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">Facultatif. Cela peut aider l'équipe à vous localiser.</p>
                  </div>
                </div>
                <button type="button" onClick={handleGeolocalisation}
                  className="min-h-[44px] rounded-xl border border-[#123D72] bg-white px-4 py-2 text-sm font-bold text-[#123D72] hover:bg-[#EEF4FB]">
                  {socle.coords ? 'Actualiser ma position' : 'Utiliser ma position'}
                </button>
              </div>
              {socle.coords && (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle size={15} /> Position GPS ajoutée
                </p>
              )}
            </div>
          </section>

          {estAbo && (
            <>
              <div className="h-px bg-slate-100" />
              <section className="space-y-4">
                <SectionTitle number="3" title="Quand souhaitez-vous le service ?" subtitle="Donnez-nous vos préférences. Elles seront confirmées avec vous." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="frequence" className="mb-2 block text-sm font-bold">Fréquence</label>
                    <select id="frequence" className={inputClass} value={abo.frequence}
                      onChange={event => setAbo(previous => ({ ...previous, frequence: event.target.value }))}>
                      {FREQUENCES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="jour" className="mb-2 block text-sm font-bold">Jour souhaité</label>
                    <input id="jour" className={inputClass} placeholder="Ex. : lundi"
                      value={abo.jourPrefere} onChange={event => setAbo(previous => ({ ...previous, jourPrefere: event.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="heure" className="mb-2 block text-sm font-bold">Heure souhaitée</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input id="heure" type="time" className={`${inputClass} pl-12`} value={abo.heure}
                        onChange={event => setAbo(previous => ({ ...previous, heure: event.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="dateDebut" className="mb-2 block text-sm font-bold">Date de début souhaitée</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input id="dateDebut" type="date" className={`${inputClass} pl-12`} value={abo.dateDebut}
                        onChange={event => setAbo(previous => ({ ...previous, dateDebut: event.target.value }))} />
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">Le calendrier définitif sera confirmé avec vous par Kanari.</p>
              </section>
            </>
          )}

          <div className="h-px bg-slate-100" />

          <section className="space-y-4">
            <SectionTitle number={estAbo ? '4' : '3'} title="Que devons-nous faire pour vous ?" subtitle="Décrivez votre besoin. Vous pouvez écrire, parler ou ajouter des photos." />
            {servicesSelectionnes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-400 bg-[#FFF7E5] p-5 text-center">
                <ClipboardList className="mx-auto text-[#123D72]" size={30} />
                <p className="mt-2 font-extrabold text-[#061A3A]">Aucune prestation sélectionnée</p>
                <p className="mt-1 text-sm text-slate-600">Retournez aux services pour choisir ce dont vous avez besoin.</p>
                <button type="button" onClick={() => navigate(-1)}
                  className="mt-3 rounded-xl bg-[#123D72] px-4 py-3 text-sm font-bold text-white">Choisir un service</button>
              </div>
            ) : (
              <div className="space-y-4">
                {servicesSelectionnes.map(service => (
                  <ServiceDetailCard key={service.safeId} service={service}
                    masquerPrix={estAbo}
                    details={detailsServices[service.safeId] || {}}
                    onChangeDetail={(action, payload) => handleServiceDetailChange(service.safeId, action, payload)} />
                ))}
              </div>
            )}
            {estAbo && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                Pour les abonnements, la description écrite est transmise dans cette version. Les photos, documents et vocaux ne sont pas envoyés avec la demande d'abonnement.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#123D72]" size={21} />
              <h3 className="font-extrabold text-[#061A3A]">Vérifiez votre demande</h3>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-slate-600">Prestations</span><strong className="text-right text-[#061A3A]">{servicesSelectionnes.length}</strong></div>
              {servicesSelectionnes.map(service => (
                <div key={service.safeId} className="flex justify-between gap-3 text-slate-700">
                  <span>{service.nom || service.serviceNom}</span>
                  <strong className="shrink-0">{estAbo ? 'À étudier' : formatPrix(service.prix || service.tarif)}</strong>
                </div>
              ))}
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700">{estAbo ? 'Tarif' : 'Total estimé'}</span>
                  <strong className="text-lg text-[#061A3A]">{estAbo ? 'Après étude' : formatPrix(totalMontant)}</strong>
                </div>
                {!estAbo && <p className="mt-1 text-xs leading-relaxed text-slate-500">Le montant affiché est une estimation basée sur les tarifs disponibles. Les éventuels ajustements seront expliqués avant intervention.</p>}
              </div>
            </div>
            {fournisseurNom && (
              <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
                Prestataire choisi : <strong className="text-[#061A3A]">{fournisseurNom}</strong>
              </p>
            )}
          </section>

          <div className="space-y-3 border-t border-slate-100 pt-5">
            <button type="submit" disabled={loading || servicesSelectionnes.length === 0}
              className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#F2B632] px-5 py-4 text-base font-black text-[#061A3A] shadow-lg shadow-amber-500/15 transition hover:bg-[#E5A91F] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={21} /> : <ArrowRight size={21} />}
              {loading ? 'Envoi en cours…' : estAbo ? 'Envoyer ma demande' : 'Confirmer ma réservation'}
            </button>
            <p className="text-center text-xs leading-relaxed text-slate-500">
              En envoyant cette demande, vous autorisez Kanari à vous contacter au sujet de votre réservation.
            </p>
          </div>
        </form>

        <footer className="border-t border-slate-100 bg-[#061A3A] px-5 py-4 text-center text-xs leading-relaxed text-blue-100">
          <span className="font-extrabold tracking-wider text-[#F2B632]">KANARI SERVICE</span>
          <span className="mx-2 text-white/40">•</span>
          Vos besoins, notre organisation.
        </footer>
      </div>
    </main>
  );
}
