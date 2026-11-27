const {
  sequelize,
  User,
  Fournisseur,
  Dossier,
  Document,
  Contrat,
  Recrutement,
  AuditLog,
} = require('../models');

// Helper interne : trace une action admin sans faire planter la requête principale
async function logAudit({ adminId, targetUserId, action, details = null }) {
  try {
    if (!AuditLog || !adminId || !targetUserId) return;
    await AuditLog.create({
      adminId,
      targetUserId,
      action,
      details,
    });
  } catch (err) {
    console.warn('⚠️ AuditLog non enregistré :', err.message);
  }
}

// Génère un matricule unique si aucun matricule n'est fourni
async function generateMatricule(transaction) {
  const year = new Date().getFullYear();
  const count = await Dossier.count({ transaction });
  let candidate;
  let exists = true;
  let seq = count + 1;

  while (exists) {
    candidate = `KNR-${year}-${String(seq).padStart(4, '0')}`;
    const found = await Dossier.findOne({ where: { matricule: candidate }, transaction });
    exists = Boolean(found);
    seq += 1;
  }

  return candidate;
}

// 📋 GET /api/admin/dossiers/users/:id/360 — Fiche 360° complète d'un utilisateur
exports.getUser360 = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Fournisseur, as: 'profilFournisseur', required: false },
        {
          model: Dossier,
          as: 'dossier',
          required: false,
          include: [
            {
              model: Document,
              as: 'documents',
              required: false,
              order: [['createdAt', 'DESC']],
            },
          ],
        },
        {
          model: Contrat,
          as: 'contrats',
          required: false,
          order: [['createdAt', 'DESC']],
        },
        {
          model: Recrutement,
          as: 'candidatures',
          required: false,
          order: [['createdAt', 'DESC']],
        },
        {
          model: AuditLog,
          as: 'historiqueActions',
          required: false,
          limit: 30,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'administrateur',
              attributes: ['id', 'nom', 'prenom', 'role'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const docs = user.dossier?.documents || [];
    const totalDocs = docs.length;
    const validDocs = docs.filter((d) => d.statutVerification === 'VALIDE').length;
    const rejectedDocs = docs.filter((d) => d.statutVerification === 'REJETE').length;
    const kycCompletionPct = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

    return res.json({
      success: true,
      data: {
        user,
        resume: {
          totalDocuments: totalDocs,
          documentsValides: validDocs,
          documentsRejetes: rejectedDocs,
          kycCompletionPct,
          totalContrats: (user.contrats || []).length,
          totalCandidatures: (user.candidatures || []).length,
        },
      },
    });
  } catch (error) {
    console.error('❌ Erreur getUser360 :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// 📁 PUT /api/admin/dossiers/users/:id/dossier — Créer ou mettre à jour le dossier + matricule
exports.upsertDossier = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
    }

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const CHAMPS_DOSSIER = [
      'matricule',
      'quartier',
      'adresseDetaillee',
      'personneUrgenceNom',
      'personneUrgenceTel',
      'specialites',
      'statutDossier',
      'noteAdmin',
    ];

    const payload = {};
    CHAMPS_DOSSIER.forEach((champ) => {
      if (req.body[champ] !== undefined) payload[champ] = req.body[champ];
    });

    let dossier = await Dossier.findOne({ where: { userId }, transaction });

    if (!dossier) {
      if (!payload.matricule) {
        payload.matricule = await generateMatricule(t);
      }
      dossier = await Dossier.create({ userId, ...payload }, { transaction });
    } else {
      if (!dossier.matricule && !payload.matricule) {
        payload.matricule = await generateMatricule(t);
      }
      await dossier.update(payload, { transaction });
    }

    await t.commit();

    await logAudit({
      adminId: req.user.id,
      targetUserId: userId,
      action: 'MISE_A_JOUR_DOSSIER',
      details: { dossierId: dossier.id, matricule: dossier.matricule, statutDossier: dossier.statutDossier },
    });

    return res.json({
      success: true,
      message: 'Dossier utilisateur enregistré avec succès.',
      data: dossier,
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ Erreur upsertDossier :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// 📄 POST /api/admin/dossiers/users/:id/documents — Ajouter une pièce justificative (URL Firebase ou fichier)
exports.addDocument = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { typeDocument, titre, fichierUrl, dateExpiration } = req.body;

    if (!typeDocument || !titre || !fichierUrl) {
      return res.status(400).json({
        success: false,
        message: 'Les champs typeDocument, titre et fichierUrl sont obligatoires.',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    let dossier = await Dossier.findOne({ where: { userId } });
    if (!dossier) {
      const matricule = await generateMatricule();
      dossier = await Dossier.create({ userId, matricule });
    }

    const doc = await Document.create({
      dossierId: dossier.id,
      typeDocument,
      titre,
      fichierUrl,
      dateExpiration: dateExpiration || null,
      statutVerification: 'EN_ATTENTE',
    });

    await logAudit({
      adminId: req.user.id,
      targetUserId: userId,
      action: 'AJOUT_DOCUMENT_KYC',
      details: { documentId: doc.id, typeDocument, titre },
    });

    return res.status(201).json({
      success: true,
      message: 'Document ajouté au dossier.',
      data: doc,
    });
  } catch (error) {
    console.error('❌ Erreur addDocument :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// ✅ PATCH /api/admin/dossiers/documents/:docId/verify — Valider ou rejeter un document KYC
exports.verifyDocument = async (req, res) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    const { statutVerification, motifRejet } = req.body;

    if (!['VALIDE', 'REJETE', 'EN_ATTENTE'].includes(statutVerification)) {
      return res.status(400).json({ success: false, message: 'Statut de vérification invalide.' });
    }

    if (statutVerification === 'REJETE' && (!motifRejet || !String(motifRejet).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Un motif de rejet est obligatoire lorsque le document est rejeté.',
      });
    }

    const doc = await Document.findByPk(docId, {
      include: [{ model: Dossier, as: 'dossier' }],
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document introuvable.' });
    }

    await doc.update({
      statutVerification,
      motifRejet: statutVerification === 'REJETE' ? String(motifRejet).trim() : null,
      verifiePar: req.user.id,
      verifieLe: new Date(),
    });

    if (doc.dossier?.userId) {
      await logAudit({
        adminId: req.user.id,
        targetUserId: doc.dossier.userId,
        action: `KYC_${statutVerification}`,
        details: { documentId: doc.id, typeDocument: doc.typeDocument, motifRejet: doc.motifRejet },
      });
    }

    return res.json({
      success: true,
      message: `Document marqué comme ${statutVerification}.`,
      data: doc,
    });
  } catch (error) {
    console.error('❌ Erreur verifyDocument :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// 📝 POST /api/admin/dossiers/users/:id/contrats — Créer un contrat lié à l'utilisateur
exports.createContrat = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const {
      referenceContrat,
      typeContrat,
      titre,
      dateDebut,
      dateFin,
      tauxCommission,
      montantConvenu,
      fichierContratUrl,
      statut,
    } = req.body;

    if (!typeContrat || !titre || !dateDebut) {
      return res.status(400).json({
        success: false,
        message: 'Les champs typeContrat, titre et dateDebut sont obligatoires.',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const ref =
      referenceContrat && String(referenceContrat).trim()
        ? String(referenceContrat).trim()
        : `CTR-${new Date().getFullYear()}-${userId}-${Date.now().toString().slice(-4)}`;

    const contrat = await Contrat.create({
      userId,
      referenceContrat: ref,
      typeContrat,
      titre,
      dateDebut,
      dateFin: dateFin || null,
      tauxCommission: tauxCommission !== undefined && tauxCommission !== '' ? tauxCommission : null,
      montantConvenu: montantConvenu !== undefined && montantConvenu !== '' ? montantConvenu : null,
      fichierContratUrl: fichierContratUrl || null,
      statut: statut || 'BROUILLON',
    });

    await logAudit({
      adminId: req.user.id,
      targetUserId: userId,
      action: 'CREATION_CONTRAT',
      details: { contratId: contrat.id, referenceContrat: contrat.referenceContrat, typeContrat },
    });

    return res.status(201).json({
      success: true,
      message: 'Contrat créé avec succès.',
      data: contrat,
    });
  } catch (error) {
    console.error('❌ Erreur createContrat :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// ✍️ PATCH /api/admin/dossiers/contrats/:contratId — Mettre à jour le statut ou le PDF signé d'un contrat
exports.updateContrat = async (req, res) => {
  try {
    const contratId = parseInt(req.params.contratId, 10);
    const contrat = await Contrat.findByPk(contratId);

    if (!contrat) {
      return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    }

    const CHAMPS_CONTRAT = [
      'titre',
      'dateDebut',
      'dateFin',
      'tauxCommission',
      'montantConvenu',
      'fichierContratUrl',
      'fichierSigneUrl',
      'statut',
    ];

    const payload = {};
    CHAMPS_CONTRAT.forEach((c) => {
      if (req.body[c] !== undefined) payload[c] = req.body[c];
    });

    if (payload.statut === 'SIGNE' && !contrat.signeLe) {
      payload.signeLe = new Date();
    }

    await contrat.update(payload);

    await logAudit({
      adminId: req.user.id,
      targetUserId: contrat.userId,
      action: 'MISE_A_JOUR_CONTRAT',
      details: { contratId: contrat.id, referenceContrat: contrat.referenceContrat, statut: contrat.statut },
    });

    return res.json({
      success: true,
      message: 'Contrat mis à jour.',
      data: contrat,
    });
  } catch (error) {
    console.error('❌ Erreur updateContrat :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};

// 🎯 POST /api/admin/dossiers/users/:id/recrutement — Ajouter ou faire avancer une fiche de recrutement
exports.upsertRecrutement = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const {
      recrutementId,
      posteVise,
      sourceCandidature,
      etape,
      noteEvaluation,
      compteRendu,
      dateEntretien,
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    let recrutement;
    if (recrutementId) {
      recrutement = await Recrutement.findByPk(recrutementId);
      if (!recrutement) {
        return res.status(404).json({ success: false, message: 'Fiche de recrutement introuvable.' });
      }
      await recrutement.update({
        posteVise: posteVise !== undefined ? posteVise : recrutement.posteVise,
        sourceCandidature: sourceCandidature !== undefined ? sourceCandidature : recrutement.sourceCandidature,
        etape: etape !== undefined ? etape : recrutement.etape,
        noteEvaluation: noteEvaluation !== undefined && noteEvaluation !== '' ? noteEvaluation : recrutement.noteEvaluation,
        compteRendu: compteRendu !== undefined ? compteRendu : recrutement.compteRendu,
        dateEntretien: dateEntretien !== undefined ? dateEntretien : recrutement.dateEntretien,
        evaluePar: req.user.id,
      });
    } else {
      if (!posteVise) {
        return res.status(400).json({ success: false, message: 'Le champ posteVise est obligatoire.' });
      }
      recrutement = await Recrutement.create({
        userId,
        posteVise,
        sourceCandidature: sourceCandidature || null,
        etape: etape || 'NOUVEAU',
        noteEvaluation: noteEvaluation !== undefined && noteEvaluation !== '' ? noteEvaluation : null,
        compteRendu: compteRendu || null,
        dateEntretien: dateEntretien || null,
        evaluePar: req.user.id,
      });
    }

    await logAudit({
      adminId: req.user.id,
      targetUserId: userId,
      action: 'SUIVI_RECRUTEMENT',
      details: { recrutementId: recrutement.id, posteVise: recrutement.posteVise, etape: recrutement.etape },
    });

    return res.status(recrutementId ? 200 : 201).json({
      success: true,
      message: 'Suivi de recrutement enregistré.',
      data: recrutement,
    });
  } catch (error) {
    console.error('❌ Erreur upsertRecrutement :', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.', error: error.message });
  }
};