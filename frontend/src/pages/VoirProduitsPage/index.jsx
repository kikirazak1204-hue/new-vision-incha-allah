import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, ShoppingCart, Loader2, Search, X,
  CheckCircle2, AlertCircle, RefreshCw, SlidersHorizontal, Eye,
  ImageOff, Sparkles, ChevronRight, ChevronLeft, Flame
} from 'lucide-react';
import { usePanier } from '../../context/PanierContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

function getImageUrl(image) {
  if (!image) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return `${API_BASE}/uploads/${String(image).replace(/^\/+/, '')}`;
}

function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) ? `${value.toLocaleString('fr-FR')} FCFA` : 'Prix à confirmer';
}

function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(product.image || product.photo || product.imageUrl);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#EEF4FB] to-[#FFF7E5] text-[#123D72] ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <ImageOff size={32} strokeWidth={1.6} />
          <span className="text-xs font-semibold text-slate-500">Photo non disponible</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.nom || 'Produit Kanari'}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${className}`}
    />
  );
}

function ProductCard({ product, index, onOpen, onAdd, adding, compact = false }) {
  const id = product.id || product._id || `${product.nom}-${index}`;
  return (
    <article
      className={`kanari-product-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.65rem] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(6,26,58,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F2B632] hover:shadow-[0_18px_45px_rgba(6,26,58,0.13)] ${
        compact ? 'w-64 shrink-0 sm:w-72' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 65, 450)}ms` }}
      onClick={() => onOpen(product)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(product);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Voir les détails de ${product.nom || 'ce produit'}`}
    >
      <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-56">
        <ProductImage product={product} className="h-full w-full" />
        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#061A3A] shadow-sm">
          {product.categorie || 'Produit'}
        </div>
        <button
          type="button"
          aria-label={`Voir ${product.nom}`}
          onClick={event => {
            event.stopPropagation();
            onOpen(product);
          }}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#061A3A] shadow-lg transition hover:scale-110 hover:bg-[#F2B632]"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="line-clamp-1 text-lg font-extrabold text-[#061A3A]">
          {product.nom || 'Produit sans nom'}
        </h2>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prix</p>
            <p className="mt-0.5 text-base font-black text-[#123D72] sm:text-lg">
              {formatPrice(product.prix)}
            </p>
          </div>
          <button
            type="button"
            disabled={adding === String(id)}
            onClick={event => {
              event.stopPropagation();
              onAdd(product);
            }}
            className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F2B632] px-4 py-3 text-sm font-extrabold text-[#061A3A] shadow-md shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-[#E5A91F] active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            {adding === String(id) ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ShoppingCart size={18} />
            )}
            <span>{adding === String(id) ? 'Ajout…' : 'Ajouter'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function VoirProduits() {
  const navigate = useNavigate();
  const { ajouterAuPanier } = usePanier();
  const carouselRef = useRef(null);

  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [categorieActive, setCategorieActive] = useState('toutes');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingId, setAddingId] = useState('');
  const [notice, setNotice] = useState(null);

  const fetchProduits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/produits`);
      if (!response.ok) throw new Error("Impossible de charger le catalogue pour le moment.");
      const data = await response.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      setProduits(list);
    } catch (err) {
      console.error('Erreur chargement produits :', err);
      setError(err.message || 'Une erreur est survenue lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!selectedProduct) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  const categories = useMemo(() => {
    const set = new Set(produits.map(p => p.categorie).filter(Boolean));
    return ['toutes', ...Array.from(set)];
  }, [produits]);

  const produitsVedettes = useMemo(() => produits.slice(0, 8), [produits]);

  const produitsFiltres = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr');
    const filtered = produits.filter(product => {
      const matchCat = categorieActive === 'toutes' || product.categorie === categorieActive;
      const name = String(product.nom || '').toLocaleLowerCase('fr');
      const cat = String(product.categorie || '').toLocaleLowerCase('fr');
      const matchTerm = !term || name.includes(term) || cat.includes(term);
      return matchCat && matchTerm;
    });

    if (sort === 'price-asc') {
      filtered.sort((a, b) => Number(a.prix || 0) - Number(b.prix || 0));
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => Number(b.prix || 0) - Number(a.prix || 0));
    } else {
      filtered.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }
    return filtered;
  }, [produits, categorieActive, search, sort]);

  const handleAdd = product => {
    const id = String(product.id || product._id || product.nom);
    try {
      setAddingId(id);
      ajouterAuPanier(product);
      setNotice({ type: 'success', text: `${product.nom || 'Produit'} ajouté au panier.` });
    } catch (err) {
      console.error("Erreur ajout panier :", err);
      setNotice({ type: 'error', text: "Impossible d'ajouter ce produit au panier." });
    } finally {
      window.setTimeout(() => setAddingId(''), 450);
    }
  };

  const scrollCarousel = direction => {
    if (!carouselRef.current) return;
    const distance = direction === 'left' ? -340 : 340;
    carouselRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <main className="kanari-catalog min-h-screen bg-[#F4F6F9] pb-14 text-slate-800">
      <style>{`
        @keyframes kanariFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kanariFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes kanariShimmer {
          from { background-position: 150% 0; }
          to { background-position: -150% 0; }
        }
        .kanari-enter { animation: kanariFadeUp .55s cubic-bezier(.2,.75,.25,1) both; }
        .kanari-product-card { animation: kanariFadeUp .55s cubic-bezier(.2,.75,.25,1) both; }
        .kanari-float { animation: kanariFloat 5s ease-in-out infinite; }
        .kanari-skeleton {
          background: linear-gradient(100deg, #e8edf3 20%, #f8fafc 40%, #e8edf3 60%);
          background-size: 200% 100%;
          animation: kanariShimmer 1.35s linear infinite;
        }
        .kanari-hide-scrollbar::-webkit-scrollbar { display: none; }
        .kanari-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .kanari-enter, .kanari-product-card, .kanari-float, .kanari-skeleton { animation: none !important; }
          .kanari-catalog * { scroll-behavior: auto !important; transition-duration: .01ms !important; }
        }
      `}</style>

      {/* En-tête Hero Kanari */}
      <header className="relative overflow-hidden bg-[#061A3A] text-white">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[42px] border-white/[0.045]" />
        <div className="pointer-events-none absolute -bottom-28 right-[18%] h-64 w-64 rounded-full bg-[#F2B632]/[0.08] blur-2xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-9 pt-5 sm:px-6 sm:pb-14 sm:pt-7 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-8 inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-bold text-blue-100 transition hover:-translate-x-1 hover:border-[#F2B632]/60 hover:text-[#F2B632]"
          >
            <ArrowLeft size={18} /> Retour à l'accueil
          </button>

          <div className="kanari-enter grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F2B632]/30 bg-[#F2B632]/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2B632]">
                <Sparkles size={14} /> Boutique Kanari Service
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Tous nos produits <span className="text-[#F2B632]">à portée de clic.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
                Découvrez les articles disponibles chez nos partenaires à Niamey et ajoutez-les directement à votre panier.
              </p>
            </div>
            <div className="kanari-float hidden h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.07] text-[#F2B632] shadow-2xl shadow-black/10 md:flex lg:h-44 lg:w-44">
              <Package size={76} strokeWidth={1.25} />
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-[#F2B632] via-[#F2B632]/60 to-transparent" />
      </header>

      <div className="mx-auto -mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Barre de recherche, tri et catégories */}
        <section className="kanari-enter relative z-10 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_40px_rgba(6,26,58,0.09)] sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Rechercher un produit ou une catégorie..."
                aria-label="Rechercher un produit"
                className="min-h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-[#061A3A] outline-none transition placeholder:text-slate-400 focus:border-[#123D72] focus:bg-white focus:ring-4 focus:ring-[#123D72]/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="relative md:w-64">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#123D72]" size={18} />
              <select
                value={sort}
                onChange={event => setSort(event.target.value)}
                aria-label="Trier les produits"
                className="min-h-[50px] w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-bold text-[#061A3A] outline-none transition focus:border-[#123D72] focus:ring-4 focus:ring-[#123D72]/10"
              >
                <option value="recent">Trier : nouveautés</option>
                <option value="price-asc">Prix : moins cher</option>
                <option value="price-desc">Prix : plus cher</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" size={17} />
            </div>
          </div>

          {categories.length > 1 && (
            <div className="kanari-hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => {
                const active = categorieActive === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategorieActive(cat)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
                      active
                        ? 'bg-[#061A3A] text-[#F2B632] shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-[#EEF4FB] hover:text-[#061A3A]'
                    }`}
                  >
                    {cat === 'toutes' ? 'Toutes les catégories' : cat}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
            <span>
              {loading
                ? 'Chargement du catalogue…'
                : `${produitsFiltres.length} produit${produitsFiltres.length > 1 ? 's' : ''} trouvé${produitsFiltres.length > 1 ? 's' : ''}`}
            </span>
            {search && <span>Résultats pour « {search} »</span>}
          </div>
        </section>

        {/* Notification toast */}
        {notice && (
          <div
            role="status"
            aria-live="polite"
            className={`kanari-enter fixed right-4 top-20 z-[70] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl ${
              notice.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {notice.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Fermer le message">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Défilement horizontal (À la une) */}
        {!loading && !error && produitsVedettes.length > 0 && (
          <section className="pt-9">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF7E5] text-[#F2B632]">
                  <Flame size={18} />
                </span>
                <h2 className="text-lg font-black text-[#061A3A] sm:text-xl">À la une</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  aria-label="Défiler vers la gauche"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#061A3A] shadow-sm transition hover:border-[#F2B632] hover:bg-[#FFF7E5]"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  aria-label="Défiler vers la droite"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#061A3A] shadow-sm transition hover:border-[#F2B632] hover:bg-[#FFF7E5]"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="kanari-hide-scrollbar flex gap-4 overflow-x-auto pb-3"
            >
              {produitsVedettes.map((product, index) => (
                <ProductCard
                  key={`featured-${product.id || product._id || index}`}
                  product={product}
                  index={index}
                  onOpen={setSelectedProduct}
                  onAdd={handleAdd}
                  adding={addingId}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Grille principale des produits */}
        <section className="pt-8 sm:pt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.65rem] border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="kanari-skeleton h-48 rounded-2xl" />
                  <div className="kanari-skeleton mt-4 h-5 w-3/4 rounded-lg" />
                  <div className="mt-5 flex justify-between">
                    <div className="kanari-skeleton h-7 w-24 rounded-lg" />
                    <div className="kanari-skeleton h-10 w-28 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="kanari-enter mx-auto max-w-xl rounded-3xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={30} />
              </div>
              <h2 className="mt-5 text-xl font-black text-[#061A3A]">Chargement impossible</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{error}</p>
              <button
                type="button"
                onClick={fetchProduits}
                className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#123D72] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#061A3A]"
              >
                <RefreshCw size={17} /> Réessayer
              </button>
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div className="kanari-enter rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
              <Search className="mx-auto text-slate-300" size={38} />
              <h2 className="mt-4 text-lg font-black text-[#061A3A]">Aucun produit trouvé</h2>
              <p className="mt-2 text-sm text-slate-600">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategorieActive('toutes');
                }}
                className="mt-5 rounded-xl bg-[#123D72] px-5 py-3 text-sm font-bold text-white hover:bg-[#061A3A]"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produitsFiltres.map((product, index) => (
                <ProductCard
                  key={product.id || product._id || `${product.nom}-${index}`}
                  product={product}
                  index={index}
                  onOpen={setSelectedProduct}
                  onAdd={handleAdd}
                  adding={addingId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modale détail produit */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#061A3A]/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="kanari-enter relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fermer les détails"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#061A3A] shadow-lg transition hover:rotate-90 hover:bg-[#F2B632]"
            >
              <X size={20} />
            </button>
            <div className="h-64 overflow-hidden bg-slate-100 sm:h-80">
              <ProductImage product={selectedProduct} className="h-full w-full" />
            </div>
            <div className="p-5 sm:p-7">
              <span className="inline-flex rounded-full bg-[#FFF7E5] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#061A3A]">
                {selectedProduct.categorie || 'Détails du produit'}
              </span>
              <h2 id="product-modal-title" className="mt-3 text-2xl font-black text-[#061A3A]">
                {selectedProduct.nom || 'Produit'}
              </h2>
              {selectedProduct.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {selectedProduct.description}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Prix affiché</p>
                  <p className="mt-1 text-2xl font-black text-[#123D72]">{formatPrice(selectedProduct.prix)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleAdd(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#F2B632] px-6 py-4 text-sm font-black text-[#061A3A] shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-[#E5A91F] active:scale-95"
                >
                  <ShoppingCart size={19} /> Ajouter au panier
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}