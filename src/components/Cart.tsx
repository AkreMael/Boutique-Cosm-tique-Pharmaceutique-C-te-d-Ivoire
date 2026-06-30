import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, ChevronRight, CheckCircle2, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { CartItem, Product, Order, User as AppUser } from '../types';

interface CartProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentUser: AppUser | null;
  onOrderCreated: (order: Order) => void;
  onRequireLogin?: () => void;
}

export default function Cart({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderCreated,
  onRequireLogin
}: CartProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'ussd' | 'success'>('cart');
  const [operator, setOperator] = useState<'Orange' | 'MTN' | 'Moov'>('Orange');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState('Abidjan');
  const [address, setAddress] = useState('Rue des Jardins, Cocody Deux Plateaux');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Synchronise phone number on login
  React.useEffect(() => {
    if (currentUser) {
      const rawPhone = currentUser.phone || '';
      const stripped = rawPhone.startsWith('+225') ? rawPhone.slice(4).replace(/\s+/g, '') : rawPhone.replace(/\s+/g, '');
      setPhone(stripped);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((total, item) => {
    const price = item.product.promoPrice ? item.product.promoPrice : item.product.price;
    return total + price * item.quantity;
  }, 0);

  // Delivery costs in Côte d'Ivoire: 1500 CFA in Abidjan, 3000 CFA for other cities (Yamoussoukro, Bouaké, San Pedro etc.)
  const deliveryFee = city.toLowerCase() === 'abidjan' ? 1500 : 3000;
  const totalCost = subtotal + deliveryFee;

  const handleNextStep = () => {
    if (checkoutStep === 'cart') {
      if (!currentUser) {
        if (onRequireLogin) onRequireLogin();
        return;
      }
      setCheckoutStep('shipping');
    }
    else if (checkoutStep === 'shipping') setCheckoutStep('payment');
  };

  const handleInitiatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCheckoutStep('ussd');
    }, 1500);
  };

  const handleValidateUssdPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length < 4) return;
    
    setLoading(true);

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const finalPhone = `+225${cleanPhone}`;

    const orderPayload = {
      userId: currentUser?.id || 'guest',
      customerName: currentUser?.name || 'Client de passage',
      customerPhone: finalPhone,
      customerEmail: currentUser?.email || 'guest@cosmetiques.ci',
      address,
      city,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.promoPrice ? item.product.promoPrice : item.product.price,
        quantity: item.product.stock > 0 ? Math.min(item.product.stock, item.quantity) : item.quantity,
        image: item.product.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"
      })),
      total: totalCost,
      paymentMethod: `${operator} Money` as any
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!response.ok) throw new Error('Failed to post order');
      const savedOrder = await response.json();
      setLastCreatedOrder(savedOrder);
      onOrderCreated(savedOrder);
      onClearCart();
      setCheckoutStep('success');
    } catch (err) {
      console.error(err);
      // Fallback
      const mockSavedOrder: Order = {
        id: `cmd-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: currentUser?.id || 'guest',
        customerName: currentUser?.name || 'Client de passage',
        customerPhone: finalPhone,
        customerEmail: currentUser?.email || 'guest@cosmetiques.ci',
        address,
        city,
        items: cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.promoPrice ? item.product.promoPrice : item.product.price,
          quantity: item.quantity,
          image: item.product.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"
        })),
        total: totalCost,
        status: 'En attente',
        paymentMethod: `${operator} Money` as any,
        paymentStatus: 'Payé',
        date: new Date().toISOString()
      };
      setLastCreatedOrder(mockSavedOrder);
      onOrderCreated(mockSavedOrder);
      onClearCart();
      setCheckoutStep('success');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheckout = () => {
    setCheckoutStep('cart');
    setPinCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-rose-50">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-rose-950" />
              <h3 className="text-base font-bold text-rose-950">
                {checkoutStep === 'cart' && 'Votre Panier'}
                {checkoutStep === 'shipping' && 'Adresse de Livraison'}
                {checkoutStep === 'payment' && 'Facturation Mobile Money'}
                {checkoutStep === 'ussd' && 'Validation Sécurisée'}
                {checkoutStep === 'success' && 'Félicitations !'}
              </h3>
            </div>
            <button 
              onClick={handleResetCheckout}
              className="p-1.5 rounded-full hover:bg-rose-100/70 text-zinc-400 hover:text-rose-950 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Core Scroll Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

            {/* STEP 1: CART ITEMS REVIEW */}
            {checkoutStep === 'cart' && (
              <>
                {cart.length > 0 ? (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const finalPrice = item.product.promoPrice ? item.product.promoPrice : item.product.price;
                      return (
                        <div key={item.product.id} className="flex space-x-4 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-150 relative">
                          <img 
                            src={item.product.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"} 
                            alt={item.product.name} 
                            className="h-16 w-16 object-cover rounded-xl border border-rose-100"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                            }}
                          />
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-xs font-bold text-rose-950 truncate leading-snug">{item.product.name}</h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{item.product.brand}</p>
                            <p className="text-xs font-extrabold text-rose-800 mt-2">{finalPrice.toLocaleString()} CFA</p>
                          </div>

                          {/* Controls */}
                          <div className="flex flex-col justify-between items-end space-y-2">
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 rounded-lg transition"
                              title="Retirer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-zinc-200">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                className="p-1 hover:bg-zinc-100 rounded text-rose-950 transition"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold text-rose-900 w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 hover:bg-zinc-100 rounded text-rose-950 transition"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center">
                    <span className="text-4xl">🛒</span>
                    <h4 className="text-sm font-bold text-rose-950 mt-4">Votre panier est bien vide</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                      Ajoutez des savons, laits hydratants ou écrans solaires depuis notre boutique centrale.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 px-4 py-2 text-xs font-semibold text-white bg-rose-950 hover:bg-rose-900 rounded-xl transition"
                    >
                      Retourner en rayon
                    </button>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: SHIPPING INFO */}
            {checkoutStep === 'shipping' && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 block mb-1">
                  Coordonnées de l'acheteur :
                </span>
                
                {/* City select */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1.5">Ville en Côte d'Ivoire *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700"
                  >
                    <option value="Abidjan">Abidjan (Cocody, Plateau, Zone 4, Yopougon...)</option>
                    <option value="Yamoussoukro">Yamoussoukro</option>
                    <option value="Bouaké">Bouaké</option>
                    <option value="San Pedro">San Pedro</option>
                    <option value="Korhogo">Korhogo</option>
                    <option value="Man">Man</option>
                  </select>
                </div>

                {/* Road / Address */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1.5">Adresse de livraison complète *</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quartier, Rue, numéro de porte ou repère précis (ex: en face de la pharmacie du vallon)"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-300"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1">
                    * Abidjan: Livraison sous 24h (1500 CFA). Intérieur du pays: Expédition Express sous 48h (3000 CFA).
                  </p>
                </div>

                {/* Telephone */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1.5">Téléphone d'expédition *</label>
                  <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:border-rose-300 focus-within:bg-white transition">
                    <span className="flex items-center px-3.5 bg-rose-50 border-r border-zinc-200 text-rose-800 font-bold text-xs select-none font-mono">
                      +225
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                        setPhone(clean);
                      }}
                      placeholder="ex: 0707070707"
                      className="w-full p-3 bg-transparent text-xs text-zinc-700 focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">Saisissez uniquement les 10 chiffres après l'indicatif +225.</span>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT PORTAL SELECTOR */}
            {checkoutStep === 'payment' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 block mb-3.5">
                    Sélectionner l'Opérateur de Paiement :
                  </span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Orange Money */}
                    <button
                      type="button"
                      onClick={() => setOperator('Orange')}
                      className={`p-3.5 rounded-2xl border-2 transition flex flex-col items-center justify-center text-center ${
                        operator === 'Orange'
                          ? 'border-orange-500 bg-orange-50/20'
                          : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                        🍊
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700 mt-2">Orange Mo'</span>
                    </button>

                    {/* MTN Money */}
                    <button
                      type="button"
                      onClick={() => setOperator('MTN')}
                      className={`p-3.5 rounded-2xl border-2 transition flex flex-col items-center justify-center text-center ${
                        operator === 'MTN'
                          ? 'border-yellow-500 bg-yellow-50/20'
                          : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="h-10 w-10 bg-yellow-400 rounded-lg flex items-center justify-center text-zinc-900 font-extrabold text-lg shadow-sm">
                        💰
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700 mt-2">MTN MoMo</span>
                    </button>

                    {/* Moov Money */}
                    <button
                      type="button"
                      onClick={() => setOperator('Moov')}
                      className={`p-3.5 rounded-2xl border-2 transition flex flex-col items-center justify-center text-center ${
                        operator === 'Moov'
                          ? 'border-blue-500 bg-blue-50/20'
                          : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm font-sans">
                        🟢
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700 mt-2">Moov Money</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150">
                  <div className="flex items-center space-x-2.5 mb-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                    <p className="text-xs font-bold text-rose-950">Intégration d'API Mobile Directe</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Notre boutique Cosmétique valide automatiquement les transactions via le protocole sécurisé OTP {operator} Money Côte d'Ivoire. Aucune carte bancaire requise.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: SIMULATED USSD OTP PROMPT */}
            {checkoutStep === 'ussd' && (
              <div className="space-y-6 text-center py-4">
                
                {/* Simulated cellular prompt overlay */}
                <div className="mx-auto max-w-[240px] bg-zinc-950 text-white rounded-3xl p-5 border-4 border-zinc-800 shadow-xl font-mono text-xs">
                  <div className="w-8 h-2 bg-zinc-800 rounded-full mx-auto mb-4"></div>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mb-2">Validation SIM {operator} Money</p>
                  <p className="text-[11px] mb-4 text-left leading-relaxed text-yellow-300">
                    Retrait de {totalCost.toLocaleString()} CFA autorisé pour Omi'i Institut d'Abidjan.
                  </p>
                  <p className="text-[10px] text-zinc-400 mb-4 text-left">
                    Entrez votre code confidentiel à 4 chiffres :
                  </p>
                  
                  <form onSubmit={handleValidateUssdPIN} className="space-y-4">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center py-2.5 bg-zinc-900 border border-zinc-700 text-white font-bold rounded-xl text-lg tracking-widest text-emerald-400 focus:outline-none"
                    />
                    
                    <button
                      type="submit"
                      disabled={pinCode.length < 4 || loading}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-extrabold text-[11px] rounded-lg tracking-wide shadow transition"
                    >
                      {loading ? 'Connexion...' : 'ENVOYER PIN'}
                    </button>
                  </form>
                </div>

                <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Tapez n'importe quel code à 4 chiffres (ex: <span className="font-bold">1234</span>) pour simuler la validation de parapharmacie. Le système testera le rapprochement du solde instantanément.
                </p>
              </div>
            )}

            {/* STEP 5: SUCCESS LEDGER RECEIPT */}
            {checkoutStep === 'success' && lastCreatedOrder && (
              <div className="text-center py-8 space-y-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-rose-950">Commande enregistrée !</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Le paiement Mobile Money de <span className="font-bold">{totalCost.toLocaleString()} CFA</span> a été perçu avec succès par notre centrale.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-4.5 rounded-2xl bg-zinc-50 border border-zinc-150 text-left text-xs font-mono space-y-3">
                  <div className="border-b border-dashed border-zinc-200 pb-2 flex justify-between font-bold text-[10px] text-zinc-500">
                    <span>FACTURE N° {lastCreatedOrder.id}</span>
                    <span>{new Date(lastCreatedOrder.date).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {lastCreatedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-zinc-650">
                        <span className="truncate max-w-[200px]">{it.name} x{it.quantity}</span>
                        <span>{(it.price * it.quantity).toLocaleString()} CFA</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-zinc-200 pt-2 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-zinc-500 text-[10px] font-bold">
                      <span>LIVRAISON CI ({lastCreatedOrder.city})</span>
                      <span>{deliveryFee} CFA</span>
                    </div>
                    <div className="flex justify-between text-rose-950 font-black text-xs pt-1">
                      <span>MONTANT TOTAL</span>
                      <span>{lastCreatedOrder.total.toLocaleString()} CFA</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-emerald-700 bg-emerald-50 p-2 rounded-lg font-sans border border-emerald-100 text-center font-medium mt-2">
                    Votre commande est envoyée en Préparation. Suivez l'avancement dans l'historique ! Pin validation OM/MTN: OK
                  </div>
                </div>

                <button
                  onClick={handleResetCheckout}
                  className="w-full py-3 bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs rounded-xl"
                >
                  Continuer mes achats
                </button>
              </div>
            )}

          </div>

          {/* Checkout Footer Total Calculations (Steps 1, 2, 3) */}
          {cart.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'ussd' && (
            <div className="p-6 border-t border-rose-100 bg-zinc-50 space-y-4">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Sous-total articles</span>
                  <span className="font-bold text-zinc-800">{subtotal.toLocaleString()} CFA</span>
                </div>
                {checkoutStep !== 'cart' && (
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Frais de livraison ({city})</span>
                    <span className="font-bold text-secondary-900">{deliveryFee.toLocaleString()} CFA</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-rose-100 font-extrabold text-rose-950">
                  <span>Total à payer</span>
                  <span className="text-base text-rose-800 text-right">
                    {checkoutStep === 'cart' ? subtotal.toLocaleString() : totalCost.toLocaleString()} CFA
                  </span>
                </div>
              </div>

              {checkoutStep === 'cart' && (
                <button
                  onClick={handleNextStep}
                  className="w-full py-4 bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <span>Passer la commande</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {checkoutStep === 'shipping' && (
                <button
                  onClick={handleNextStep}
                  disabled={!phone}
                  className="w-full py-4 bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Procéder au paiement Mobile Money</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {checkoutStep === 'payment' && (
                <button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-zinc-950 font-extrabold text-xs rounded-2xl flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-emerald-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initialisation USSD...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4.5 w-4.5" />
                      <span>Déclencher le Panneau PIN Mobile</span>
                    </>
                  )}
                </button>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
