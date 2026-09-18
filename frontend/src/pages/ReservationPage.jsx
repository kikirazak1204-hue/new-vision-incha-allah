import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Camera, FileText, MapPin, 
  User, Phone, Map, ArrowRight, Loader2, CheckCircle, AlertCircle, Mic, Square 
} from 'lucide-react';

// ==========================================
// SOUS-COMPOSANT : FORMULAIRE DÉTAILLÉ PAR SERVICE
// ==========================================
const ServiceDetailCard = ({ service, details, onChangeDetail }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const photos = details.photos || [];
  const fichiers = details.fichiers || [];

  // Gestion de l'enregistrement vocal
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onChangeDetail('vocal', { blob: audioBlob, url: audioUrl });
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Erreur micro :', err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-start border-b pb-3">
        <div>
          <h4 className="font-black text-slate-800 text-base">{service.nom || service.serviceNom}</h4>
          <p className="text-xs text-slate-500">Service Kanari sélectionné</p>
        </div>
        <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
          {service.prix || service.tarif || 0} XOF
        </span>
      </div>

      {/* Description du besoin */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">Description de votre besoin</label>
        <textarea 
          rows="3"
          value={details.description || ''}
          onChange={(e) => onChangeDetail('description', e.target.value)}
          placeholder="Précisez votre demande pour ce service..." 
          className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
        />
      </div>

      {/* Enregistrement Vocal */}
      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
        <div className="text-xs font-bold text-slate-700 mb-2">Message vocal (Optionnel)</div>
        <div className="flex items-center gap-3">
          {!recording ? (
            <button 
              type="button" 
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 transition"
            >
              <Mic size={14} /> Enregistrer un vocal
            </button>
          ) : (
            <button 
              type="button" 
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-white animate-pulse"
            >
              <Square size={14} /> Arrêter l'enregistrement
            </button>
          )}
        </div>

        {details.vocal?.url && (
          <div className="mt-3">
            <p className="text-[11px] text-slate-500 mb-1">Écouter votre vocal :</p>
            <audio controls src={details.vocal.url} className="w-full h-10" />
          </div>
        )}
      </div>

      {/* Upload Photos */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Photos (4 max)</label>
        <div className="flex gap-2 flex-wrap items-center">
          {(photos).map((photoObj, pIdx) => (
            <div key={pIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border">
              <img src={photoObj.preview} alt="Aperçu" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => onChangeDetail('removePhoto', pIdx)} 
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <label className="w-16 h-16 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 transition">
              <Camera size={20} />
              <input type="file" accept="image/*" multiple onChange={(e) => onChangeDetail('addPhotos', e.target.files)} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Documents */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">Documents (PDF, Word)</label>
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition">
          <FileText size={16} /> Parcourir les fichiers ({fichiers.length})
          <input type="file" multiple onChange={(e) => onChangeDetail('addFiles', e.target.files)} className="hidden" />
        </label>
      </div>
    </div>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL : RESERVATION PAGE
// ==========================================
export default function ReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [servicesSelectionnes, setServicesSelectionnes] = useState([]);
  const [fournisseurPreselectionne, setFournisseurPreselectionne] = useState(null);

  // Socle client : Seul le téléphone est obligatoire
  const [socle, setSocle] = useState({
    clientNom: '',
    telephone: '',
    adresse: '',
    coords: null
  });

  const [detailsServices, setDetailsServices] = useState({});

  useEffect(() => {
    const state = location.state || {};
    const services = state.services || JSON.parse(localStorage.getItem('kanari_cart') || '[]');
    const fournisseur = state.fournisseur || JSON.parse(localStorage.getItem('selectedFournisseur') || 'null');

    const servicesAvecId = services.map((s, idx) => ({
      ...s,
      safeId: s.safeId || s.id || `srv_${idx}`
    }));

    setServicesSelectionnes(servicesAvecId);
    setFournisseurPreselectionne(fournisseur);

    // Pré-remplissage automatique si l'utilisateur est connecté
    const userStored = JSON.parse(localStorage.getItem('user') || '{}');
    if (userStored) {
      setSocle(prev => ({
        ...prev,
        clientNom: userStored.nom || userStored.name || '',
        telephone: userStored.telephone || userStored.phone || '',
        adresse: userStored.adresse || ''
      }));
    }
  }, [location]);

  // Gérer la mise à jour des détails d'un service spécifique
  const handleServiceDetailChange = (srvSafeId, actionType, payload) => {
    setDetailsServices(prev => {
      const current = prev[srvSafeId] || {};
      let updated = { ...current };

      if (actionType === 'description') updated.description = payload;
      if (actionType === 'vocal') updated.vocal = payload;
      if (actionType === 'addPhotos') {
        const files = Array.from(payload);
        const newPhotos = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        updated.photos = [...(current.photos || []), ...newPhotos].slice(0, 4);
      }
      if (actionType === 'removePhoto') {
        updated.photos = (current.photos || []).filter((_, idx) => idx !== payload);
      }
      if (actionType === 'addFiles') {
        const files = Array.from(payload).map(file => ({ file, nom: file.name, taille: file.size }));
        updated.fichiers = [...(current.fichiers || []), ...files];
      }

      return { ...prev, [srvSafeId]: updated };
    });
  };

  const handleGeolocalisation = () => {
    if (!navigator.geolocation) return alert("La géolocalisation n'est pas supportée.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSocle(prev => ({ ...prev, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
        setMessage({ text: 'Position GPS enregistrée avec succès !', type: 'success' });
      },
      () => alert("Impossible de récupérer votre position GPS.")
    );
  };

  const totalMontant = servicesSelectionnes.reduce((acc, srv) => acc + Number(srv.prix || srv.tarif || 0), 0);

  // SOUMMISSION DU FORMULAIRE SÉCURISÉE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Règle stricte : Le numéro de téléphone est obligatoire
    if (!socle.telephone || !socle.telephone.trim()) {
      return setMessage({ text: 'Le numéro de téléphone est obligatoire pour valider la réservation.', type: 'error' });
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      const donneesDeBase = {
        clientNom: socle.clientNom || 'Client Kanari',
        telephone: socle.telephone.trim(),
        adresse: socle.adresse || 'Non renseignée',
        coordonneesGps: socle.coords,
        fournisseurId: fournisseurPreselectionne?.id || fournisseurPreselectionne?._id || null,
        services: servicesSelectionnes.map(srv => {
          const details = detailsServices[srv.safeId] || {};
          return {
            serviceId: srv.realDbId || srv.safeId,
            safeId: srv.safeId,
            nom: srv.nom || srv.serviceNom,
            prix: Number(srv.prix || srv.tarif || 0),
            description: details.description || ''
          };
        })
      };

      formData.append('donneesReservation', JSON.stringify(donneesDeBase));

      // Ajout des fichiers, photos et vocaux
      servicesSelectionnes.forEach(srv => {
        const details = detailsServices[srv.safeId] || {};
        
        if (details.photos) {
          details.photos.forEach(p => formData.append(`photo_${srv.safeId}`, p.file));
        }
        if (details.fichiers) {
          details.fichiers.forEach(f => formData.append(`document_${srv.safeId}`, f.file));
        }
        if (details.vocal?.blob) {
          formData.append(`vocal_${srv.safeId}`, details.vocal.blob, 'vocal-besoin.webm');
        }
      });

      const API = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';
      const res = await fetch(`${API}/api/reservations/global`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });

      // Lecture sécurisée pour éviter l'erreur Unexpected end of JSON input
      const textRes = await res.text();
      const data = textRes ? JSON.parse(textRes) : {};

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Erreur lors de l’envoi de la réservation.');
      }

      // Nettoyage panier
      ['kanari_cart', 'selectedService', 'selectedFournisseur'].forEach(k => localStorage.removeItem(k));

      setMessage({ text: 'Réservation validée avec succès !', type: 'success' });
      setTimeout(() => navigate('/dashboard-client'), 1500);

    } catch (err) {
      console.error('Erreur soumission:', err);
      setMessage({ text: err.message || 'Erreur de connexion au serveur.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-[#061a3a]">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-[#061a3a] text-white p-6 sm:p-8">
          <button onClick={() => navigate(-1)} className="text-xs font-bold text-amber-400 mb-2 hover:underline">← Retour</button>
          <h2 className="text-2xl sm:text-3xl font-black">Finaliser votre réservation</h2>
          <p className="text-sm text-slate-300 mt-1">Renseignez votre numéro et décrivez votre besoin (texte ou vocal).</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section Coordonnées (Seul le téléphone est obligatoire) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-600">1. Vos coordonnées</h3>
            
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Votre numéro de téléphone <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  required
                  value={socle.telephone} 
                  onChange={e => setSocle(p => ({ ...p, telephone: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm font-semibold"
                  placeholder="Ex. 90000000" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom complet (Optionnel)</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={socle.clientNom} 
                    onChange={e => setSocle(p => ({ ...p, clientNom: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm"
                    placeholder="Votre nom" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adresse (Optionnel)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={socle.adresse} 
                    onChange={e => setSocle(p => ({ ...p, adresse: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm"
                    placeholder="Votre quartier" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <button 
                type="button" 
                onClick={handleGeolocalisation}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2"
              >
                <Map size={16} /> Utiliser ma position GPS
              </button>
              {socle.coords && <span className="text-xs text-emerald-600 font-bold">GPS enregistré ✓</span>}
            </div>
          </div>

          {/* Section Services & Description/Vocal */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-600">2. Détails de la prestation</h3>
            {servicesSelectionnes.map((srv) => (
              <ServiceDetailCard 
                key={srv.safeId} 
                service={srv} 
                details={detailsServices[srv.safeId] || {}} 
                onChangeDetail={(action, payload) => handleServiceDetailChange(srv.safeId, action, payload)}
              />
            ))}
          </div>

          {/* Validation */}
          <div className="pt-6 border-t flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Total estimé</span>
              <span className="text-xl font-black text-slate-900">{totalMontant} XOF</span>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              Confirmer la commande
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}