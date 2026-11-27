import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ValidationsAdmin from '../components/admin/ValidationsAdmin';
import UtilisateursAdmin from '../components/admin/UtilisateursAdmin';
import ProduitsAdmin from '../components/admin/ProduitsAdmin';
import ReservationsAdmin from '../components/admin/ReservationsAdmin';
import ParametresAdmin from '../components/admin/ParametresAdmin';
import AbonnementsAdmin from '../components/admin/AbonnementsAdmin';
import AdminLiveDispatch from './AdminLiveDispatch';
import PaiementAdmin from '../components/admin/PaiementAdmin';
import ServicesAdmin from '../components/admin/ServicesAdmin';
import FinancesAdmin from '../components/admin/FinancesAdmin';

let FicheUtilisateur360 = null;
try {
  // eslint-disable-next-line global-require
  FicheUtilisateur360 = require('../components/admin/FicheUtilisateur360').default;
} catch {
  FicheUtilisateur360 = null;
}

const API_BASE = import.meta.env?.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function EspaceDossiersContratsRecrutement({ initialUserId, onSelectUser360 }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || '');
  const [fiche, setFiche] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('dossier');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingFiche, setLoadingFiche] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Formulaires Dossier, KYC, Contrat, Recrutement
  const [dossierForm, setDossierForm] = useState({
    matricule: '',
    quartier: '',
    adresseDetaillee: '',
    personneUrgenceNom: '',
    personneUrgenceTel: '',
    statutDossier: 'INCOMPLET',
    noteAdmin: '',
  });

  const [docForm, setDocForm] = useState({
    typeDocument: 'CNI',
    titre: '',
    fichierUrl: '',
    dateExpiration: '',
  });

  const [rejetMotifs, setRejetMotifs] = useState({});

  const [contratForm, setContratForm] = useState({
    referenceContrat: '',
    typeContrat: 'PRESTATION',
    titre: '',
    dateDebut: '',
    dateFin: '',
    tauxCommission: '',
    montantConvenu: '',
    fichierContratUrl: '',
    statut: 'BROUILLON',
  });

  const [recrutementForm, setRecrutementForm] = useState({
    posteVise: '',
    sourceCandidature: '',
    etape: 'NOUVEAU',
    noteEvaluation: '',
    dateEntretien: '',
    compteRendu: '',
  });

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(String(initialUserId));
    }
  }, [initialUserId]);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setLoadingList(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/utilisateurs`, {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (!active) return;
        const list = Array.isArray(json.data) ? json.data : [];
        setUsers(list);
        if (!selectedUserId && list.length > 0) {
          setSelectedUserId(String(list[0].id));
        }
      } catch (err) {
        if (active) {
          setFeedback({ type: 'error', text: 'Impossible de charger la liste des utilisateurs.' });
        }
      } finally {
        if (active) setLoadingList(false);
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const fetchFiche360 = async (userId) => {
    if (!userId) return;
    setLoadingFiche(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/users/${userId}/360`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Erreur lors du chargement de la fiche 360°.');
      }
      setFiche(json.data);
      const d = json.data?.user?.dossier || {};
      setDossierForm({
        matricule: d.matricule || '',
        quartier: d.quartier || '',
        adresseDetaillee: d.adresseDetaillee || '',
        personneUrgenceNom: d.personneUrgenceNom || '',
        personneUrgenceTel: d.personneUrgenceTel || '',
        statutDossier: d.statutDossier || 'INCOMPLET',
        noteAdmin: d.noteAdmin || '',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingFiche(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchFiche360(selectedUserId);
      if (typeof onSelectUser360 === 'function') {
        onSelectUser360(selectedUserId);
      }
    }
  }, [selectedUserId]);

  const handleSaveDossier = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/users/${selectedUserId}/dossier`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dossierForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec enregistrement dossier');
      setFeedback({ type: 'success', text: 'Dossier et matricule enregistrés.' });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/users/${selectedUserId}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(docForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec ajout document');
      setDocForm({ typeDocument: 'CNI', titre: '', fichierUrl: '', dateExpiration: '' });
      setFeedback({ type: 'success', text: 'Pièce justificative ajoutée au dossier.' });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleVerifyDocument = async (docId, statutVerification) => {
    const motifRejet = rejetMotifs[docId] || '';
    if (statutVerification === 'REJETE' && !motifRejet.trim()) {
      setFeedback({ type: 'error', text: 'Indiquez un motif de rejet avant de rejeter la pièce.' });
      return;
    }
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statutVerification, motifRejet }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec vérification');
      setFeedback({ type: 'success', text: `Document marqué : ${statutVerification}.` });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleCreateContrat = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/users/${selectedUserId}/contrats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contratForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec création contrat');
      setContratForm({
        referenceContrat: '',
        typeContrat: 'PRESTATION',
        titre: '',
        dateDebut: '',
        dateFin: '',
        tauxCommission: '',
        montantConvenu: '',
        fichierContratUrl: '',
        statut: 'BROUILLON',
      });
      setFeedback({ type: 'success', text: 'Contrat créé et rattaché au dossier.' });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleUpdateContratStatut = async (contratId, statut) => {
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/contrats/${contratId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec mise à jour contrat');
      setFeedback({ type: 'success', text: `Contrat mis à jour : ${statut}.` });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleSaveRecrutement = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dossiers/users/${selectedUserId}/recrutement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(recrutementForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Échec suivi recrutement');
      setRecrutementForm({
        posteVise: '',
        sourceCandidature: '',
        etape: 'NOUVEAU',
        noteEvaluation: '',
        dateEntretien: '',
        compteRendu: '',
      });
      setFeedback({ type: 'success', text: 'Étape de recrutement enregistrée.' });
      await fetchFiche360(selectedUserId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const currentUserObj = fiche?.user;
  const resume = fiche?.resume || {};
  const documents = currentUserObj?.dossier?.documents || [];
  const contrats = currentUserObj?.contrats || [];
  const candidatures = currentUserObj?.candidatures || [];
  const historiques = currentUserObj?.historiqueActions || [];

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-black text-[#061A3A]">
            Fiche Utilisateur 360° — Dossiers, KYC, Contrats & Recrutement
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion centralisée par utilisateur : matricule, pièces justificatives, contrats et recrutement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="select-user-360" className="text-xs font-bold text-slate-700">
            Utilisateur :
          </label>
          <select
            id="select-user-360"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loadingList}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#061A3A]"
          >
            <option value="">-- Choisir un utilisateur --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                #{u.id} — {u.prenom ? `${u.prenom} ${u.nom}` : u.nom} ({u.role || 'utilisateur'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loadingFiche ? (
        <div className="py-10 text-center text-sm font-bold text-slate-500">
          Chargement du dossier 360°...
        </div>
      ) : !currentUserObj ? (
        <div className="py-10 text-center text-sm text-slate-500">
          Sélectionnez un utilisateur pour consulter ou compléter son dossier.
        </div>
      ) : (
        <>
          {/* Résumé KPI de la fiche 360° */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold uppercase text-slate-500">Identité & Rôle</div>
              <div className="text-sm font-black text-[#061A3A] mt-1">
                {currentUserObj.prenom ? `${currentUserObj.prenom} ${currentUserObj.nom}` : currentUserObj.nom}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Rôle : <span className="font-bold">{currentUserObj.role}</span>
                {currentUserObj.roleAdmin ? ` • Admin: ${currentUserObj.roleAdmin}` : ''}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold uppercase text-slate-500">Matricule & Dossier</div>
              <div className="text-sm font-black text-[#061A3A] mt-1">
                {currentUserObj.dossier?.matricule || 'Non attribué'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Statut : <span className="font-bold">{currentUserObj.dossier?.statutDossier || 'INCOMPLET'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold uppercase text-slate-500">Conformité KYC</div>
              <div className="text-sm font-black text-[#061A3A] mt-1">
                {resume.kycCompletionPct ?? 0}% validé
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {resume.documentsValides ?? 0}/{resume.totalDocuments ?? 0} pièces validées
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold uppercase text-slate-500">Contrats & Recrutement</div>
              <div className="text-sm font-black text-[#061A3A] mt-1">
                {resume.totalContrats ?? 0} contrat(s)
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {resume.totalCandidatures ?? 0} fiche(s) recrutement
              </div>
            </div>
          </div>

          {/* Onglets internes de la Fiche 360° */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'dossier', label: 'Dossier & Matricule' },
              { id: 'kyc', label: `Pièces KYC (${documents.length})` },
              { id: 'contrats', label: `Contrats (${contrats.length})` },
              { id: 'recrutement', label: `Recrutement (${candidatures.length})` },
              { id: 'audit', label: `Journal d'Audit (${historiques.length})` },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubTab(sub.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                  activeSubTab === sub.id
                    ? 'bg-[#061A3A] text-[#F2B632]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SOUS-ONGLET 1 : DOSSIER & MATRICULE */}
          {activeSubTab === 'dossier' && (
            <form onSubmit={handleSaveDossier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matricule</label>
                <input
                  type="text"
                  value={dossierForm.matricule}
                  onChange={(e) => setDossierForm({ ...dossierForm, matricule: e.target.value })}
                  placeholder="Généré auto si vide (ex: KNR-2026-0001)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statut du dossier</label>
                <select
                  value={dossierForm.statutDossier}
                  onChange={(e) => setDossierForm({ ...dossierForm, statutDossier: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="INCOMPLET">INCOMPLET</option>
                  <option value="EN_VERIFICATION">EN_VERIFICATION</option>
                  <option value="VALIDE">VALIDE</option>
                  <option value="A_METTRE_A_JOUR">A_METTRE_A_JOUR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quartier</label>
                <input
                  type="text"
                  value={dossierForm.quartier}
                  onChange={(e) => setDossierForm({ ...dossierForm, quartier: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse détaillée</label>
                <input
                  type="text"
                  value={dossierForm.adresseDetaillee}
                  onChange={(e) => setDossierForm({ ...dossierForm, adresseDetaillee: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personne d&apos;urgence (Nom)</label>
                <input
                  type="text"
                  value={dossierForm.personneUrgenceNom}
                  onChange={(e) => setDossierForm({ ...dossierForm, personneUrgenceNom: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personne d&apos;urgence (Téléphone)</label>
                <input
                  type="text"
                  value={dossierForm.personneUrgenceTel}
                  onChange={(e) => setDossierForm({ ...dossierForm, personneUrgenceTel: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Note interne Admin</label>
                <textarea
                  rows={3}
                  value={dossierForm.noteAdmin}
                  onChange={(e) => setDossierForm({ ...dossierForm, noteAdmin: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-[#061A3A] px-5 py-2.5 text-sm font-extrabold text-[#F2B632] hover:opacity-95"
                >
                  Enregistrer le dossier
                </button>
              </div>
            </form>
          )}

          {/* SOUS-ONGLET 2 : PIÈCES KYC & VÉRIFICATION */}
          {activeSubTab === 'kyc' && (
            <div className="space-y-6">
              <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <select
                  value={docForm.typeDocument}
                  onChange={(e) => setDocForm({ ...docForm, typeDocument: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="CNI">CNI</option>
                  <option value="PASSEPORT">PASSEPORT</option>
                  <option value="CV">CV</option>
                  <option value="DIPLOME">DIPLOME</option>
                  <option value="RCCM">RCCM</option>
                  <option value="NIF">NIF</option>
                  <option value="CASIER">CASIER</option>
                  <option value="AUTRE">AUTRE</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Titre de la pièce (ex: CNI Recto/Verso)"
                  value={docForm.titre}
                  onChange={(e) => setDocForm({ ...docForm, titre: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="URL du document (Firebase / lien)"
                  value={docForm.fichierUrl}
                  onChange={(e) => setDocForm({ ...docForm, fichierUrl: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#F2B632] px-4 py-2 text-sm font-black text-[#061A3A]"
                >
                  + Ajouter pièce
                </button>
              </form>

              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune pièce justificative enregistrée pour ce dossier.</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-black text-[#061A3A]">
                            {doc.typeDocument}
                          </span>
                          <span className="font-bold text-sm text-[#061A3A]">{doc.titre}</span>
                          <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                            {doc.statutVerification}
                          </span>
                        </div>
                        {doc.fichierUrl && (
                          <a
                            href={doc.fichierUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-xs font-semibold text-blue-700 underline mt-1"
                          >
                            Consulter la pièce
                          </a>
                        )}
                        {doc.motifRejet && (
                          <p className="text-xs text-rose-700 font-semibold mt-1">
                            Motif de rejet : {doc.motifRejet}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Motif si rejet..."
                          value={rejetMotifs[doc.id] || ''}
                          onChange={(e) => setRejetMotifs({ ...rejetMotifs, [doc.id]: e.target.value })}
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'VALIDE')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'REJETE')}
                          className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SOUS-ONGLET 3 : CONTRATS */}
          {activeSubTab === 'contrats' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateContrat} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <select
                  value={contratForm.typeContrat}
                  onChange={(e) => setContratForm({ ...contratForm, typeContrat: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="PRESTATION">PRESTATION</option>
                  <option value="PARTENARIAT_B2B">PARTENARIAT_B2B</option>
                  <option value="STAGE">STAGE</option>
                  <option value="CDD">CDD</option>
                  <option value="CDI">CDI</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Titre du contrat"
                  value={contratForm.titre}
                  onChange={(e) => setContratForm({ ...contratForm, titre: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Référence (optionnel)"
                  value={contratForm.referenceContrat}
                  onChange={(e) => setContratForm({ ...contratForm, referenceContrat: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  required
                  value={contratForm.dateDebut}
                  onChange={(e) => setContratForm({ ...contratForm, dateDebut: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={contratForm.dateFin}
                  onChange={(e) => setContratForm({ ...contratForm, dateFin: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Taux commission (%)"
                  value={contratForm.tauxCommission}
                  onChange={(e) => setContratForm({ ...contratForm, tauxCommission: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#061A3A] px-5 py-2 text-sm font-extrabold text-[#F2B632]"
                  >
                    Créer le contrat
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {contrats.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun contrat enregistré pour cet utilisateur.</p>
                ) : (
                  contrats.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <div className="text-sm font-black text-[#061A3A]">
                          {c.referenceContrat} — {c.titre}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Type : {c.typeContrat} • Du {c.dateDebut} {c.dateFin ? `au ${c.dateFin}` : ''} • Statut :{' '}
                          <span className="font-bold">{c.statut}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.statut !== 'SIGNE' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateContratStatut(c.id, 'SIGNE')}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white"
                          >
                            Marquer Signé
                          </button>
                        )}
                        {c.statut !== 'RESILIE' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateContratStatut(c.id, 'RESILIE')}
                            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white"
                          >
                            Résilier
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SOUS-ONGLET 4 : RECRUTEMENT */}
          {activeSubTab === 'recrutement' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveRecrutement} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="text"
                  required
                  placeholder="Poste visé ou spécialité"
                  value={recrutementForm.posteVise}
                  onChange={(e) => setRecrutementForm({ ...recrutementForm, posteVise: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={recrutementForm.etape}
                  onChange={(e) => setRecrutementForm({ ...recrutementForm, etape: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="NOUVEAU">NOUVEAU</option>
                  <option value="PRESELECTION">PRESELECTION</option>
                  <option value="ENTRETIEN">ENTRETIEN</option>
                  <option value="TEST_TERRAIN">TEST_TERRAIN</option>
                  <option value="RETENU">RETENU</option>
                  <option value="REFUSE">REFUSE</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  placeholder="Note d'évaluation"
                  value={recrutementForm.noteEvaluation}
                  onChange={(e) => setRecrutementForm({ ...recrutementForm, noteEvaluation: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Compte rendu d'entretien ou test terrain..."
                  value={recrutementForm.compteRendu}
                  onChange={(e) => setRecrutementForm({ ...recrutementForm, compteRendu: e.target.value })}
                  className="md:col-span-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#F2B632] px-5 py-2 text-sm font-black text-[#061A3A]"
                  >
                    Enregistrer l&apos;étape
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {candidatures.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune fiche de recrutement pour cet utilisateur.</p>
                ) : (
                  candidatures.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm font-black text-[#061A3A]">
                        {r.posteVise} — <span className="text-indigo-700">{r.etape}</span>
                      </div>
                      {r.noteEvaluation !== null && r.noteEvaluation !== undefined && (
                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                          Note : {r.noteEvaluation}
                        </div>
                      )}
                      {r.compteRendu && (
                        <p className="text-xs text-slate-600 mt-1">{r.compteRendu}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SOUS-ONGLET 5 : JOURNAL D'AUDIT */}
          {activeSubTab === 'audit' && (
            <div className="space-y-2">
              {historiques.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune action enregistrée dans le journal d&apos;audit.</p>
              ) : (
                historiques.map((h) => (
                  <div key={h.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                    <div className="font-bold text-[#061A3A]">
                      {h.action} • par {h.administrateur?.nom || `Admin #${h.adminId}`}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString('fr-FR') : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { id: routeUserId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(routeUserId ? 'dossiers' : 'reservations');
  const [selectedUserId, setSelectedUserId] = useState(routeUserId || '');

  useEffect(() => {
    if (routeUserId) {
      setSelectedUserId(String(routeUserId));
      setTab('dossiers');
    }
  }, [routeUserId]);

  const menuItems = [
    { id: 'reservations', label: 'Missions' },
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'services', label: 'Services' },
    { id: 'live-gps', label: 'Tour de Contrôle' },
    { id: 'validations', label: 'Validations' },
    { id: 'utilisateurs', label: 'Utilisateurs' },
    { id: 'dossiers', label: 'Dossiers & Contrats' },
    { id: 'recrutement', label: 'Recrutement' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'finances', label: 'Finances' },
    { id: 'produits', label: 'Produits' },
    { id: 'parametres', label: 'Paramètres' },
  ];

  const getTitle = () => {
    switch (tab) {
      case 'reservations': return 'Missions';
      case 'abonnements': return 'Abonnements';
      case 'live-gps': return 'Tour de Contrôle GPS';
      case 'validations': return 'Validations';
      case 'utilisateurs': return 'Utilisateurs';
      case 'dossiers': return 'Dossiers, KYC & Contrats';
      case 'recrutement': return 'Recrutement & Sélection';
      case 'paiements': return 'Paiements';
      case 'finances': return 'Finances Kanari';
      case 'produits': return 'Produits';
      case 'parametres': return 'Paramètres';
      case 'services': return 'Services et branches';
      default: return 'Administration';
    }
  };

  const handleSelectUser360 = (userId) => {
    setSelectedUserId(String(userId));
    if (routeUserId && String(routeUserId) !== String(userId)) {
      navigate(`/admin/utilisateurs/${userId}/360`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#061A3A] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#061A3A] text-white border-r border-white/10 p-6 flex flex-col shadow-lg">
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            PANEL <span className="text-[#F2B632]">ADMIN</span>
          </h1>
          <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mt-1">
            Kanari Service
          </p>
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold ${
                  isActive
                    ? 'bg-[#F2B632] text-[#061A3A] shadow-md'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'live-gps' && !isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#F2B632] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full py-2.5 px-3 text-sm font-bold text-amber-300 hover:bg-white/10 rounded-xl transition-colors"
          >
            Quitter l&apos;Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#061A3A]">{getTitle()}</h2>
              <p className="text-slate-500 text-sm mt-1">
                {tab === 'live-gps'
                  ? 'Suivi en temps réel des prestataires et livreurs'
                  : 'Gestion des données de la plateforme'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-indigo-200/80 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-sm font-bold text-[#061A3A]">Administration</span>
            </div>
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-4 shadow-sm">
          {tab === 'reservations' && <ReservationsAdmin />}
          {tab === 'abonnements' && <AbonnementsAdmin />}
          {tab === 'live-gps' && <AdminLiveDispatch />}
          {tab === 'validations' && <ValidationsAdmin />}
          {tab === 'utilisateurs' && <UtilisateursAdmin />}
          {(tab === 'dossiers' || tab === 'recrutement') && (
            FicheUtilisateur360 ? (
              <FicheUtilisateur360
                userId={selectedUserId}
                mode={tab}
                onSelectUser={handleSelectUser360}
              />
            ) : (
              <EspaceDossiersContratsRecrutement
                initialUserId={selectedUserId}
                onSelectUser360={handleSelectUser360}
              />
            )
          )}
          {tab === 'paiements' && <PaiementAdmin />}
          {tab === 'finances' && <FinancesAdmin />}
          {tab === 'produits' && <ProduitsAdmin />}
          {tab === 'parametres' && <ParametresAdmin />}
          {tab === 'services' && <ServicesAdmin />}
        </div>
      </main>
    </div>
  );
}