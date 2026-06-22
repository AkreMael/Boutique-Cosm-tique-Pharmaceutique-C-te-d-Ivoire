import React, { useState } from 'react';
import { Sparkles, Check, ShoppingCart, Percent, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface OffersScreenProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProductDetails: (product: Product) => void;
  onSwitchTab: (tab: string) => void;
}

export default function OffersScreen({
  products,
  onAddToCart,
  onSelectProductDetails,
  onSwitchTab
}: OffersScreenProps) {
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Filter products that have promotions active (has promoPrice)
  const promoProducts = products.filter((p) => p.promoPrice !== undefined && p.isAvailable);

  const handleBuyNow = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
      onSwitchTab('cart'); // Go straight to Cart / Panier for fluid Jumia checkout
    }, 450);
  };

  // Helper calculation to show percentage discount elegantly
  const getDiscountPercentage = (original: number, promo: number) => {
    if (!original || !promo) return 20;
    const pct = Math.round(((original - promo) / original) * 100);
    return pct > 0 ? pct : 20;
  };

  return (
    <div id="offers-view-page" className="min-h-screen pb-24 bg-gradient-to-tr from-white via-rose-50/15 to-rose-50/35 font-sans animate-fade-in animate-duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-rose-50/20 py-8 border-b border-rose-100/50 px-4 md:px-8 max-w-7xl mx-auto text-center sm:text-left">
        <div className="max-w-md">
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black tracking-widest uppercase inline-block">
            🎁 Les Bonnes Affaires
          </span>
          <h2 className="text-xl sm:text-2.5xl font-black text-rose-950 font-sans tracking-tight mt-3">
            Promotions & Ventes Privées
          </h2>
          <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-normal">
            Bénéficiez de remises immédiates allant de -20% à -50% sur vos rituels cosmétiques préférés d'Abidjan. Quantités extrêmement limitées !
          </p>
        </div>
      </div>

      <div className="px-4 py-8 max-w-7xl mx-auto">
        
        {/* Dynamic promo display listing */}
        {promoProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoProducts.map((p) => {
              const original = p.price;
              const promo = p.promoPrice || p.price;
              const pct = getDiscountPercentage(original, promo);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-[2rem] border border-rose-100/60 p-4 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Absolute Badge discount banner on corner */}
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-rose-500 to-pink-500 text-white flex items-center justify-center rounded-bl-[1.5rem] shadow-sm select-none">
                    <div className="text-center font-extrabold pr-1 pt-1">
                      <span className="text-sm">-{pct}</span>
                      <span className="text-[9px] font-black uppercase tracking-tighterblock">%</span>
                    </div>
                  </div>

                  {/* Thumbnail Image space */}
                  <div>
                    <div 
                      onClick={() => onSelectProductDetails(p)}
                      className="relative h-48 bg-zinc-50 rounded-2xl overflow-hidden cursor-pointer"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>

                    <div className="mt-4 spacing-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-rose-500 font-mono block">
                        Marque : {p.brand}
                      </span>
                      <h4 
                        onClick={() => onSelectProductDetails(p)}
                        className="text-sm font-black text-rose-950 font-sans tracking-tight hover:text-rose-500 line-clamp-1 cursor-pointer"
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-zinc-500 leading-normal line-clamp-2 mt-1.5 font-normal">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Prices and Buy Now Actions bottom */}
                  <div className="mt-6 pt-4 border-t border-rose-50/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-zinc-400 font-mono font-bold uppercase">
                        Prix Promo :
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-rose-900">
                          {promo.toLocaleString()} F
                        </span>
                        <span className="text-xs text-zinc-400 line-through">
                          {original.toLocaleString()} F
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyNow(p)}
                      className="px-4.5 py-3 bg-rose-500 text-white hover:bg-rose-600 font-black text-xs rounded-xl transition active:scale-95 shadow-md shadow-rose-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      {addedProductId === p.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Choisi</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          <span>Acheter (Panier)</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Offer State */
          <div className="text-center py-20 bg-white rounded-3xl border border-rose-100/50 p-8 space-y-4 max-w-md mx-auto">
            <span className="text-4xl text-rose-300">💖</span>
            <div>
              <h4 className="text-sm font-bold text-rose-950">Grand Déstockage en Préparation</h4>
              <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                Aucune vente privée n'est active aujourd'hui. Notre équipe prépare une nouvelle session de promotions d'excellence. Restez connectés !
              </p>
            </div>
            <button
              onClick={() => onSwitchTab('categories')}
              className="px-5 py-2.5 bg-rose-900 text-white font-bold text-xs rounded-xl"
            >
              Retourner à la boutique
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
