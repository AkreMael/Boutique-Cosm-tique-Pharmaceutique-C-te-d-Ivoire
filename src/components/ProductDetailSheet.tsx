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
  Award,
  ChevronRight
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

  // Keep track of the current product ID and user ID to only reset/sync when the actual product or user changes
  const prevProductIdRef = useRef<string>('');
  const prevUserIdRef = useRef<string>('');

  useEffect(() => {
    const productId = product?.id || '';
    const userId = currentUser?.id || '';

    if (productId !== prevProductIdRef.current) {
      prevProductIdRef.current = productId;
      setQuantity(1);
      setOrderSuccess(false);
      setFormError('');
    }

    if (userId !== prevUserIdRef.current) {
      prevUserIdRef.current = userId;
      if (currentUser) {
        const rawPhone = currentUser.phone || '';
        const stripped = rawPhone.startsWith('+225') ? rawPhone.slice(4).replace(/\s+/g, '') : rawPhone.replace(/\s+/g, '');
        setPhone(stripped);
        setCity(currentUser.city || '');
        setAddress(currentUser.address || '');
      }
    }
  }, [product?.id, currentUser?.id]);

  // Find similar/other products belonging to the SAME category
  const otherProducts = allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4); // Take up to 4 other items for the drawer view

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

    const cleanDigits = phone.replace(/[^\d]/g, '');
    if (cleanDigits.length !== 10) {
      setFormError('Le numéro de téléphone doit comporter exactement 10 chiffres (ex: 0707070707).');
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

    const finalPhone = `+225${cleanDigits}`;
    const orderId = `cmd-${Math.floor(10000 + Math.random() * 90000)}`;
    
    const orderPayload: Order = {
      id: orderId,
      userId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: finalPhone,
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
      paymentMethod: paymentMethod === 'Paiement à la livraison' ? 'Orange Money' : paymentMethod,
      paymentStatus: 'En attente' as const,
      date: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "orders", orderId), orderPayload);
      
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
    <>
      {/* 1. Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-40 transition-opacity cursor-pointer"
      />

      {/* 2. Slide-out Right Panel Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white shadow-2xl z-45 flex flex-col pb-[74px] overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100/60 bg-zinc-50/50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 text-[10px] font-black uppercase tracking-widest rounded-md">
              Fiche Technique
            </span>
            <span className="text-zinc-400 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
              {product.brand} • {product.category.replace('-', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-full transition cursor-pointer"
            title="Fermer la fiche"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Panel Area */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Product Cover and highlights */}
          <div className="bg-zinc-50 rounded-[2rem] p-6 relative border border-rose-100/40 flex flex-col items-center justify-center min-h-[260px]">
            {product.promoPrice && (
              <span className="absolute top-4 left-4 bg-red-500 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                PROMO
              </span>
            )}

            <div className="max-w-[240px] w-full flex justify-center items-center">
              <motion.img 
                key={product.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                referrerPolicy="no-referrer"
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'} 
                alt={product.name}
                className="max-h-[200px] w-auto object-contain rounded-xl drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>
            
            {/* Horizontal gallery indicators if multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 mt-4 overflow-x-auto py-1 scrollbar-none max-w-full justify-center">
                {product.images.map((imgUrl, idx) => (
                  <div key={idx} className="h-11 w-11 rounded-lg border border-rose-100/40 bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                    <img src={imgUrl} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title and Pricing info */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-800 font-extrabold block">
              {product.brand}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-rose-950 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-2xl font-black text-rose-700">
                {unitPrice.toLocaleString()} F CFA
              </span>
              {product.promoPrice && (
                <span className="text-sm text-zinc-400 line-through">
                  {product.price.toLocaleString()} F CFA
                </span>
              )}
            </div>
          </div>

          {/* Full description */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Description & bienfaits
            </h3>
            <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-normal whitespace-pre-line bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
              {product.description}
            </p>
          </div>

          {/* Quality check highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 bg-rose-50/15 border border-rose-100/30 p-3.5 rounded-2xl">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-[10px] sm:text-xs text-rose-950 font-bold leading-snug">Certifié 100% authentique</span>
            </div>
            <div className="flex items-start gap-2.5 bg-rose-50/15 border border-rose-100/30 p-3.5 rounded-2xl">
              <Award className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-[10px] sm:text-xs text-rose-950 font-bold leading-snug">Dermatologiquement certifié</span>
            </div>
          </div>

          {/* Express local shipping indicator */}
          <div className="p-4 bg-emerald-50/30 border border-emerald-100/40 rounded-2xl flex items-start gap-3">
            <Truck className="h-4.5 w-4.5 text-emerald-650 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Livraison Express Abidjan & Côte d'Ivoire</h4>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                Expédition directe depuis Abidjan. Livraison à domicile ou retrait relais sous 24h à 48h.
              </p>
            </div>
          </div>

          {/* Directly Embedded Direct Form */}
          <div className="border-t border-rose-100/50 pt-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
              <span>Commander directement ce produit</span>
            </h3>

            <AnimatePresence mode="wait">
              {orderSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4"
                >
                  <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-emerald-950">Commande enregistrée avec succès !</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Félicitations ! Votre commande <strong className="font-mono text-emerald-700">{lastCreatedOrderId}</strong> a été enregistrée.
                    </p>
                  </div>
                  <div className="text-[10px] text-zinc-400 bg-white/75 p-3 rounded-xl border border-emerald-100">
                    Notre conseillère beauté va vous contacter immédiatement par téléphone pour coordonner le créneau horaire de livraison.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setOrderSuccess(false)}
                      className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-bold rounded-xl text-zinc-700 cursor-pointer"
                    >
                      Commander à nouveau
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold rounded-xl cursor-pointer"
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
                  className="bg-rose-50/10 border border-rose-100/40 p-4.5 rounded-2xl space-y-4"
                >
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {!currentUser ? (
                    <div className="p-4 bg-white rounded-xl border border-rose-100/30 text-center space-y-3">
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Pour valider votre commande en 1 clic et garder un œil sur votre historique, veuillez vous connecter ou créer votre compte client.
                      </p>
                      <button
                        type="button"
                        onClick={onRequireLogin}
                        className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <span>S'identifier / Créer un compte</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      
                      {/* Name display (Locked) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 flex items-center gap-1">
                          <Lock className="h-3 w-3 text-zinc-400" />
                          Nom du destinataire (Sauvegardé)
                        </label>
                        <div className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-500 font-medium flex items-center justify-between">
                          <span>{currentUser.name}</span>
                          <span className="text-[9px] bg-zinc-200/60 px-2 py-0.5 rounded text-zinc-500 font-mono font-bold">Verrouillé</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Phone with visual prefix (+225) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wide text-rose-950 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-rose-700" />
                            Numéro de Téléphone *
                          </label>
                          <div className="flex rounded-xl border border-rose-100 bg-white overflow-hidden focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-400 transition">
                            <span className="flex items-center px-3 bg-rose-50 border-r border-rose-100 text-rose-800 font-bold text-xs select-none font-mono">
                              +225
                            </span>
                            <input 
                              type="tel"
                              placeholder="Ex: 0707080910"
                              value={phone}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                                setPhone(clean);
                              }}
                              className="w-full px-3 py-2.5 bg-transparent text-zinc-700 font-mono font-bold text-xs focus:outline-none placeholder-zinc-350"
                            />
                          </div>
                        </div>

                        {/* City list / text input (Editable) */}
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
                            className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-hidden focus:border-rose-400 text-zinc-700 font-medium placeholder-zinc-350"
                          />
                        </div>
                      </div>

                      {/* Precise Delivery Address */}
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
                          className="w-full px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-hidden focus:border-rose-400 text-zinc-700 font-medium placeholder-zinc-350"
                        />
                      </div>

                      {/* Quantity Selector with +/- */}
                      <div className="flex flex-row justify-between items-center gap-4 py-2.5 border-t border-b border-rose-100/30">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-rose-950 block">Quantité commandée :</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">Stock disponible : {product.stock} articles</span>
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

                      {/* Payment Choice */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 block">
                          Moyen de paiement favori :
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Orange Money', 'MTN Money', 'Moov Money', 'Paiement à la livraison'] as const).map((method) => {
                            const active = paymentMethod === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`py-2 px-2.5 rounded-xl border font-bold text-[10px] text-center transition cursor-pointer ${
                                  active 
                                    ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-2xs' 
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                                }`}
                              >
                                {method}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Calculations and submit */}
                      <div className="pt-2">
                        <div className="bg-white p-4 rounded-xl border border-rose-100/50 space-y-1.5 mb-3.5">
                          <div className="flex justify-between items-center text-zinc-400">
                            <span>Prix unitaire :</span>
                            <span className="font-mono">{unitPrice.toLocaleString()} F CFA</span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-400">
                            <span>Quantité :</span>
                            <span className="font-mono">x{quantity}</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-950 font-bold border-t border-rose-50/50 pt-2 text-xs">
                            <span>Total estimé :</span>
                            <span className="font-mono text-rose-700 text-sm">{totalCost.toLocaleString()} F CFA</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={orderLoading || product.stock === 0}
                          className="w-full py-3 bg-rose-950 hover:bg-rose-900 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-rose-900/10 hover:shadow-rose-900/15 transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
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

          {/* Related products */}
          {otherProducts.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-black text-rose-950 uppercase tracking-widest">Autres merveilles de notre gamme</h2>
                <div className="h-px flex-1 bg-rose-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {otherProducts.map((otherProd) => {
                  const hasPromo = otherProd.promoPrice !== undefined && otherProd.promoPrice > 0;
                  const currentPrice = hasPromo ? otherProd.promoPrice! : otherProd.price;

                  return (
                    <div 
                      key={otherProd.id}
                      onClick={() => onSelectProduct(otherProd)}
                      className="bg-white rounded-xl p-3 border border-rose-100/50 hover:border-rose-250 shadow-2xs hover:shadow-xs transition flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="aspect-square bg-zinc-50 rounded-lg overflow-hidden relative flex items-center justify-center p-1.5">
                          <img 
                            referrerPolicy="no-referrer"
                            src={otherProd.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'} 
                            alt={otherProd.name}
                            className="h-full w-full object-contain group-hover:scale-102 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop';
                            }}
                          />
                          {hasPromo && (
                            <span className="absolute top-1 left-1 bg-red-500 text-white font-black text-[7px] uppercase tracking-wider px-1 py-0.5 rounded">
                              PROMO
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase font-mono tracking-wider text-rose-800 font-bold block">
                            {otherProd.brand}
                          </span>
                          <h3 className="text-[10px] font-bold text-rose-950 line-clamp-1 leading-tight group-hover:text-rose-750 transition-colors">
                            {otherProd.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-rose-50 flex items-center justify-between">
                        <div className="text-[10px] font-extrabold text-rose-700">
                          {currentPrice.toLocaleString()} F CFA
                        </div>
                        <span className="text-[8px] font-bold text-rose-950 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                          <span>Voir</span>
                          <ChevronRight className="h-2.5 w-2.5 text-rose-800" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </>
  );
}
