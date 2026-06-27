import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, User, Order, OrderStatus } from '../types';
import { db, doc, setDoc } from '../lib/firebase';
import { 
  X, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Check, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Lock, 
  ShoppingBag, 
  ArrowRight, 
  CreditCard, 
  Truck,
  Sparkles,
  Award
} from 'lucide-react';

interface ProductDetailSheetProps {
  product: Product;
  allProducts: Product[];
  currentUser: User | null;
  onAddToCart: (product: Product) => void;
  onOrderCreated: (order: Order) => void;
  onClearCart: () => void;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onRequireLogin: () => void;
}

export default function ProductDetailSheet({
  product,
  allProducts,
  currentUser,
  onAddToCart,
  onOrderCreated,
  onClearCart,
  onClose,
  onSelectProduct,
  onRequireLogin
}: ProductDetailSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [quantity, setQuantity] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Orange Money' | 'MTN Money' | 'Moov Money' | 'Paiement à la livraison'>('Orange Money');
  
  // UI states
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Synchronize form values with currentUser when it changes or is logged in
  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || '');
      setAddress(currentUser.address || '');
    }
    // Reset quantity and success states when switching products
    setQuantity(1);
    setOrderSuccess(false);
    setFormError('');
  }, [product, currentUser]);

  // Scroll smoothly to top of detailed view when product changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [product]);

  // Find similar/other products (exclude the current one)
  const otherProducts = allProducts
    .filter(p => p.id !== product.id)
    .slice(0, 8); // Take up to 8 other items

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const unitPrice = product.promoPrice ? product.promoPrice : product.price;
  const totalCost = unitPrice * quantity;

  // Form submission handler
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!phone.trim()) {
      setFormError('Le numéro de téléphone est requis pour valider votre commande.');
      return;
    }

    if (!city.trim()) {
      setFormError('La ville de livraison est requise.');
      return;
    }

    if (!address.trim()) {
      setFormError("L'adresse exacte de livraison est requise.");
      return;
    }

    setOrderLoading(true);
    setFormError('');

    const orderId = `cmd-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Conforms with type `Order`
    const orderPayload: Order = {
      id: orderId,
      userId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: phone.trim(),
      customerEmail: currentUser.email || `${currentUser.id}@omii.ci`,
      address: address.trim(),
      city: city.trim(),
      items: [
        {
          productId: product.id,
          name: product.name,
          price: unitPrice,
          quantity: quantity,
          image: product.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'
        }
      ],
      total: totalCost,
      status: 'En attente' as OrderStatus,
      paymentMethod: paymentMethod === 'Paiement à la livraison' ? 'Orange Money' : paymentMethod, // fallback string constraint mapping
      paymentStatus: 'En attente' as const,
      date: new Date().toISOString()
    };

    try {
      // 1. Write directly to Firestore client-side for immediate replication
      await setDoc(doc(db, "orders", orderId), orderPayload);
      console.log("Direct order saved to Firestore via ProductDetailSheet:", orderId);

      // 2. Synchronize to custom express server database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        console.warn("Express server order sync status warning:", response.status);
      }

      setLastCreatedOrderId(orderId);
      setOrderSuccess(true);
      onOrderCreated(orderPayload);
    } catch (err: any) {
      console.error("Order processing failed:", err);
      setFormError("Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez réessayer.");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Back button and title bar */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="inline-flex items-center space-x-2 text-xs font-bold text-rose-950 hover:text-rose-700 transition cursor-pointer bg-white px-4 py-2.5 rounded-full border border-rose-100 shadow-xs"
        >
          <ChevronLeft className="h-4 w-4 text-rose-800" />
          <span>Retour à l'accueil</span>
        </button>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 bg-white px-3 py-1 rounded-full border border-rose-50/50">
          Aperçu détaillé
        </span>
      </div>

      {/* Main product card panels */}
      <div className="bg-white rounded-[2.5rem] border border-rose-100/60 shadow-xl overflow-hidden mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Block: Product Images and highlights (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-50 border-r border-rose-50/50 flex flex-col justify-between relative p-6 sm:p-8">
            {product.promoPrice && (
              <span className="absolute top-6 left-6 z-10 bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md animate-pulse">
                OFFRE SPÉCIALE
              </span>
            )}
            
            <div className="flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
              <motion.img 
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                referrerPolicy="no-referrer"
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'} 
                alt={product.name}
                className="max-h-[380px] w-auto object-contain rounded-2xl drop-shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Micro details labels */}
            <div className="mt-6 pt-6 border-t border-rose-100/50 space-y-3.5">
              <div className="flex items-center space-x-2.5 text-zinc-500">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-xs">Produit certifié 100% authentique de marque locale</span>
              </div>
              <div className="flex items-center space-x-2.5 text-zinc-500">
                <Award className="h-5 w-5 text-rose-500 shrink-0" />
                <span className="text-xs">Formule testée sous contrôle dermatologique</span>
              </div>
            </div>
          </div>

          {/* Right Block: Details and Checkout ordering form (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Product Header metadata */}
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-rose-50 text-rose-800 text-[10px] uppercase font-bold tracking-widest rounded-md">
                  {product.brand}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  • {product.category}
                </span>
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-950 leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-baseline space-x-3.5 mt-3.5">
                  <span className="text-2xl sm:text-3xl font-black text-rose-700">
                    {unitPrice.toLocaleString()} F CFA
                  </span>
                  {product.promoPrice && (
                    <span className="text-sm text-zinc-400 line-through">
                      {product.price.toLocaleString()} F CFA
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Usage instructions */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400">
                  Description & bienfaits
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-normal whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Local shipping details label */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl flex items-start space-x-3">
                <Truck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Livraison Express Côte d'Ivoire</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
                    Expédié directement depuis Abidjan. Livraison à domicile ou retrait en point relais sous 24h à 48h.
                  </p>
                </div>
              </div>

              {/* INTEGRATED CHECKOUT FORM */}
              <div className="border-t border-rose-100/60 pt-6">
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400 mb-4 flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-rose-600 animate-pulse" />
                  <span>Commander directement ce produit</span>
                </h3>

                <AnimatePresence mode="wait">
                  {orderSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4"
                    >
                      <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-200">
                        <Check className="h-6 w-6 stroke-[3]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-emerald-950">Commande enregistrée avec succès !</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Félicitations ! Votre commande <strong className="font-mono text-emerald-700">{lastCreatedOrderId}</strong> a bien été enregistrée et transmise à nos équipes.
                        </p>
                      </div>
                      <div className="text-[11px] text-zinc-400 bg-white/75 p-3 rounded-xl border border-emerald-100 max-w-sm mx-auto">
                        Notre conseillère beauté va vous contacter immédiatement par téléphone pour coordonner le créneau horaire de livraison.
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <button
                          onClick={() => setOrderSuccess(false)}
                          className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-[11px] font-bold rounded-xl text-zinc-700 cursor-pointer"
                        >
                          Passer une autre commande
                        </button>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-white text-[11px] font-bold rounded-xl cursor-pointer"
                        >
                          Retourner à la boutique
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleConfirmOrder} 
                      className="bg-rose-50/15 border border-rose-100/50 p-5 rounded-3xl space-y-4"
                    >
                      {formError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                          {formError}
                        </div>
                      )}

                      {!currentUser ? (
                        <div className="p-4 bg-white rounded-2xl border border-rose-100/40 text-center space-y-3 shadow-xs">
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Pour valider votre commande en 1 clic et garder un œil sur votre historique, veuillez vous connecter ou créer votre compte client.
                          </p>
                          <button
                            type="button"
                            onClick={onRequireLogin}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                          >
                            <span>S'identifier / Créer un compte</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 text-xs">
                          {/* 1. Recipient Name (Fixed) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                                <Lock className="h-3 w-3 text-zinc-400" />
                                Nom du destinataire (Sauvegardé)
                              </label>
                              <div className="w-full px-4 py-2.5 bg-zinc-100/80 border border-zinc-200 rounded-xl text-zinc-500 font-medium flex items-center justify-between">
                                <span>{currentUser.name}</span>
                                <span className="text-[9px] bg-zinc-200 px-2 py-0.5 rounded text-zinc-500 font-mono">Verrouillé</span>
                              </div>
                            </div>

                            {/* 2. Phone field (Editable) */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-rose-950 flex items-center gap-1">
                                <Phone className="h-3 w-3 text-rose-700" />
                                Numéro de Téléphone *
                              </label>
                              <input 
                                type="tel"
                                placeholder="Ex: 0707080910"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-hidden focus:border-rose-400 text-zinc-700 font-medium placeholder-zinc-300"
                              />
                            </div>
                          </div>

                          {/* 3. Delivery City & Address (Editable) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-rose-950 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-rose-700" />
                                Ville de Livraison *
                              </label>
                              <input 
                                type="text"
                                placeholder="Ex: Abidjan Cocody, Bouaké..."
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-hidden focus:border-rose-400 text-zinc-700 font-medium placeholder-zinc-300"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-rose-950 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-rose-700" />
                                Adresse exacte de livraison *
                              </label>
                              <input 
                                type="text"
                                placeholder="Ex: Quartier Riviera 3, Rue de la Paix"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-hidden focus:border-rose-400 text-zinc-700 font-medium placeholder-zinc-300"
                              />
                            </div>
                          </div>

                          {/* 4. Quantity modifier with +/- */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-t border-b border-rose-100/40">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-rose-950 block">Quantité commandée :</span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5">Stock disponible : {product.stock} articles</span>
                            </div>
                            
                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl border border-rose-100/50">
                              <button
                                type="button"
                                onClick={handleDecrement}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-600 rounded-lg transition cursor-pointer"
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-mono font-bold text-xs px-2.5 text-zinc-800">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={handleIncrement}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-600 rounded-lg transition cursor-pointer"
                                disabled={quantity >= product.stock}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 5. Payment Methods options */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block">
                              Moyen de paiement favori :
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {(['Orange Money', 'MTN Money', 'Moov Money', 'Paiement à la livraison'] as const).map((method) => {
                                const active = paymentMethod === method;
                                return (
                                  <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={`py-2 px-2.5 rounded-xl border font-bold text-[10px] text-center transition cursor-pointer ${
                                      active 
                                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-xs' 
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                    }`}
                                  >
                                    {method}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 6. Order Summary validation and button */}
                          <div className="pt-2">
                            <div className="bg-white p-4 rounded-2xl border border-rose-100/50 space-y-1 mb-4">
                              <div className="flex justify-between items-center text-zinc-400">
                                <span>Prix unitaire :</span>
                                <span className="font-mono">{unitPrice.toLocaleString()} F CFA</span>
                              </div>
                              <div className="flex justify-between items-center text-zinc-400">
                                <span>Quantité sélectionnée :</span>
                                <span className="font-mono">x{quantity}</span>
                              </div>
                              <div className="flex justify-between items-center text-rose-950 font-bold border-t border-rose-50/50 pt-2 text-sm">
                                <span>Total estimé :</span>
                                <span className="font-mono text-rose-700 text-base">{totalCost.toLocaleString()} F CFA</span>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={orderLoading || product.stock === 0}
                              className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-900/10 hover:shadow-rose-900/15 transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
                            >
                              {orderLoading ? (
                                <>
                                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                  <span>Validation de votre commande...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Confirmer ma commande en 1-Clic</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* RELATED PRODUCTS SECTION: Display and update active product */}
      {/* ============================================================== */}
      {otherProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-black text-rose-950 tracking-tight">Autres merveilles de notre catalogue</h2>
            <div className="h-px flex-1 bg-rose-100"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherProducts.map((otherProd) => {
              const hasPromo = otherProd.promoPrice !== undefined && otherProd.promoPrice > 0;
              const currentPrice = hasPromo ? otherProd.promoPrice! : otherProd.price;

              return (
                <div 
                  key={otherProd.id}
                  onClick={() => onSelectProduct(otherProd)}
                  className="bg-white rounded-[2rem] p-4 border border-rose-100/50 hover:border-rose-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="aspect-square bg-zinc-50 rounded-2xl overflow-hidden relative flex items-center justify-center p-2">
                      <img 
                        referrerPolicy="no-referrer"
                        src={otherProd.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'} 
                        alt={otherProd.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                      {hasPromo && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                          PROMO
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-rose-800 font-bold block">
                        {otherProd.brand}
                      </span>
                      <h3 className="text-xs font-bold text-rose-950 line-clamp-2 leading-tight group-hover:text-rose-700 transition-colors">
                        {otherProd.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-rose-50 flex items-center justify-between">
                    <div className="text-xs font-extrabold text-rose-700">
                      {currentPrice.toLocaleString()} F CFA
                    </div>
                    <span className="text-[10px] font-bold text-rose-950 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      <span>Voir</span>
                      <ChevronLeft className="h-3 w-3 rotate-180 text-rose-800" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
