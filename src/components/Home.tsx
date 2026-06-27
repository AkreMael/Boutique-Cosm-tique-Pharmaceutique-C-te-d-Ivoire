import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Sparkles, Heart, Plus, Check, ShoppingBag, Eye, ArrowRight, X, Send } from 'lucide-react';
import { Product, Category } from '../types';

interface HomeProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (productId: string) => void;
  cart?: any[];
  onSelectProductDetails: (product: Product) => void;
  onSwitchTab: (tab: string, arg?: any) => void;
  currentSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  currentUser?: any;
  onShowLogin?: () => void;
  onSendMessage?: (text: string) => Promise<void>;
}

const CAROUSEL_SLIDES = [
  {
    id: 1,
    badge: "PROMO EXCLUSIVE",
    title: "Éclat Sublime & Hydratation",
    desc: "-20% sur toute notre sélection à base de Beurre de Karité naturel.",
    bg: "bg-gradient-to-r from-rose-500 to-pink-600",
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/28232fd8-ce18-4f8a-bb58-4e684a6feb11.png",
    linkCategory: "cremes-soins"
  },
  {
    id: 2,
    badge: "OFFRE SPECIALE",
    title: "Sérums & Anti-Taches",
    desc: "Retrouvez un teint unifié, protégé du soleil chaud d'Abidjan.",
    bg: "bg-gradient-to-r from-rose-600 to-orange-500",
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3540b95e-f688-465f-b906-4f08f68cf1c6.png",
    linkCategory: "soins-peau"
  },
  {
    id: 3,
    badge: "CONSEIL PHARMACIE",
    title: "Soin Capillaire Intense",
    desc: "Huiles et après-shampooings fortifiants pour stimuler la pousse.",
    bg: "bg-gradient-to-r from-pink-700 to-rose-500",
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/c3ee43ce-e9e1-4145-ad98-bfa89b782426.png",
    linkCategory: "produits-capillaires"
  }
];

const OFFER_DETAILS: Record<number, {
  image: string;
  title: string;
  badge: string;
  description: string;
  blocks: { title: string; desc: string; icon: string }[];
}> = {
  1: {
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/28232fd8-ce18-4f8a-bb58-4e684a6feb11.png",
    title: "Éclat Sublime & Hydratation",
    badge: "PROMO EXCLUSIVE",
    description: "-20% sur toute notre sélection à base de Beurre de Karité naturel.",
    blocks: [
      {
        title: "Ingrédients Bio & Naturels",
        desc: "Notre formule intègre du beurre de karité 100% biologique extrait traditionnellement en Côte d'Ivoire.",
        icon: "🌿"
      },
      {
        title: "Hydratation Intense 24h",
        desc: "Pénètre en profondeur pour restaurer l'élasticité de votre peau et prévenir le dessèchement cutané.",
        icon: "💧"
      },
      {
        title: "Teint Éclatant & Unifié",
        desc: "Riche en vitamines A, D, E et F pour réparer, adoucir et donner un coup d'éclat immédiat et durable.",
        icon: "✨"
      }
    ]
  },
  2: {
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/3540b95e-f688-465f-b906-4f08f68cf1c6.png",
    title: "Sérums & Anti-Taches",
    badge: "OFFRE SPECIALE",
    description: "Retrouvez un teint unifié, protégé du soleil chaud d'Abidjan.",
    blocks: [
      {
        title: "Action Anti-Taches Ciblée",
        desc: "Estompe visiblement les taches pigmentaires, les cicatrices d'acné et l'hyperpigmentation en 4 semaines.",
        icon: "🎯"
      },
      {
        title: "Bouclier Solaire Actif",
        desc: "Protège efficacement l'épiderme contre les agressions thermiques et les effets nocifs des UV d'Abidjan.",
        icon: "☀️"
      },
      {
        title: "Texture Ultra Légère",
        desc: "Formule non grasse qui pénètre instantanément, parfaite pour une application sous le maquillage.",
        icon: "⚡"
      }
    ]
  },
  3: {
    image: "https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/c3ee43ce-e9e1-4145-ad98-bfa89b782426.png",
    title: "Soin Capillaire Intense",
    badge: "CONSEIL PHARMACIE",
    description: "Huiles et après-shampooings fortifiants pour stimuler la pousse.",
    blocks: [
      {
        title: "Pousse & Densité Cheveux",
        desc: "Active la micro-circulation du cuir chevelu pour réveiller les bulbes capillaires et accélérer la pousse.",
        icon: "🌱"
      },
      {
        title: "Anti-Casse & Réparation",
        desc: "Gaine la fibre capillaire de la racine aux pointes pour renforcer la structure et stopper la casse.",
        icon: "💪"
      },
      {
        title: "Soin d'Origine Naturelle",
        desc: "Huiles essentielles pures de ricin, d'argan et de romarin sélectionnées par nos pharmaciens experts.",
        icon: "🧴"
      }
    ]
  }
};

