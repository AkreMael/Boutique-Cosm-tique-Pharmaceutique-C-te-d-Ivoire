import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowUpDown, Search, Grid, ListCheck, Plus, Check, ShieldAlert } from 'lucide-react';
import { Product, Category, CategorySlug } from '../types';

interface CategoriesGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (productId: string) => void;
  cart?: any[];
  onSelectProductDetails: (product: Product) => void;
  preselectedCategorySlug: CategorySlug | 'tous';
  setPreselectedCategorySlug: (slug: CategorySlug | 'tous') => void;
}

// Visual covers or icon representations matching each category slug
const CATEGORY_VISUALS: Record<string, { image: string; emoji: string }> = {
  'cremes-soins': {
    image: "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=400&auto=format&fit=crop",
    emoji: "🧴"
  },
  'soins-peau': {
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400&auto=format&fit=crop",
    emoji: "🌿"
  },
  'pommades-traitements': {
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop",
    emoji: "🧪"
  },
  'produits-capillaires': {
    image: "https://images.unsplash.com/photo-1527799863830-de7f4067c29d?q=80&w=400&auto=format&fit=crop",
    emoji: "💇‍♀️"
  }
};

export default function CategoriesGrid({
  products,
  categories,
  onAddToCart,
  onRemoveFromCart,
  cart,
  onSelectProductDetails,
  preselectedCategorySlug,
  setPreselectedCategorySlug
}: CategoriesGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategorySlug | 'tous'>(preselectedCategorySlug);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | 'all'>('all');

  // Sync state if preselected slug shifts from outside search or quick buttons
  useEffect(() => {
    setActiveCategory(preselectedCategorySlug);
    setSelectedSubCategorySlug('all');
  }, [preselectedCategorySlug]);

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

  const getProductCount = (categorySlug: string) => {
    return products.filter((p) => {
      const isDirectMatch = p.category === categorySlug || p.categoryId === categorySlug;
      if (isDirectMatch) return true;
      const prodCatObj = categories.find((c) => c.slug === p.category || c.slug === p.categoryId);
      if (prodCatObj && prodCatObj.parentSlug === categorySlug) return true;
      return false;
    }).length;
  };

  // Filter products by selected category + search query + sort rules
  const filteredProducts = products.filter((p) => {
    let matchesCategory = false;
    if (activeCategory === 'tous') {
      matchesCategory = true;
    } else {
      if (selectedSubCategorySlug === 'all') {
        const isDirectMatch = p.category === activeCategory || p.categoryId === activeCategory;
        const prodCatObj = categories.find((c) => c.slug === p.category || c.slug === p.categoryId);
        const isSubMatch = prodCatObj && prodCatObj.parentSlug === activeCategory;
        matchesCategory = isDirectMatch || !!isSubMatch;
      } else {
        matchesCategory = p.category === selectedSubCategorySlug || p.categoryId === selectedSubCategorySlug;
      }
    }
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (sortBy === 'price-asc') {
    filteredProducts.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
  } else if (sortBy === 'price-desc') {
    filteredProducts.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
  }

  return (
    <div className="pb-24 bg-white font-sans animate-fade-in animate-duration-300">
      
      {/* HEADER BAR */}
      <div className="bg-rose-50/15 py-6 border-b border-rose-50 px-4 md:px-8 max-w-7xl mx-auto">
        {activeCategory !== 'tous' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveCategory('tous');
                setPreselectedCategorySlug('tous');
              }}
              className="p-2 bg-white border border-rose-100 hover:bg-rose-50/30 rounded-xl text-zinc-700 transition cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] text-rose-500 font-extrabold font-mono tracking-widest uppercase block">
                Rayon Beauté
              </span>
              <h2 className="text-lg font-black text-rose-950 font-sans leading-none mt-0.5">
                {categories.find((c) => c.slug === activeCategory)?.name || "Sélection"}
              </h2>
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-rose-500 font-extrabold font-mono tracking-widest uppercase block">
              Marques & Savoir-faire
            </span>
            <h2 className="text-xl font-black text-rose-950 font-sans leading-none mt-1">
              Catégories de Soins
            </h2>
          </div>
        )}
      </div>

      {/* 📁 VIEW 1: CATEGORY GRID (Visible when activeCategory is 'tous') */}
      {activeCategory === 'tous' ? (
        <div className="px-4 py-8 max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.filter(c => !c.parentSlug && c.slug !== 'tous').map((cat) => {
              const count = getProductCount(cat.slug);
              const customCover = cat.imageUrl || cat.image || CATEGORY_VISUALS[cat.slug]?.image || "https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=400&auto=format&fit=crop";
              const emoji = CATEGORY_VISUALS[cat.slug]?.emoji || "🎀";

              return (
                <div
                  key={cat.slug}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    setPreselectedCategorySlug(cat.slug);
                  }}
                  className="bg-white rounded-3xl border border-zinc-150 overflow-hidden shadow-xs hover:shadow-md hover:border-rose-200 transition-all duration-350 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-zinc-50 overflow-hidden">
                    <img
                      referrerPolicy="no-referrer"
                      src={customCover}
                      alt={cat.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {/* Abstract modern visual blend */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent"></div>
                    
                    <span className="absolute top-4 left-4 h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl shadow border border-white/25">
                      {emoji}
                    </span>

                    <span className="absolute bottom-4 right-4 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                      {count} {count > 1 ? 'Produits' : 'Produit'}
                    </span>
                  </div>

                  <div className="p-5 space-y-1">
                    <h4 className="text-sm font-black text-rose-950 text-left group-hover:text-rose-500 transition font-sans">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-zinc-500 text-left leading-normal font-normal line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick shop products directly underneath */}
          <div className="pt-8 border-t border-zinc-100">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">
              Tous nos articles disponibles
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {products.map((p) => {
                const isPromo = p.promoPrice !== undefined;
                return (
                  <div 
                    key={p.id}
                    className="bg-white rounded-2xl border border-zinc-150 p-2 flex flex-col justify-between h-full hover:border-rose-250 transition-colors"
                  >
                    <div 
                      onClick={() => onSelectProductDetails(p)}
                      className="relative rounded-xl overflow-hidden aspect-square cursor-pointer bg-zinc-50"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={p.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    <div className="mt-2.5 p-1 flex-1 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 block font-mono">
                          {p.brand}
                        </span>
                        <h5 
                          onClick={() => onSelectProductDetails(p)}
                          className="text-xs font-bold text-zinc-800 line-clamp-1 hover:text-rose-600 transition cursor-pointer"
                        >
                          {p.name}
                        </h5>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xs font-black text-rose-900">
                          {(p.promoPrice || p.price).toLocaleString()} F
                        </span>
                        <button
                          onClick={() => handleToggleCartItem(p)}
                          className={`p-1.5 rounded-lg transition active:scale-90 cursor-pointer ${
                            cart && cart.some((item: any) => item.product.id === p.id)
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                          }`}
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
        </div>
      ) : (
        /* 📦 VIEW 2: PRODUCT LIST UNDER SELECTED CATEGORY */
        <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-150 shadow-xs">
            {/* Search filter */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </span>
              <input
                type="text"
                placeholder="Filtrer dans ce rayon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl bg-white text-xs focus:outline-none focus:border-rose-300 focus:bg-white"
              />
            </div>

            {/* Sort direction */}
            <div className="relative flex-shrink-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <ArrowUpDown className="h-3.5 w-3.5" />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-8.5 pr-3 py-2 border border-zinc-200 rounded-xl bg-white text-xs font-semibold text-zinc-700 selection:bg-rose-50 cursor-pointer appearance-none focus:outline-none"
              >
                <option value="default">Par défaut</option>
                <option value="price-asc">Prix: Croissant</option>
                <option value="price-desc">Prix: Décroissant</option>
              </select>
            </div>
          </div>

          {/* Sub-categories Chips */}
          {categories.filter(c => c.parentSlug === activeCategory).length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 select-none mr-2">Rayons :</span>
              <button
                onClick={() => setSelectedSubCategorySlug('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${
                  selectedSubCategorySlug === 'all'
                    ? 'bg-rose-950 border-rose-950 text-white shadow-xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                Tout afficher
              </button>
              {categories.filter(c => c.parentSlug === activeCategory).map((sub) => {
                const subCount = products.filter((p) => p.category === sub.slug || p.categoryId === sub.slug).length;
                return (
                  <button
                    key={sub.slug}
                    onClick={() => setSelectedSubCategorySlug(sub.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${
                      selectedSubCategorySlug === sub.slug
                        ? 'bg-rose-950 border-rose-950 text-white shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    {sub.name} <span className="opacity-60 text-[10px] ml-0.5">({subCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Results feedback */}
          <div className="text-xs text-zinc-500 font-mono flex justify-between items-center px-1">
            <span>{filteredProducts.length} articles disponibles</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-rose-500 font-bold"
              >
                Effacer la recherche
              </button>
            )}
          </div>

          {/* Grid render */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const actualPrice = p.promoPrice || p.price;
                const hasPromo = p.promoPrice !== undefined;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-zinc-150 p-3 h-full flex flex-col justify-between hover:shadow-md hover:border-rose-250 transition-all duration-300 group"
                  >
                    <div className="relative">
                      <div 
                        onClick={() => onSelectProductDetails(p)}
                        className="relative aspect-square rounded-xl overflow-hidden bg-zinc-50 cursor-pointer"
                      >
                        <img
                          referrerPolicy="no-referrer"
                          src={p.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition font-sans"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                          }}
                        />
                      </div>
                      {hasPromo && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-lg uppercase tracking-wider">
                          Promo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 font-mono uppercase block">
                          {p.brand}
                        </span>
                        <h5
                          onClick={() => onSelectProductDetails(p)}
                          className="text-xs font-bold text-zinc-800 hover:text-rose-500 transition line-clamp-2 leading-tight cursor-pointer h-8"
                        >
                          {p.name}
                        </h5>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-rose-950 block">
                            {actualPrice.toLocaleString()} F
                          </span>
                          {hasPromo && (
                            <span className="text-[9px] text-zinc-400 line-through">
                              {p.price.toLocaleString()} F
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleCartItem(p)}
                          className={`p-1.5 rounded-lg transition-all active:scale-90 shadow-xs cursor-pointer ${
                            cart && cart.some((item: any) => item.product.id === p.id)
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white'
                          }`}
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
          ) : (
            <div className="text-center py-16 bg-zinc-50 rounded-3xl border border-zinc-150 p-6 space-y-3">
              <span className="text-3xl">🧩</span>
              <div>
                <h5 className="text-xs font-bold text-rose-950">Aucun produit trouvé</h5>
                <p className="text-[10px] text-zinc-405 leading-normal max-w-xs mx-auto mt-1">
                  Essayez de reformuler vos mots-clés ou de parcourir une autre catégorie de produits de beauté.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
