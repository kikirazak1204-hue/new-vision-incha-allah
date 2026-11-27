
export default function DashboardClient() {
    const navigate = useNavigate();

    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [chatMission, setChatMission] = useState(null);
    const [remarqueMission, setRemarqueMission] = useState(null);
    const [bonMission, setBonMission] = useState(null);

    const [activeTab, setActiveTab] = useState('overview');
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [finance, setFinance] = useState({
        missions: {},
        commandes: [],
        totaux: null,
        erreur: null
    });

    const requestLock = useRef(false);
    const financeLock = useRef(false);

    const token = useMemo(
        () => localStorage.getItem('token'),
        []
    );

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch {
            return {};
        }
    });

    // ---------------------------------------------------------
    // IDENTITÉ CLIENT
    // ---------------------------------------------------------

    const nomClient =
        currentUser?.prenom ||
        currentUser?.nom ||
        'Bienvenue';

    const initiales = (
        `${currentUser?.prenom?.[0] || ''}${currentUser?.nom?.[0] || ''}`
    ).toUpperCase() || 'K';

    // ---------------------------------------------------------
    // FINANCES
    // ---------------------------------------------------------

    const chargerFinance = async () => {
        if (financeLock.current) return;

        financeLock.current = true;

        try {
            const f = await getPaiementsClientMissions();

            const map = {};

            (f.data || []).forEach(x => {
                map[x.reservationId] = x;
            });

            setFinance({
                missions: map,
                commandes: f.commandes || [],
                totaux: f.totaux || null,
                erreur: null
            });
        } catch (e) {
            setFinance(prev => ({
                ...prev,
                erreur: e?.message || 'Paiements indisponibles.'
            }));
        } finally {
            financeLock.current = false;
        }
    };

    // ---------------------------------------------------------
    // CHARGEMENT DU DASHBOARD
    // ---------------------------------------------------------

    const chargerDashboard = async (silencieux = false) => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (requestLock.current) return;

        requestLock.current = true;

        if (!silencieux) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        try {
            const res = await getDashboardClient();

            if (!res?.success) {
                throw new Error(
                    res?.message || 'Impossible de récupérer votre espace client.'
                );
            }

            setMissions(
                Array.isArray(res.data?.missions)
                    ? res.data.missions
                    : []
            );

            setError(null);

            await chargerFinance();

        } catch (err) {
            console.error('Erreur dashboard client :', err);

            if (!silencieux) {
                setError(
                    err?.message ||
                    'Impossible de charger vos réservations.'
                );
            }
        } finally {
            requestLock.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        chargerDashboard(false);

        const interval = setInterval(() => {
            chargerDashboard(true);
        }, 15000);

        const onFocus = () => chargerDashboard(true);

        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [token, navigate]);

    // ---------------------------------------------------------
    // MISE À JOUR DU PROFIL
    // ---------------------------------------------------------

    const handleProfilMisAJour = (userMisAJour) => {
        setCurrentUser(prev => {
            const fusionne = {
                ...prev,
                ...userMisAJour
            };

            try {
                localStorage.setItem('user', JSON.stringify(fusionne));
            } catch {}

            return fusionne;
        });
    };

    // ---------------------------------------------------------
    // REMARQUES
    // ---------------------------------------------------------

    const handleRemarqueSaved = (missionId, nouvelleRemarque) => {
        setMissions(prev =>
            prev.map(m =>
                m.id === missionId
                    ? { ...m, remarqueClient: nouvelleRemarque }
                    : m
            )
        );
    };

    // ---------------------------------------------------------
    // VALIDATION DU BON
    // ---------------------------------------------------------

    const handleBonValide = (missionId) => {
        setBonMission(null);

        chargerDashboard(true);

        if (missionId) {
            navigate('/paiement', {
                state: { reservationId: missionId }
            });
        }
    };

    // ---------------------------------------------------------
    // DONNÉES CALCULÉES
    // ---------------------------------------------------------

    const missionsList = Array.isArray(missions) ? missions : [];

    const missionsActives = missionsList.filter(m =>
        STATUTS_ACTIFS?.includes(m?.statut)
    );

    const missionsAValider = missionsList.filter(
        m => m?.statut === 'TERMINEE'
    );

    const missionsTerminees = missionsList.filter(
        m => m?.statut === 'VALIDEE'
    );

    const missionsEnAttenteOffres = missionsList.filter(
        m =>
            m?.statut === 'EN_ATTENTE' &&
            !m?.fournisseurId &&
            !m?.abonnementId
    );

    const commandes = finance.commandes || [];
    const paiementsMissions = finance.missions || {};

    const toutesTransactions = [
        ...Object.values(paiementsMissions),
        ...commandes
    ].filter(x =>
        !['sans_bon', 'annulee'].includes(x.etat)
    );

    const totalDepense = Number(finance.totaux?.paye || 0);

    const commandesAPayer = commandes.filter(
        c => c.etat === 'a_payer'
    ).length;

    const montantAffiche = (m) => {
        const f = paiementsMissions[m?.id];

        if (f?.montant != null) {
            return {
                texte: fcfa(f.montant),
                libelle: 'Montant du bon'
            };
        }

        const estime = Number(m?.montantTotal || m?.montant || 0);

        if (estime > 0) {
            return {
                texte: fcfa(estime),
                libelle: 'Montant estimé'
            };
        }

        return {
            texte: 'À définir',
            libelle: 'Montant'
        };
    };

    // ---------------------------------------------------------
    // NAVIGATION
    // ---------------------------------------------------------

    const tabs = [
        { id: 'overview', label: "Vue d'ensemble", icon: '⌂' },
        {
            id: 'missions',
            label: 'Mes réservations',
            icon: '▤',
            badge: missionsActives.length + missionsAValider.length
        },
        {
            id: 'offres',
            label: 'Offres reçues',
            icon: '◇',
            badge: missionsEnAttenteOffres.length
        },
        {
            id: 'commandes',
            label: 'Mes commandes',
            icon: '▣',
            badge: commandesAPayer
        },
        { id: 'abonnements', label: 'Mes abonnements', icon: '◈' },
        {
            id: 'recus',
            label: 'Mes reçus',
            icon: '▧',
            badge: missionsTerminees.length
        },
        { id: 'portefeuille', label: 'Mon portefeuille', icon: '◉' },
        {
            id: 'paiements',
            label: 'Paiements & transactions',
            icon: '⇄',
            badge: toutesTransactions.length
        },
        { id: 'profil', label: 'Mon profil', icon: '♙' }
    ];

    const changerOnglet = (id) => {
        setActiveTab(id);
        setMenuOuvert(false);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ---------------------------------------------------------
    // COMPOSANTS VISUELS
    // ---------------------------------------------------------

    const boutonClasse =
        'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50';

    const carteClasse =
        'bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200';

    const Statistique = ({ label, valeur, detail, icon }) => (
        <div className={`${carteClasse} p-5 relative overflow-hidden`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-[#071B3A] mt-3 tracking-tight">
                        {valeur}
                    </p>
                    {detail && (
                        <p className="text-xs text-slate-500 mt-2">
                            {detail}
                        </p>
                    )}
                </div>

                <div className="w-11 h-11 rounded-xl bg-[#071B3A] text-[#E6B94A] flex items-center justify-center text-xl shrink-0">
                    {icon}
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#071B3A] to-[#D6A83D]" />
        </div>
    );

    const SectionTitre = ({ titre, description, action }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
                <h2 className="text-xl font-black text-[#071B3A]">
                    {titre}
                </h2>
                {description && (
                    <p className="text-sm text-slate-500 mt-1">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );

    const BoutonPrincipal = ({ children, onClick, className = '', ...props }) => (
        <button
            onClick={onClick}
            className={`${boutonClasse} bg-[#D9AD47] hover:bg-[#C99A30] text-[#071B3A] shadow-sm ${className}`}
            {...props}
        >
            {children}
        </button>
    );

    // ---------------------------------------------------------
    // CHARGEMENT INITIAL
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#071B3A] flex items-center justify-center shadow-xl shadow-blue-950/20">
                        <span className="text-[#E6B94A] text-3xl font-black">K</span>
                    </div>

                    <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden mt-6 mx-auto">
                        <div className="h-full w-2/3 bg-[#D9AD47] rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-[#071B3A] font-bold mt-5">
                        Préparation de votre espace
                    </h2>

                    <p className="text-slate-500 text-xs mt-2">
                        Kanari Service · Espace Client
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-5">
                <div className={`${carteClasse} max-w-md w-full p-8 text-center`}>
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl">
                        !
                    </div>
                    <h2 className="text-lg font-black text-[#071B3A] mt-5">
                        Impossible de charger votre espace
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">{error}</p>
                    <button
                        onClick={() => chargerDashboard(false)}
                        className={`${boutonClasse} bg-[#071B3A] text-white mt-6 w-full`}
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // INTERFACE PRINCIPALE
    // ---------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F5F7FB] text-slate-800 font-sans print:bg-white">

            {/* HEADER MOBILE */}
            <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-16 bg-[#071B3A] border-b border-white/10 px-4 flex items-center justify-between shadow-lg print:hidden">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D9AD47] flex items-center justify-center text-[#071B3A] font-black text-lg">
                        K
                    </div>
                    <div>
                        <p className="text-white font-black text-sm leading-tight">
                            KANARI SERVICE
                        </p>
                        <p className="text-[#E6B94A] text-[9px] uppercase tracking-[0.2em] font-bold">
                            Espace client
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setMenuOuvert(!menuOuvert)}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-xl"
                    aria-label="Ouvrir le menu"
                >
                    {menuOuvert ? '×' : '☰'}
                </button>
            </header>

            {/* MENU MOBILE */}
            {menuOuvert && (
                <div className="lg:hidden fixed inset-0 z-50 bg-[#071B3A] pt-20 px-5 pb-8 overflow-y-auto print:hidden">
                    <div className="flex items-center justify-between mb-7">
                        <div>
                            <p className="text-[#E6B94A] text-xs font-bold uppercase tracking-widest">
                                Navigation
                            </p>
                            <h2 className="text-white text-xl font-black mt-1">
                                Mon espace
                            </h2>
                        </div>
                        <button
                            onClick={() => setMenuOuvert(false)}
                            className="w-10 h-10 rounded-xl bg-white/10 text-white text-xl"
                        >
                            ×
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            navigate('/');
                            setMenuOuvert(false);
                        }}
                        className="w-full p-4 rounded-2xl bg-[#D9AD47] text-[#071B3A] font-black text-sm mb-5 text-left"
                    >
                        + Nouvelle demande de service
                    </button>

                    <nav className="space-y-2">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => changerOnglet(t.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === t.id
                                        ? 'bg-[#D9AD47] text-[#071B3A]'
                                        : 'bg-white/5 text-white hover:bg-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-lg">{t.icon}</span>
                                    {t.label}
                                </span>
                                {t.badge > 0 && (
                                    <span className="bg-white text-[#071B3A] rounded-full px-2.5 py-1 text-[10px] font-black">
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                navigate('/historique-paiements');
                                setMenuOuvert(false);
                            }}
                            className="w-full p-4 rounded-xl bg-white/5 text-white text-left text-sm font-bold"
                        >
                            Historique des paiements →
                        </button>
                    </nav>
                </div>
            )}

            <div className="lg:flex min-h-screen">

                {/* SIDEBAR DESKTOP */}
                <aside className="hidden lg:flex w-[270px] shrink-0 bg-[#071B3A] text-white flex-col fixed inset-y-0 left-0 z-30 print:hidden">

                    <div className="p-7 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#D9AD47] flex items-center justify-center text-[#071B3A] font-black text-2xl shadow-lg">
                                K
                            </div>
                            <div>
                                <h2 className="text-base font-black tracking-tight">
                                    KANARI SERVICE
                                </h2>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#E6B94A] font-bold mt-1">
                                    Espace Client
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3.5 rounded-xl bg-[#D9AD47] hover:bg-[#C99A30] text-[#071B3A] font-black text-sm shadow-lg transition-all active:scale-95"
                        >
                            + Nouvelle demande
                        </button>
                    </div>

                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-3 py-3">
                            Mon espace
                        </p>

                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => changerOnglet(t.id)}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left text-xs font-bold transition-all ${
                                    activeTab === t.id
                                        ? 'bg-[#D9AD47] text-[#071B3A] shadow-md'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-lg w-5 text-center">
                                        {t.icon}
                                    </span>
                                    {t.label}
                                </span>

                                {t.badge > 0 && (
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                                        activeTab === t.id
                                            ? 'bg-[#071B3A] text-[#E6B94A]'
                                            : 'bg-white/15 text-white'
                                    }`}>
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="p-5 border-t border-white/10">
                        <div className="bg-white/5 rounded-2xl p-4">
                            <p className="text-[#E6B94A] text-[10px] font-bold uppercase tracking-widest">
                                Assistance Kanari
                            </p>
                            <p className="text-slate-300 text-xs leading-relaxed mt-2">
                                Besoin d'aide pour votre réservation ?
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="text-white text-xs font-bold mt-3 hover:text-[#E6B94A]"
                            >
                                Contacter Kanari →
                            </button>
                        </div>
                    </div>
                </aside>

                {/* CONTENU PRINCIPAL */}
                <main className="flex-1 min-w-0 lg:ml-[270px] pt-20 lg:pt-0 px-4 sm:px-6 lg:px-9 py-7 lg:py-9 print:hidden">

                    {/* BARRE SUPÉRIEURE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-[#B28A32] uppercase tracking-[0.18em] text-[10px] font-black">
                                Votre espace personnel
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#071B3A] mt-1 tracking-tight">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Gérez vos services et suivez vos demandes en toute simplicité.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => chargerDashboard(true)}
                                disabled={refreshing}
                                className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-[#071B3A] flex items-center justify-center hover:bg-slate-50 transition-all"
                                title="Actualiser"
                            >
                                <span className={refreshing ? 'animate-spin' : ''}>↻</span>
                            </button>

                            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                                <div className="w-9 h-9 rounded-xl bg-[#071B3A] text-[#E6B94A] flex items-center justify-center font-black text-sm">
                                    {initiales}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs font-black text-[#071B3A]">
                                        {nomClient}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Client Kanari
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ALERTE VALIDATION */}
                    {missionsAValider.length > 0 && (
                        <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-lg">
                                    ✓
                                </div>
                                <div>
                                    <p className="font-black text-emerald-900 text-sm">
                                        Intervention à valider
                                    </p>
                                    <p className="text-emerald-800 text-xs mt-1">
                                        {missionsAValider.length} intervention(s) terminée(s) attendent votre confirmation.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setBonMission(missionsAValider[0])}
                                className={`${boutonClasse} bg-emerald-600 text-white hover:bg-emerald-700`}
                            >
                                Vérifier le bon →
                            </button>
                        </div>
                    )}

                    {/* VUE D'ENSEMBLE */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">

                            <section className="relative overflow-hidden rounded-3xl bg-[#071B3A] text-white p-6 sm:p-8 shadow-xl">
                                <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full border border-[#D9AD47]/20" />
                                <div className="absolute -right-5 -top-12 w-48 h-48 rounded-full border border-[#D9AD47]/20" />

                                <div className="relative z-10 max-w-2xl">
                                    <span className="inline-flex px-3 py-1.5 rounded-full bg-white/10 text-[#E6B94A] text-[10px] font-bold uppercase tracking-widest">
                                        Espace client Kanari
                                    </span>

                                    <h2 className="text-2xl sm:text-3xl font-black mt-4 leading-tight">
                                        Bonjour {nomClient} !
                                    </h2>

                                    <p className="text-slate-300 text-sm mt-3 max-w-lg leading-relaxed">
                                        Vos services, vos réservations et vos paiements réunis dans un seul espace.
                                        Kanari coordonne vos besoins et assure le suivi de vos interventions.
                                    </p>

                                    <button
                                        onClick={() => navigate('/')}
                                        className="mt-6 px-6 py-3 rounded-xl bg-[#D9AD47] text-[#071B3A] font-black text-sm hover:bg-[#C99A30] transition-all"
                                    >
                                        + Faire une nouvelle demande
                                    </button>
                                </div>
                            </section>

                            <section>
                                <SectionTitre
                                    titre="Vue générale"
                                    description="La situation de vos services en un coup d'œil."
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <Statistique
                                        label="Demandes actives"
                                        valeur={missionsActives.length}
                                        detail="Prestations en traitement"
                                        icon="◷"
                                    />
                                    <Statistique
                                        label="À valider"
                                        valeur={missionsAValider.length}
                                        detail="Interventions terminées"
                                        icon="✓"
                                    />
                                    <Statistique
                                        label="Prestations validées"
                                        valeur={missionsTerminees.length}
                                        detail="Missions clôturées"
                                        icon="◆"
                                    />
                                    <Statistique
                                        label="Total dépensé"
                                        valeur={`${totalDepense.toLocaleString('fr-FR')} F`}
                                        detail="Paiements enregistrés"
                                        icon="₣"
                                    />
                                </div>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                                <div className={`${carteClasse} p-6 xl:col-span-2`}>
                                    <SectionTitre
                                        titre="Dernières missions"
                                        description="Suivez les interventions en cours."
                                        action={
                                            <button
                                                onClick={() => changerOnglet('missions')}
                                                className="text-xs text-[#A77D23] font-black hover:underline"
                                            >
                                                Tout voir →
                                            </button>
                                        }
                                    />

                                    {missionsActives.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl">
                                            <div className="text-3xl mb-3">⌂</div>
                                            <p className="text-sm font-bold text-[#071B3A]">
                                                Aucune mission active
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Vos prochaines interventions apparaîtront ici.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {missionsActives.slice(0, 3).map(m => (
                                                <div
                                                    key={m.id}
                                                    className="border border-slate-200 rounded-xl p-4 hover:border-[#D9AD47] transition-all"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-500">
                                                                MISSION #{m.id}
                                                            </p>
                                                            <p className="font-black text-[#071B3A] mt-1">
                                                                {m.service?.nom || m.serviceNom || 'Service'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {m.prestataire?.nomEntreprise || 'Recherche de prestataire...'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <StatutBadge statut={m.statut} />
                                                            <button
                                                                onClick={() => setChatMission(m)}
                                                                className="px-3 py-2 rounded-lg bg-[#071B3A] text-white text-xs font-bold"
                                                            >
                                                                Chat
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {m.statut === 'EN_COURS' && (
                                                        (m.latitude || m.latitudeClient || m.prestataire?.latitude)
                                                    ) && (
                                                        <div className="mt-4">
                                                            <KanariGeoMap
                                                                clientPosition={{
                                                                    latitude: m.latitudeClient ?? m.latitude,
                                                                    longitude: m.longitudeClient ?? m.longitude
                                                                }}
                                                                providerPosition={{
                                                                    latitude: m.prestataire?.latitude ?? m.fournisseurLatitude,
                                                                    longitude: m.prestataire?.longitude ?? m.fournisseurLongitude
                                                                }}
                                                                providerName={m.prestataire?.nomEntreprise || 'Prestataire'}
                                                                missionStatus={m.statut}
                                                                height={250}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={`${carteClasse} p-6`}>
                                    <SectionTitre
                                        titre="Accès rapides"
                                        description="Vos services en un clic."
                                    />

                                    <div className="space-y-2">
                                        {[
                                            ['Mes réservations', 'missions', '▤'],
                                            ['Offres reçues', 'offres', '◇'],
                                            ['Mes commandes', 'commandes', '▣'],
                                            ['Mon portefeuille', 'portefeuille', '◉'],
                                            ['Mes reçus', 'recus', '▧']
                                        ].map(([label, id, icon]) => (
                                            <button
                                                key={id}
                                                onClick={() => changerOnglet(id)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#F8F1DF] transition-all text-left"
                                            >
                                                <span className="flex items-center gap-3 text-sm font-bold text-[#071B3A]">
                                                    <span className="text-[#B28A32] text-lg">{icon}</span>
                                                    {label}
                                                </span>
                                                <span className="text-slate-400">→</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-5 p-4 bg-[#071B3A] rounded-xl text-white">
                                        <p className="text-[#E6B94A] text-[10px] font-bold uppercase tracking-widest">
                                            Kanari Service
                                        </p>
                                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                            Vos besoins, notre organisation.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* MES RÉSERVATIONS */}
                    {activeTab === 'missions' && (
                        <section>
                            <SectionTitre
                                titre="Toutes mes réservations"
                                description="Retrouvez et suivez chacune de vos demandes."
                                action={
                                    <BoutonPrincipal onClick={() => navigate('/')}>
                                        + Nouvelle demande
                                    </BoutonPrincipal>
                                }
                            />

                            {missionsList.length === 0 ? (
                                <div className={`${carteClasse} p-12 text-center`}>
                                    <p className="text-3xl mb-3">▤</p>
                                    <h3 className="font-black text-[#071B3A]">
                                        Aucune réservation
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-2">
                                        Vos réservations apparaîtront ici.
                                    </p>
                                    <BoutonPrincipal
                                        onClick={() => navigate('/')}
                                        className="mt-5"
                                    >
                                        Découvrir les services
                                    </BoutonPrincipal>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {missionsList.map(m => {
                                        const montant = montantAffiche(m);
                                        const paiement = paiementsMissions[m.id];

                                        return (
                                            <article
                                                key={m.id}
                                                className={`${carteClasse} p-5 sm:p-6`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-[10px] font-black text-[#A77D23] uppercase tracking-wider">
                                                                Mission #{m.id}
                                                            </span>
                                                            {m.abonnementId && (
                                                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                                                                    Abonnement
                                                                </span>
                                                            )}
                                                            <TypeBadge type={m.type} />
                                                        </div>

                                                        <h3 className="text-lg font-black text-[#071B3A] mt-2">
                                                            {m.service?.nom || m.serviceNom || 'Service'}
                                                        </h3>

                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {m.prestataire?.nomEntreprise || 'Prestataire en attente'}
                                                        </p>

                                                        {m.adresse && (
                                                            <p className="text-xs text-slate-500 mt-2">
                                                                📍 {m.adresse}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <StatutBadge statut={m.statut} />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                                                    <div className="bg-slate-50 rounded-xl p-4">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                                                            {montant.libelle}
                                                        </p>
                                                        <p className="text-lg font-black text-[#071B3A] mt-1">
                                                            {montant.texte}
                                                        </p>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-xl p-4">
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                                                            Paiement
                                                        </p>
                                                        <div className="mt-2">
                                                            {paiement && !['sans_bon', 'annulee'].includes(paiement.etat) ? (
                                                                <EtatPaiementBadge etat={paiement.etat} />
                                                            ) : (
                                                                <span className="text-xs text-slate-500">
                                                                    En attente d'information
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-5">
                                                    {m.statut === 'TERMINEE' && (
                                                        <button
                                                            onClick={() => setBonMission(m)}
                                                            className={`${boutonClasse} bg-emerald-600 text-white hover:bg-emerald-700 flex-1`}
                                                        >
                                                            ✓ Vérifier et valider
                                                        </button>
                                                    )}

                                                    {paiement?.etat === 'a_payer' && (
                                                        <button
                                                            onClick={() => navigate('/paiement', {
                                                                state: { reservationId: m.id }
                                                            })}
                                                            className={`${boutonClasse} bg-[#071B3A] text-white flex-1`}
                                                        >
                                                            Payer {fcfa(paiement.montant)}
                                                        </button>
                                                    )}

                                                    {m.statut === 'VALIDEE' && (
                                                        <button
                                                            onClick={() => setRemarqueMission(m)}
                                                            className={`${boutonClasse} bg-[#F8F1DF] text-[#8B661C]`}
                                                        >
                                                            ☆ Laisser un avis
                                                        </button>
                                                    )}

                                                    {m.statut && !['EN_ATTENTE', 'ANNULEE'].includes(m.statut) && (
                                                        <button
                                                            onClick={() => setChatMission(m)}
                                                            className={`${boutonClasse} border border-slate-200 text-[#071B3A] bg-white`}
                                                        >
                                                            ✉ Ouvrir le chat
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {/* OFFRES REÇUES */}
                    {activeTab === 'offres' && (
                        <section>
                            <SectionTitre
                                titre="Offres reçues"
                                description="Comparez les propositions des prestataires avant de choisir."
                            />
                            <OngletOffresRecues
                                missions={missionsList}
                                token={token}
                                onDevisAccepte={() => chargerDashboard(true)}
                            />
                        </section>
                    )}

                    {/* COMMANDES */}
                    {activeTab === 'commandes' && (
                        <section>
                            <SectionTitre
                                titre="Mes commandes"
                                description="Suivez vos achats et commandes marketplace."
                            />
                            <OngletCommandesClient navigate={navigate} />
                        </section>
                    )}

                    {/* ABONNEMENTS */}
                    {activeTab === 'abonnements' && (
                        <section>
                            <SectionTitre
                                titre="Mes abonnements"
                                description="Retrouvez vos services sous abonnement."
                            />
                            <MesAbonnements />
                        </section>
                    )}

                    {/* REÇUS */}
                    {activeTab === 'recus' && (
                        <section>
                            <SectionTitre
                                titre="Mes reçus"
                                description="Consultez les documents de vos prestations validées."
                            />
                            <OngletRecus
                                missions={missionsList}
                                token={token}
                                finance={paiementsMissions}
                            />
                        </section>
                    )}

                    {/* PORTEFEUILLE */}
                    {activeTab === 'portefeuille' && (
                        <section className="space-y-5">
                            <div className="rounded-3xl bg-[#071B3A] p-6 sm:p-8 text-white">
                                <p className="text-[#E6B94A] text-xs font-bold uppercase tracking-widest">
                                    Services financiers
                                </p>
                                <h2 className="text-2xl font-black mt-2">
                                    Mon portefeuille
                                </h2>
                                <p className="text-sm text-slate-300 mt-2">
                                    Gérez vos opérations et vos récompenses Kanari.
                                </p>
                            </div>
                            <MonPortefeuille />
                        </section>
                    )}

                    {/* PAIEMENTS */}
                    {activeTab === 'paiements' && (
                        <section>
                            <SectionTitre
                                titre="Paiements & transactions"
                                description="Consultez les paiements liés à vos missions et commandes."
                            />
                            <OngletPaiementsClient
                                missions={missionsList}
                                finance={finance}
                                navigate={navigate}
                                onValiderBon={(id) => {
                                    const m = missionsList.find(x => x.id === id);
                                    if (m) setBonMission(m);
                                }}
                                onRefresh={() => chargerDashboard(true)}
                            />
                        </section>
                    )}

                    {/* PROFIL */}
                    {activeTab === 'profil' && (
                        <section>
                            <SectionTitre
                                titre="Mon profil"
                                description="Maintenez vos informations personnelles à jour."
                            />
                            <OngletProfilClient
                                currentUser={currentUser}
                                onProfilMisAJour={handleProfilMisAJour}
                            />
                        </section>
                    )}

                    {/* PIED DE PAGE */}
                    <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-400">
                        <p>
                            © {new Date().getFullYear()} Kanari Service.
                            Tous droits réservés.
                        </p>
                        <p className="font-semibold text-[#A77D23]">
                            Vos besoins, notre organisation.
                        </p>
                    </footer>
                </main>
            </div>

            {/* MODALES EXISTANTES */}
            {chatMission && (
                <ChatModal
                    mission={chatMission}
                    userId={currentUser?.id}
                    token={token}
                    onClose={() => setChatMission(null)}
                />
            )}

            {remarqueMission && (
                <RemarqueModal
                    mission={remarqueMission}
                    token={token}
                    onClose={() => setRemarqueMission(null)}
                    onSaved={handleRemarqueSaved}
                />
            )}

            {bonMission && (
                <BonAValiderModal
                    mission={bonMission}
                    token={token}
                    onClose={() => setBonMission(null)}
                    onValide={handleBonValide}
                />
            )}
        </div>
    );
}