export default function Home({
  products,
  categories,
  onAddToCart,
  onRemoveFromCart,
  cart,
  onSelectProductDetails,
  onSwitchTab,
  currentSearchQuery,
  setGlobalSearchQuery,
  currentUser,
  onShowLogin,
  onSendMessage
}: HomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  
  // States for detailed offer view & interactive request form
  const [selectedOffer, setSelectedOffer] = useState<typeof CAROUSEL_SLIDES[number] | null>(null);
  const [showDemandForm, setShowDemandForm] = useState(false);
  const [demandSubject, setDemandSubject] = useState('');
  const [demandCategory, setDemandCategory] = useState('problème de peau / du corps');
  const [demandDescription, setDemandDescription] = useState('');
  const [isSubmittingDemand, setIsSubmittingDemand] = useState(false);
  const [demandSuccessMessage, setDemandSuccessMessage] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleCartItem = (product: Product) => {
    const isInCart = cart ? cart.some((item: any) => item.product.id === product.id) : false;
    if (isInCart) {
      if (onRemoveFromCart) {
        onRemoveFromCart(product.id);
      }
    } else {
      onAddToCart(product);
    }
  };

  const handleAddToCartWithNotify = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const handleSubmitDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandSubject.trim() || !demandDescription.trim()) return;

    if (!currentUser) {
      if (onShowLogin) {
        onShowLogin();
      }
      return;
    }

    setIsSubmittingDemand(true);
    setDemandSuccessMessage('');

    try {
      const formattedText = `🚨 *NOUVELLE DEMANDE DE CONSEIL DEPUIS L'OFFRE* 🚨\n\n` +
        `• *Offre concernée :* ${selectedOffer?.title || 'Offre Spéciale'}\n` +
        `• *Sujet/Besoin :* ${demandSubject.trim()}\n` +
        `• *Catégorie de besoin :* ${demandCategory}\n` +
        `• *Description :* ${demandDescription.trim()}`;

      if (onSendMessage) {
        await onSendMessage(formattedText);
        setDemandSuccessMessage('Votre demande a été envoyée avec succès à notre équipe ! Elle est désormais visible dans votre messagerie.');
        
        // Reset form inputs
        setDemandSubject('');
        setDemandDescription('');
        setTimeout(() => {
          setDemandSuccessMessage('');
          setShowDemandForm(false);
          onSwitchTab('chat');
          setSelectedOffer(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error sending demand message:", error);
    } finally {
      setIsSubmittingDemand(false);
    }
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
  const getCategoryFallbackImage = (slug: string) => {
    switch (slug) {
      case 'produits-cosmetiques':
        return "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=400&auto=format&fit=crop";
      case 'produits-pharmaceutiques-sante':
        return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop";
      case 'soins-capillaires':
        return "https://images.unsplash.com/photo-1527799863830-de7f4067c29d?q=80&w=400&auto=format&fit=crop";
      case 'hygiene-beaute':
        return "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop";
      case 'produits-pour-bebe':
        return "https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=400&auto=format&fit=crop";
      case 'produits-alimentaires-consommation':
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
      case 'produits-naturels-bio':
        return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop";
      case 'materiel-accessoires':
        return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop";
      default:
        return "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=400&auto=format&fit=crop";
    }
  };

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
    <div id="home-view-container" className="pb-24 bg-transparent font-sans animate-fade-in animate-duration-300">
      
      {/* 🚀 BANNER HERO & PROMOTIONS SLIDER */}
      <div className="px-4 py-4 md:px-8 mt-1 max-w-5xl mx-auto">
        <div className="relative rounded-[2rem] overflow-hidden shadow-sm border border-rose-50 h-[260px] sm:h-[320px]">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-between p-6 sm:p-10 text-white ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background Cover Overlay */}
              <div className={`absolute inset-0 ${slide.bg} opacity-95`}></div>
              
              {/* Overlay graphics */}
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-xl"></div>
              
              {/* Slide Content Layout: Image on Left, Text Below It */}
              <div className="relative z-10 flex items-center justify-between w-full h-full gap-4">
                
                {/* Left Block: Contains the Image, and right below it the description text */}
                <div 
                  onClick={() => {
                    setSelectedOffer(slide);
                    setShowDemandForm(false);
                  }}
                  className="flex flex-col items-start justify-center h-full space-y-3.5 cursor-pointer group/slide select-none"
                >
                  
                  {/* Slide Image - Positioned on the left of the card, slightly integrated into the background color */}
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-white/25 h-[100px] w-[150px] sm:h-[120px] sm:w-[190px] shrink-0 bg-rose-950/20 backdrop-blur-xs">
                    <img
                      referrerPolicy="no-referrer"
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/slide:scale-105"
                    />
                    {/* Overlay to subtly blend image into the background color */}
                    <div className="absolute inset-0 bg-rose-950/15 mix-blend-multiply pointer-events-none"></div>
                  </div>

                  {/* Descriptive Text - Placed directly below the image */}
                  <div className="space-y-1 max-w-xs sm:max-w-md">
                    <span className="inline-block px-2.5 py-0.5 bg-white/25 text-white border border-white/20 rounded-full text-[8px] sm:text-[9px] font-extrabold tracking-widest uppercase">
                      {slide.badge}
                    </span>
                    <h3 className="text-sm sm:text-xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xs group-hover/slide:text-rose-100 transition-colors">
                      {slide.title}
                    </h3>
                    <p className="text-rose-100 text-[10px] sm:text-xs font-medium leading-relaxed line-clamp-1 sm:line-clamp-2">
                      {slide.desc}
                    </p>
                  </div>
                </div>

                {/* Right Block: Action Button */}
                <div className="shrink-0 self-center sm:self-end sm:mb-2">
                  <button
                    onClick={() => {
                      setSelectedOffer(slide);
                      setShowDemandForm(false);
                    }}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-rose-950 font-black text-[9px] sm:text-xs rounded-xl shadow-md hover:bg-rose-50 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Profiter de l'offre</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Dots Indicators */}
          <div className="absolute bottom-4 left-6 sm:left-10 z-20 flex gap-2">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-white" : "w-2 bg-white/40"
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
            Catégories disponibles
          </h4>
          <button 
            onClick={() => onSwitchTab('categories')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            Voir tout <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-6 overflow-x-auto pb-1">
          {categories.filter(c => !c.parentSlug && c.slug !== 'tous').map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSwitchTab('categories', cat.slug)}
              className="flex flex-col items-center p-2 sm:p-3 bg-zinc-50 hover:bg-rose-50/40 rounded-2xl border border-zinc-100 hover:border-rose-150 transition group cursor-pointer text-center"
            >
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-xs border border-zinc-100 group-hover:scale-105 transition-all">
                <img
                  referrerPolicy="no-referrer"
                  src={cat.imageUrl || cat.image || getCategoryFallbackImage(cat.slug)}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-800 group-hover:text-rose-600 mt-2 leading-tight text-center break-words w-full">
                {cat.name}
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
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-350"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                      }}
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
                        onClick={() => handleToggleCartItem(p)}
                        className={`p-1.5 rounded-lg transition active:scale-90 cursor-pointer ${
                          cart && cart.some((item: any) => item.product.id === p.id)
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        }`}
                        title={cart && cart.some((item: any) => item.product.id === p.id) ? "Retirer du panier" : "Ajouter au panier"}
                      >
                        {cart && cart.some((item: any) => item.product.id === p.id) ? (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
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
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-350"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                      }}
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
                      onClick={() => handleToggleCartItem(p)}
                      className={`px-3 py-2 font-bold text-[10px] rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs ${
                        cart && cart.some((item: any) => item.product.id === p.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white'
                      }`}
                    >
                      {cart && cart.some((item: any) => item.product.id === p.id) ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3]" />
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

      {/* 🌟 DETAILED OFFER MODAL WITH INTERACTIVE REQUEST FORM & HORIZONTAL SLIDER */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-rose-50 flex flex-col my-auto max-h-[90vh]">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedOffer(null);
                setShowDemandForm(false);
                setDemandSuccessMessage('');
              }}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-md rounded-full p-2 text-zinc-700 hover:bg-white hover:text-rose-950 transition shadow-md z-10 cursor-pointer"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Offer Cover Image */}
            <div className="relative h-44 sm:h-52 w-full bg-rose-950 shrink-0">
              <img
                referrerPolicy="no-referrer"
                src={selectedOffer.image}
                alt={selectedOffer.title}
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                <span className="inline-block px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-extrabold tracking-widest uppercase mb-1.5 shadow-sm">
                  {selectedOffer.badge}
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-zinc-950 leading-tight">
                  {selectedOffer.title}
                </h3>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!showDemandForm ? (
                <>
                  {/* Step 1: Offer Details & 3 horizontal slider blocks */}
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {selectedOffer.desc} Profitez de conseils d'experts pharmaciens et d'un accompagnement personnalisé pour sublimer votre éclat naturel.
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                          Avantages de l'offre (Glisser) :
                        </span>
                        <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                          ← Glisser de gauche à droite →
                        </span>
                      </div>

                      {/* 3 Blocks Horizontal Scroll Slider */}
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none scroll-smooth">
                        {(OFFER_DETAILS[selectedOffer.id]?.blocks || []).map((b, i) => (
                          <div 
                            key={i} 
                            className="min-w-[80%] sm:min-w-[240px] snap-center bg-zinc-50 border border-zinc-150/60 rounded-2xl p-4 flex flex-col justify-between shrink-0 hover:border-rose-150 transition shadow-xs"
                          >
                            <div className="text-2xl mb-2">{b.icon}</div>
                            <div>
                              <h4 className="font-extrabold text-zinc-900 text-xs sm:text-sm leading-snug">
                                {b.title}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 leading-relaxed">
                                {b.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-zinc-100 grid grid-cols-2 gap-3 shrink-0">
                    <button
                      onClick={() => {
                        onSwitchTab('offers');
                        setSelectedOffer(null);
                      }}
                      className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-xl transition cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Découvrir l'offre</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDemandForm(true);
                      }}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-98"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Soumettre demande</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Interactive request form */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider">
                        Votre demande personnalisée
                      </h4>
                      <button
                        onClick={() => setShowDemandForm(false)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Retour aux détails
                      </button>
                    </div>

                    {demandSuccessMessage ? (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-2 py-6">
                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
                          ✓
                        </div>
                        <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                          {demandSuccessMessage}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitDemand} className="space-y-4">
                        {!currentUser ? (
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-2">
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                              Vous devez être connecté pour soumettre votre demande et échanger avec nos pharmaciens.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (onShowLogin) onShowLogin();
                                setSelectedOffer(null);
                                setShowDemandForm(false);
                              }}
                              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
                            >
                              Se connecter / S'inscrire
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <label className="block text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">
                                Sujet / Nom du besoin
                              </label>
                              <input
                                type="text"
                                required
                                value={demandSubject}
                                onChange={(e) => setDemandSubject(e.target.value)}
                                placeholder="ex: Problème d'acné ou conseils cheveux"
                                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-hidden font-medium"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">
                                Catégorie du besoin
                              </label>
                              <select
                                value={demandCategory}
                                onChange={(e) => setDemandCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-hidden bg-white font-medium"
                              >
                                <option value="problème de cheveux">Problème de cheveux</option>
                                <option value="problème de peau / du corps">Problème de peau / du corps</option>
                                <option value="besoin de conseil">Besoin de conseil</option>
                                <option value="recherche d’un produit précis">Recherche d’un produit précis</option>
                                <option value="autre préoccupation">Autre préoccupation</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">
                                Description de la demande
                              </label>
                              <textarea
                                required
                                rows={4}
                                value={demandDescription}
                                onChange={(e) => setDemandDescription(e.target.value)}
                                placeholder="Décrivez votre préoccupation ou votre type de peau/cheveux pour que notre équipe puisse vous répondre précisément..."
                                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-hidden font-medium resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingDemand}
                              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Send className="h-4 w-4" />
                              <span>{isSubmittingDemand ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
                            </button>
                          </>
                        )}
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
