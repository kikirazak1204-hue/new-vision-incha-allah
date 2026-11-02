import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Wrench,
  Truck,
  Sparkles,
  Building2
} from 'lucide-react';

export default function AProposPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-50 text-[#061a3a]">
      {/* 🚀 HERO SECTION / IDENTITÉ */}
      <section className="bg-[#061a3a] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> La référence du service à Niamey
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Kanari Service — Vos besoins, notre organisation.
          </h1>
          <p className="max-w-3xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Kanari Service est une plateforme moderne de coordination de services basée à Niamey. 
            Nous simplifions l'accès aux prestations professionnelles en apportant rigueur, sérénité 
            et accompagnement à chaque étape.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/reservation')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 text-sm"
            >
              Faire une demande <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/register-prestataire')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition flex items-center gap-2 text-sm"
            >
              Rejoindre le réseau
            </button>
          </div>
        </div>
      </section>

      {/* 🛡️ VALEUR AJOUTÉE & MISSION (SANS DÉVOILER LE MODÈLE INTERNE) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black">Plus qu'une mise en relation : un engagement de qualité</h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            Kanari Service dépasse la simple mise en contact. Nous prenons en charge la structure, l'organisation 
            et le suivi complet de vos demandes pour garantir une expérience fluide et sécurisée.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-black text-lg">Sélection & Confiance</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Chaque intervenant du réseau fait l'objet d'une vérification préalable rigoureuse. Vous confiez vos besoins à des acteurs professionnels et identifiés.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={24} />
            </div>
            <h3 className="font-black text-lg">Organisation Structurée</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Vos demandes sont centralisées et planifiées avec soin pour répondre avec précision à vos contraintes de temps et d'urgence à Niamey.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-black text-lg">Accompagnement de A à Z</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Nous veillons à la bonne exécution des opérations jusqu'à la validation finale du service, vous garantissant zéro tracas.
            </p>
          </div>
        </div>
      </section>

      {/* 👥 PUBLIC CIBLES & AVANTAGES */}
      <section className="bg-slate-100 py-14 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">Une solution pensée pour tous les acteurs</h2>
            <p className="text-slate-600 text-sm">Des services adaptés aux particuliers, aux professionnels et à nos partenaires.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Clients */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <Users className="text-blue-600" size={24} />
                <h3 className="font-black text-base">Pour les Clients</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">✓ <span>Gain de temps et sérénité au quotidien</span></li>
                <li className="flex items-start gap-2">✓ <span>Interventions uniques ou régulières (abonnements)</span></li>
                <li className="flex items-start gap-2">✓ <span>Suivi clair de l'historique de vos demandes</span></li>
                <li className="flex items-start gap-2">✓ <span>Services adaptés aux quartiers de Niamey</span></li>
              </ul>
            </div>

            {/* Prestataires */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <Briefcase className="text-amber-600" size={24} />
                <h3 className="font-black text-base">Pour les Prestataires</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">✓ <span>Accès à de nouvelles opportunités de travail</span></li>
                <li className="flex items-start gap-2">✓ <span>Valorisation de votre savoir-faire professionnel</span></li>
                <li className="flex items-start gap-2">✓ <span>Cadre d'intervention structuré et respectueux</span></li>
                <li className="flex items-start gap-2">✓ <span>Espace dédié pour piloter votre activité</span></li>
              </ul>
            </div>

            {/* Entreprises & Partenaires */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b pb-3">
                <Building2 className="text-emerald-600" size={24} />
                <h3 className="font-black text-base">Partenaires & Entreprises</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">✓ <span>Externalisation simplifiée de vos besoins logistiques</span></li>
                <li className="flex items-start gap-2">✓ <span>Entretien et gestion de locaux professionnels</span></li>
                <li className="flex items-start gap-2">✓ <span>Partenariats réseau solides et durables</span></li>
                <li className="flex items-start gap-2">✓ <span>Interlocuteur unique pour l'organisation</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ CATÉGORIES DE SERVICES */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black">Nos domaines d'intervention</h2>
          <p className="text-slate-600 text-sm">Une couverture complète pour vos exigences du quotidien et de l'entreprise.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Wrench className="mx-auto text-blue-600" size={28} />
            <p className="font-bold text-xs">Travaux & Dépannage</p>
            <p className="text-[11px] text-slate-500">Électricité, plomberie, menuiserie</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Sparkles className="mx-auto text-amber-500" size={28} />
            <p className="font-bold text-xs">Entretien & Nettoyage</p>
            <p className="text-[11px] text-slate-500">Locaux, domiciles, espaces pro</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Truck className="mx-auto text-emerald-600" size={28} />
            <p className="font-bold text-xs">Transport & Logistique</p>
            <p className="text-[11px] text-slate-500">Livraisons, coursier, déplacement</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <Building2 className="mx-auto text-purple-600" size={28} />
            <p className="font-bold text-xs">Services aux Entreprises</p>
            <p className="text-[11px] text-slate-500">Assistance, restauration, conciergerie</p>
          </div>
        </div>
      </section>

      {/* 📞 CONTACT & REJOINATION */}
      <section className="bg-[#061a3a] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">Prêt à collaborer avec Kanari Service ?</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Que vous soyez un particulier ayant un besoin précis, une entreprise cherchant un partenaire de confiance ou un prestataire souhaitant rejoindre le réseau.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-amber-400" /> Niamey, Niger
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-amber-400" /> +227 82 01 25 08
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-amber-400" /> kanariservice.ne@gmail.com
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}