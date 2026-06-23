import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Sparkles, Heart, Plus, Check, ShoppingBag, Eye, ArrowRight } from 'lucide-react';
import { Product, Category } from '../types';

interface HomeProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onSelectProductDetails: (product: Product) => void;
  onSwitchTab: (tab: string, arg?: any) => void;
  currentSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
}

const CAROUSEL_SLIDES = [
  {
    id: 1,
    badge: "PROMO EXCLUSIVE",
    title: "Éclat Sublime & Hydratation",
    desc: "-20% sur toute notre sélection à base de Beurre de Karité naturel.",
    bg: "bg-gradient-to-r from-rose-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop",
    linkCategory: "cremes-soins"
  },
  {
    id: 2,
    badge: "OFFRE SPECIALE",
    title: "Sérums & Anti-Taches",
    desc: "Retrouvez un teint unifié, protégé du soleil chaud d'Abidjan.",
    bg: "bg-gradient-to-r from-rose-600 to-orange-550",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
    linkCategory: "soins-peau"
  },
  {
    id: 3,
    badge: "CONSEIL PHARMACIE",
    title: "Soin Capillaire Intense",
    desc: "Huiles et après-shampooings fortifiants pour stimuler la pousse.",
    bg: "bg-gradient-to-r from-pink-700 to-rose-500",
    image: "https://images.unsplash.com/photo-1527799863830-de7f4067c29d?q=80&w=600&auto=format&fit=crop",
    linkCategory: "produits-capillaires"
  }
];

