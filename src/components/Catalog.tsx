import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Plus, Check, Info, AlertTriangle, Sparkles, X } from 'lucide-react';
import { Product, CategorySlug, Category } from '../types';

interface CatalogProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onSelectProductDetails: (product: Product) => void;
}

export default function Catalog({
  products,
  categories,
  onAddToCart,
  onSelectProductDetails
}: CatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'tous'>('tous');
  const [selectedBrand, setSelectedBrand] = useState<string | 'toutes'>('toutes');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'recent'>('default');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Extract unique brands for filtering
  const brands = ['toutes', ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))];

  // Helper to determine active promotional prices
  const getDisplayPrice = (p: Product) => (p.promoPrice ? p.promoPrice : p.price);

  // Filter & Sort Logic
  const filteredProducts = products.filter((p) => {
    const name = p.name || '';
    const brand = p.brand || '';
    const desc = p.description || '';
    const category = p.category || '';
    const categoryId = p.categoryId || '';

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
                           
    const matchesCategory = selectedCategory === 'tous' || 
                            category === selectedCategory ||
                            categoryId === selectedCategory ||
                            (selectedCategory === 'promotions' && p.promoPrice !== undefined);

    const matchesBrand = selectedBrand === 'toutes' || brand === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') {
      return getDisplayPrice(a) - getDisplayPrice(b);
    }
    if (sortBy === 'price-desc') {
      return getDisplayPrice(b) - getDisplayPrice(a);
    }
    if (sortBy === 'recent') {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
    return 0; // default order based on index
  });

  const handleAddToCartWithAnimation = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1200);
  };

  return (
    <div id="product-catalog-section" className="py-8 bg-zinc-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner principal promotionnel */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-rose-500 to-rose-700 p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-rose-400 opacity-20 -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-rose-400 opacity-10 -ml-5 -mb-5"></div>
          
          <div className="z-10 text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 text-white border border-white/30 rounded-full text-[10px] font-semibold tracking-wider font-mono">
              PROMOTION DE BIENVENUE
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight text-white leading-tight">
              -20% sur la gamme Beurre de Karité !
            </h3>
            <p className="text-rose-100 text-xs mt-1 md:max-w-md leading-relaxed">
              Dédié aux peaux desséchées et agressées par la pollution urbaine d'Abidjan. Offre valable jusqu'à la fin du mois.
            </p>
          </div>

          <button
            onClick={() => setSelectedCategory('promotions')}
            className="px-6 py-3.5 bg-white text-rose-950 font-bold text-xs rounded-xl hover:bg-rose-50 transition shadow-md whitespace-nowrap z-10 hover:-translate-y-0.5"
          >
            Découvrir les Offres
          </button>
        </div>

        {/* Filters and Search Container */}
        <div className="bg-white rounded-3xl p-6 shadow-md shadow-zinc-100 border border-rose-50/50 mb-8 space-y-6">
          
          {/* Main search and selectors on top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Box */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4.5 w-4.5 text-zinc-400" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par produit, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 focus:bg-white transition"
              />
            </div>

            {/* Brand Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Filter className="h-4 w-4" />
              </span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 appearance-none focus:outline-none focus:border-rose-300 focus:bg-white transition"
              >
                <option value="toutes">Toutes les marques</option>
                {brands.filter((b) => b !== 'toutes').map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <ArrowUpDown className="h-4 w-4" />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-9 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 appearance-none focus:outline-none focus:border-rose-300 focus:bg-white transition"
              >
                <option value="default">Tri par défaut</option>
                <option value="price-asc">Prix: Croissant</option>
                <option value="price-desc">Prix: Décroissant</option>
                <option value="recent">Nouveautés</option>
              </select>
            </div>

          </div>

          {/* Category Tabs list */}
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-3 block">
              Sélectionner une catégorie :
            </span>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('tous')}
                className={`px-4.5 py-2.5 rounded-full text-xs font-bold transition ${
                  selectedCategory === 'tous'
                    ? 'bg-rose-900 text-white shadow-sm'
                    : 'bg-zinc-50 border border-zinc-150 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                Tous les articles
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
                    selectedCategory === cat.slug
                      ? 'bg-rose-900 text-white shadow-sm font-semibold'
                      : 'bg-zinc-50 border border-zinc-150 text-zinc-700 hover:bg-rose-50/50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Results Counter */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs text-zinc-500 font-mono">
            {filteredProducts.length} {filteredProducts.length > 1 ? 'articles trouvés' : 'article trouvé'}
          </p>
          {(selectedCategory !== 'tous' || selectedBrand !== 'toutes' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('tous');
                setSelectedBrand('toutes');
                setSearchQuery('');
                setSortBy('default');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const hasPromo = product.promoPrice !== undefined;
              const lowStock = product.stock > 0 && product.stock <= 5;
              const isOutOfStock = product.stock === 0;

              return (
                <div 
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group h-full"
                >
                  {/* Thumbnail Cover image */}
                  <div className="relative h-56 bg-zinc-100 overflow-hidden shrink-0 select-none">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Floating Product Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      {hasPromo && (
                        <span className="px-2.5 py-1 bg-rose-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow">
                          PROMO
                        </span>
                      )}
                      {product.category === 'parapharmacie' && (
                        <span className="px-2.5 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider shadow">
                          Clinique
                        </span>
                      )}
                    </div>

                    {/* Stock Alert overlay */}
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center p-3 text-center">
                        <span className="px-3 py-1.5 bg-zinc-800 text-white font-extrabold text-[10px] rounded-lg shadow uppercase font-mono">
                          Rupture de Stock
                        </span>
                      </div>
                    ) : lowStock ? (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2 py-1 bg-amber-500 text-zinc-950 font-black text-[9px] rounded-md shadow uppercase flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 inline shrink-0" />
                          Reste {product.stock}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex flex-col grow">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase font-mono font-bold tracking-wider mb-2">
                        <span>{product.brand}</span>
                        <span className="text-zinc-500">{product.category.replace('-', ' ')}</span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-rose-950 font-sans tracking-tight leading-tight line-clamp-2 h-10 hover:text-rose-700 cursor-pointer" onClick={() => onSelectProductDetails(product)}>
                        {product.name}
                      </h4>
                      
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Pricing and Button Actions */}
                    <div className="mt-5 pt-4 border-t border-rose-50/50 flex items-center justify-between">
                      <div>
                        {hasPromo ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-400 line-through leading-none font-medium mb-1">
                              {product.price.toLocaleString()} F CFA
                            </span>
                            <span className="text-base font-extrabold text-rose-700 leading-none">
                              {product.promoPrice?.toLocaleString()} F CFA
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-extrabold text-rose-950">
                            {product.price.toLocaleString()} F CFA
                          </span>
                        )}
                      </div>

                      {/* Buy button */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onSelectProductDetails(product)}
                          className="p-2.5 rounded-xl border border-rose-100 hover:bg-rose-50/50 text-rose-950 transition"
                          title="Fiche technique"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleAddToCartWithAnimation(product)}
                          disabled={isOutOfStock}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1 border shadow-xs transition-all pointer-events-auto cursor-pointer ${
                            isOutOfStock
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                              : addedProductId === product.id
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-rose-950 border-rose-950 text-white hover:bg-rose-900 active:scale-95'
                          }`}
                        >
                          {addedProductId === product.id ? (
                            <>
                              <Check className="h-4 w-4 stroke-[3]" />
                              <span>Ajouté !</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Prendre</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8 shadow-sm flex flex-col items-center">
            <span className="text-4xl">🔎</span>
            <h4 className="text-lg font-bold text-rose-950 mt-4">Aucun cosmétique ne correspond</h4>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              Modifiez vos filtres de recherche ou la catégorie affichée pour explorer d'autres produits disponibles.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('tous');
                setSelectedBrand('toutes');
                setSearchQuery('');
              }}
              className="mt-5 px-4 py-2 text-xs font-bold text-white bg-rose-900 hover:bg-rose-950 rounded-xl shadow-sm transition"
            >
              Afficher tout le stock
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
