import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Camera, FileText, MapPin, Calendar, 
  User, Phone, Map, ShieldCheck, ArrowRight, Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';

// ==========================================
// SOUS-COMPOSANT : RECAPITULATIF SERVICE
// ==========================================
const RecapitulatifService = ({ service, details, config }) => {
  if (!service) return null;

  const photos = details?.photos || [];
  const fichiers = details?.fichiers || [];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-slate-800">{service.nom || service.serviceNom}</h4>
          <p className="text-xs text-slate-500">{config.typeFormulaire || 'Standard'}</p>
        </div>
        {config.paiementObligatoire && (
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {service.prix || service.tarif || 0} XOF
          </span>
        )}
      </div>

      {/* Aperçu des photos jointes */}
      {photos.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-bold text-slate-500 block mb-1">Photos ({photos.length})</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photoObj, idx) => (
              <img 
                key={idx} 
                src={photoObj.preview} 
                alt={`Preuve ${idx + 1}`} 
                className="w-14 h-14 object-cover rounded-lg border border-slate-200" 
              />
            ))}
          </div>
        </div>
      )}

      {/* Fichiers joints */}
      {fichiers.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-bold text-slate-500 block mb-1">Documents ({fichiers.length})</span>
          <div className="space-y-1">
            {fichiers.map((f, idx) => (
              <div key={idx} className="text-xs bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between">
                <span className="truncate max-w-[200px]">{f.nom}</span>
                <span className="text-slate-400">{(f.taille / 1024).toFixed(1)} Ko</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [lang, setLang] = useState('fr');

  // Données de base et sélection reçues de la navigation ou du localStorage
  const [servicesSelectionnes, setServicesSelectionnes] = useState([]);
  const [fournisseurPreselectionne, setFournisseurPreselectionne] = useState(null);

  // État du formulaire socle (Client)
  const [socle, setSocle] = useState({
    clientNom: '',
    telephone: '',
    adresse: '',
    coords: null,
    dateIntervention: ''
  });

  // Stockage des détails et fichiers par service (clé = safeId)
  const [detailsServices, setDetailsServices] = useState({});

  useEffect(() => {
    // Récupération des données depuis location.state ou localStorage
    const state = location.state || {};
    const services = state.services || JSON.parse(localStorage.getItem('kanari_cart') || '[]');
    const fournisseur = state.fournisseur || JSON.parse(localStorage.getItem('selectedFournisseur') || 'null');

    // Assigner un safeId unique si absent
    const servicesAvecId = services.map((s, idx) => ({
      ...s,
      safeId: s.safeId || s.id || `srv_${idx}`
    }));

    setServicesSelectionnes(servicesAvecId);
    setFournisseurPreselectionne(fournisseur);

    // Pré-remplir les infos utilisateur si connectén (optionnel)
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

  // Configuration dynamique par service (exemple basique)
  const getConfigPourService = (srv) => {
    return {
      typeFormulaire: srv.typeFormulaire || 'standard',
      paiementObligatoire: srv.paiementObligatoire ?? true
    };
  };

  // Gestion de la géolocalisation
  const handleGeolocalisation = () => {
    if (!navigator.geolocation) {
      return alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setSocle(prev => ({ ...prev, coords }));
        setMessage({ text: 'Position GPS enregistrée avec succès !', type: 'success' });
      },
      (error) => {
        alert("Impossible de récupérer votre position GPS.");
      }
    );
  };

  // Gestion Upload Photos (avec URL.createObjectURL)
  const handlePhotoUpload = (srvSafeId, e) => {
    const files = Array.from(e.target.files);
    const currentPhotos = detailsServices[srvSafeId]?.photos || [];
    
    if (currentPhotos.length + files.length > 4) {
      alert("Maximum 4 photos autorisées.");
      return;
    }

    const nouvellesPhotos = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setDetailsServices(p => ({
      ...p,
      [srvSafeId]: {
        ...(p[srvSafeId] || {}),
        photos: [...currentPhotos, ...nouvellesPhotos].slice(0, 4)
      }
    }));
  };

  const handleRemovePhoto = (srvSafeId, pIdx) => {
    setDetailsServices(p => {
      const current = p[srvSafeId]?.photos || [];
      return {
        ...p,
        [srvSafeId]: {
          ...p[srvSafeId],
          photos: current.filter((_, idx) => idx !== pIdx)
        }
      };
    });
  };

  // Gestion Upload Documents
  const handleFileUpload = (srvSafeId, e) => {
    const files = Array.from(e.target.files);
    const nouveauxFichiers = files.map(file => ({
      file: file,
      nom: file.name,
      taille: file.size,
      type: file.type
    }));

    setDetailsServices(p => ({
      ...p,
      [srvSafeId]: {
        ...(p[srvSafeId] || {}),
        fichiers: [...(p[srvSafeId]?.fichiers || []), ...nouveauxFichiers]
      }
    }));
  };

  const requiresKanariPayment = servicesSelectionnes.some(srv => getConfigPourService(srv).paiementObligatoire);
  const totalMontant = servicesSelectionnes.reduce((acc, srv) => {
    const config = getConfigPourService(srv);
    return acc + (config.paiementObligatoire ? Number(srv.prix || srv.tarif || 0) : 0);
  }, 0);

  // SOUMMISSION DU FORMULAIRE AVEC FORMDATA
  const handleSubmit = async () => {
    setMessage({ text: '', type: '' });

    if (!socle.clientNom || !socle.telephone || !socle.adresse) {
      return setMessage({ text: 'Veuillez remplir vos informations (nom, téléphone, adresse).', type: 'error' });
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // 1. Données globales structurées au format JSON
      const donneesDeBase = {
        clientNom: socle.clientNom,
        telephone: socle.telephone,
        adresse: socle.adresse,
        coordonneesGps: socle.coords,
        dateIntervention: socle.dateIntervention ? new Date(socle.dateIntervention).toISOString() : null,
        modePaiement: requiresKanariPayment ? 'depot_kanari' : 'aucun',
        fournisseurId: fournisseurPreselectionne?.id || fournisseurPreselectionne?._id || null,
        services: servicesSelectionnes.map(srv => {
          const config = getConfigPourService(srv);
          const details = detailsServices[srv.safeId] || {};
          const { photos, fichiers, ...autresDetails } = details;

          return {
            serviceId: srv.realDbId || srv.safeId,
            safeId: srv.safeId,
            nom: srv.nom || srv.serviceNom,
            prix: config.paiementObligatoire ? Number(srv.prix || srv.tarif || 0) : 0,
            typeFormulaire: config.typeFormulaire,
            detailsParticuliers: autresDetails
          };
        })
      };

      // Ajout du JSON dans le FormData
      formData.append('donneesReservation', JSON.stringify(donneesDeBase));

      // 2. Injection des vrais fichiers binaires
      servicesSelectionnes.forEach(srv => {
        const details = detailsServices[srv.safeId] || {};
        
        if (details.photos) {
          details.photos.forEach(p => {
            formData.append(`photo_${srv.safeId}`, p.file);
          });
        }
        if (details.fichiers) {
          details.fichiers.forEach(f => {
            formData.append(`document_${srv.safeId}`, f.file);
          });
        }
      });

      // 3. Envoi de la requête HTTP
      const API = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API}/api/reservations/global`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData, // Pas de Content-Type manuel requis, fetch gère le multipart
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur lors de l\'envoi.');

      // Nettoyage du panier local
      ['kanari_cart', 'selectedService', 'selectedFournisseur'].forEach(k => localStorage.removeItem(k));

      // Redirection selon le montant
      if ((data.montantTotal || totalMontant) > 0) {
        navigate('/paiement', { state: { reservation: { id: data.id || data._id, montantTotal: data.montantTotal || totalMontant } } });
      } else {
        setMessage({ text: 'Votre réservation a été validée avec succès !', type: 'success' });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* En-tête */}
        <div className="bg-slate-900 text-white p-6">
          <h2 className="text-2xl font-bold">Finaliser votre réservation</h2>
          <p className="text-sm text-slate-400 mt-1">Vérifiez vos informations et validez votre demande.</p>
        </div>

        <div className="p-6 space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Section Coordonnées Client */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">1. Coordonnées</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={socle.clientNom} 
                    onChange={e => setSocle(p => ({ ...p, clientNom: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    placeholder="Votre nom" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={socle.telephone} 
                    onChange={e => setSocle(p => ({ ...p, telephone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    placeholder="Votre numéro" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Adresse d'intervention</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={socle.adresse} 
                  onChange={e => setSocle(p => ({ ...p, adresse: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                  placeholder="Quartier, Rue, Ville..." 
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={handleGeolocalisation}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2"
              >
                <Map size={16} /> Utiliser ma position GPS actuelle
              </button>
              {socle.coords && <span className="text-xs text-emerald-600 font-medium">GPS enregistré ✓</span>}
            </div>
          </div>

          {/* Section Services & Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">2. Services sélectionnés</h3>
            {servicesSelectionnes.map((srv) => {
              const config = getConfigPourService(srv);
              const details = detailsServices[srv.safeId] || {};

              return (
                <div key={srv.safeId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                  <RecapitulatifService service={srv} details={details} config={config} />

                  {/* Upload de photos spécifique au service */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Ajouter des photos (4 max)</label>
                    <div className="flex gap-2 flex-wrap items-center">
                      {(details.photos || []).map((photoObj, pIdx) => (
                        <div key={pIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                          <img src={photoObj.preview} alt="Aperçu" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => handleRemovePhoto(srv.safeId, pIdx)} 
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {(!details.photos || details.photos.length < 4) && (
                        <label className="w-16 h-16 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600">
                          <Camera size={20} />
                          <input type="file" accept="image/*" multiple onChange={e => handlePhotoUpload(srv.safeId, e)} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Upload de documents */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Joindre des documents (PDF, Word)</label>
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer">
                      <FileText size={16} /> Parcourir les fichiers
                      <input type="file" multiple onChange={e => handleFileUpload(srv.safeId, e)} className="hidden" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton de Soumission Global */}
          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Total à régler</span>
              <span className="text-xl font-bold text-slate-900">{totalMontant} XOF</span>
            </div>
            
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              Confirmer la commande
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}