export default function Home({
  products,
  categories,
  onAddToCart,
  onSelectProductDetails,
  onSwitchTab,
  currentSearchQuery,
  setGlobalSearchQuery
}: HomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCartWithNotify = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  // Extract popular products: either defined by sales or just select top 6 sorted by stock count / availability
  const popularProducts = products
    .filter(p => p.isAvailable && p.stock > 0)
    .slice(0, 6);

  // Extract new products: last added 6 items
  const newProducts = [...products]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 6);

  // Helper round category icons matching slugs
  const getCategoryIconEmoji = (slug: string) => {
    switch (slug) {
      case 'cremes-soins': return '🧴';
      case 'soins-peau': return '🌿';
      case 'pommades-traitements': return '🧪';
      case 'produits-capillaires': return '💇‍♀️';
      default: return '✨';
    }
  };

  return (
    <div id="home-view-container" className="pb-24 bg-white font-sans animate-fade-in animate-duration-300">
      
      {/* 🚀 BANNER HERO & PROMOTIONS SLIDER */}
      <div className="px-4 py-4 md:px-8 mt-1 max-w-7xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden shadow-sm border border-rose-50 h-[240px] sm:h-[300px]">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-between p-6 sm:p-12 text-white ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background Cover Overlay */}
              <div className={`absolute inset-0 ${slide.bg} opacity-95`}></div>
              
              {/* Overlay graphics */}
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xl"></div>
              
              {/* Slide Content */}
              <div className="relative z-10 max-w-md space-y-2 sm:space-y-4">
                <span className="px-3 py-1 bg-white/20 text-white border border-white/25 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  {slide.badge}
                </span>
                <h3 className="text-xl sm:text-3.5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">
                  {slide.title}
                </h3>
                <p className="text-rose-100 text-xs sm:text-sm font-medium leading-relaxed line-clamp-2">
                  {slide.desc}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onSwitchTab('categories', slide.linkCategory)}
                    className="px-5 py-2.5 bg-white text-rose-950 font-black text-xs rounded-xl shadow-md hover:bg-rose-50 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Profiter de l'offre</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Slide Image */}
              <div className="relative z-10 hidden md:block h-full w-1/3 p-4">
                <img
                  referrerPolicy="no-referrer"
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover rounded-2xl shadow-xl border border-white/20"
                />
              </div>
            </div>
          ))}

          {/* Dots Indicators */}
          <div className="absolute bottom-4 left-6 sm:left-12 z-20 flex gap-2">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-8 bg-white" : "w-2.5 bg-white/40"
                }`}
                aria-label={`Aller au slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>

      {/* 🌸 SECTION 2: RECHERCHE RAPIDE */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </span>
          <input
            type="text"
            placeholder="🔎 Rechercher un soin, crème, traitement, marque..."
            value={currentSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              if (e.target.value.trim() !== '') {
                onSwitchTab('categories');
              }
            }}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 🌸 SECTION 3: CATÉGORIES RAPIDES */}
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Sélections beauté rapides
          </h4>
          <button 
            onClick={() => onSwitchTab('categories')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            Voir tout <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-6 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSwitchTab('categories', cat.slug)}
              className="flex flex-col items-center p-3 bg-zinc-50 hover:bg-rose-50/40 rounded-2xl border border-zinc-100 hover:border-rose-150 transition group cursor-pointer text-center"
            >
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white flex items-center justify-center text-xl sm:text-2.5xl shadow-xs border border-zinc-100 group-hover:scale-105 transition-all">
                {getCategoryIconEmoji(cat.slug)}
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-800 group-hover:text-rose-600 mt-2.5 truncate max-w-full">
                {cat.name.split(' ')[0]} {cat.name.split(' ')[1] || ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 🔮 DIAGNOSTIC IA INTÉGRÉ BANNER */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-pink-900 text-white p-6 sm:p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="space-y-3 relative z-10 text-center md:text-left">
            <span className="px-3 py-1 bg-white/10 text-rose-100 border border-white/20 rounded-full text-[10px] font-bold tracking-widest uppercase inline-block font-mono">
              ★ Conseil Privé d'Omi'i Institut
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight font-sans">
              Diagnostic de Peau & Capillaire Intelligent
            </h3>
            <p className="text-rose-100/80 text-xs max-w-lg leading-relaxed font-normal">
              Quel climat faites-vous subir à votre peau ? Répondez à notre questionnaire et recevez instantanément votre routine beauté sur-mesure validée par nos pharmaciens-conseils.
            </p>
          </div>
          <div className="shrink-0 relative z-10 w-full md:w-auto">
            <button
              onClick={() => onSwitchTab('diagnostic')}
              className="w-full md:w-auto px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Démarrer mon diagnostic gratuit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 📦 SECTION 4: LES NOUVEAUTÉS (Scroll horizontal) */}
      {newProducts.length > 0 && (
        <div className="px-4 py-6 max-w-7xl mx-auto space-y-4 bg-rose-50/15 rounded-[2rem] my-4 border border-rose-50/40">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-rose-550 rounded-full"></span>
              ✨ Nouveaux Produits
            </h4>
            <span className="text-[10px] uppercase font-mono font-bold text-rose-500 bg-rose-50/80 px-2 py-0.5 rounded-md">
              Arrivages
            </span>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-4 px-2 scrollbar-none snap-x">
            {newProducts.map((p) => {
              const displayPrice = p.promoPrice || p.price;
              return (
                <div
                  key={p.id}
                  className="w-48 bg-white rounded-2xl border border-rose-100/50 p-3 shadow-xs shrink-0 snap-start hover:shadow-md transition flex flex-col justify-between"
                >
                  <div 
                    onClick={() => onSelectProductDetails(p)}
                    className="relative h-32 bg-zinc-50 rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-350"
                    />
                    {p.promoPrice && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-md uppercase">
                        -20%
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">
                      {p.brand}
                    </span>
                    <h5 
                      onClick={() => onSelectProductDetails(p)}
                      className="text-xs font-bold text-zinc-900 line-clamp-1 hover:text-rose-600 transition cursor-pointer"
                    >
                      {p.name}
                    </h5>
                    
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-rose-950">
                          {displayPrice.toLocaleString()} F
                        </span>
                        {p.promoPrice && (
                          <span className="text-[9px] text-zinc-400 line-through">
                            {p.price.toLocaleString()} F
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCartWithNotify(p)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition active:scale-90 cursor-pointer"
                        title="Ajouter au panier"
                      >
                        {addedProductId === p.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📦 SECTION 5: GRID DES PRODUITS POPULAIRES (2 Colonnes) */}
      <div className="px-4 py-8 max-w-7xl mx-auto space-y-6">
        <h4 className="text-sm font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-rose-600 rounded-full"></span>
          🔥 Produits populaires en Côte d’Ivoire
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {popularProducts.map((p) => {
            const displayPrice = p.promoPrice || p.price;
            const hasPromo = p.promoPrice !== undefined;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-zinc-150 p-3 h-full flex flex-col justify-between hover:shadow-md hover:border-rose-200 transition-all group"
              >
                {/* Image layout */}
                <div className="relative">
                  <div 
                    onClick={() => onSelectProductDetails(p)}
                    className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-50 cursor-pointer"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-350"
                    />
                  </div>
                  {hasPromo && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase tracking-wider">
                      Promo
                    </span>
                  )}
                  {p.stock <= 5 && p.stock > 0 && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded-lg uppercase tracking-wider">
                      Reste {p.stock}
                    </span>
                  )}
                </div>

                {/* Info layout */}
                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-zinc-400 block font-mono">
                      {p.brand}
                    </span>
                    <h5
                      onClick={() => onSelectProductDetails(p)}
                      className="text-xs font-bold text-zinc-900 group-hover:text-rose-600 transition line-clamp-2 cursor-pointer h-8"
                    >
                      {p.name}
                    </h5>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-black text-rose-950">
                        {displayPrice.toLocaleString()} FCFA
                      </span>
                      {hasPromo && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          {p.price.toLocaleString()} F
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCartWithNotify(p)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-500 font-bold text-[10px] text-rose-600 hover:text-white rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      {addedProductId === p.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Pris</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          <span>Prendre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
