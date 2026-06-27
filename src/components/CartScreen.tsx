import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, ChevronRight, Truck, Mail, Phone, MapPin, User as UserIcon, Check, X, Smartphone, Loader2 } from 'lucide-react';
import { CartItem, Product, Order, User as AppUser } from '../types';
import { db, doc, setDoc } from '../lib/firebase';

// Predefined Côte d'Ivoire cities and localities database with delivery fees
const IVORY_COAST_CITIES = [
  { name: "Abidjan", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Cocody", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Yopougon", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Marcory", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Koumassi", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Port-Bouët", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Abobo", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Plateau", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Treichville", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Adjamé", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Riviera", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Angré", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Deux Plateaux", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Abidjan - Zone 4", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Bingerville", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Grand-Bassam", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Anyama", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Songon", fee: 1500, details: "Livreur moto, expédié sous 24h" },
  { name: "Yamoussoukro", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Bouaké", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "San Pedro", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Korhogo", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Daloa", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Man", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Gagnoa", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Assinie", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Soubré", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Odienné", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Séguela", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Boundiali", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Ferkessédougou", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Katiola", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Dabou", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Adzopé", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Agboville", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Aboisso", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Daoukro", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Bondoukou", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Bouna", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Guiglo", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Duékoué", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Touba", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Sinfra", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Oumé", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Divo", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Lakota", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Sassandra", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" },
  { name: "Tabou", fee: 3000, details: "Dépôt gare ou colis, expédié sous 48h" }
];

interface CartScreenProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentUser: AppUser | null;
  onOrderCreated: (order: Order) => void;
  onRequireLogin: () => void;
  onSwitchTab: (tab: string) => void;
}

export default function CartScreen({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderCreated,
  onRequireLogin,
  onSwitchTab
}: CartScreenProps) {
  // Checkout form details
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [cityInput, setCityInput] = useState(currentUser?.city || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [address, setAddress] = useState(currentUser?.address || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('A la livraison');
  const [showMobileMoneyOptions, setShowMobileMoneyOptions] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Sync details when user updates or logs in
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.id !== lastUserIdRef.current) {
        lastUserIdRef.current = currentUser.id;
        setCustomerName(currentUser.name || '');
        setPhone(currentUser.phone || '');
        setCity(currentUser.city || '');
        setCityInput(currentUser.city || '');
        setAddress(currentUser.address || '');
        setEmail(currentUser.email || '');
      }
    } else {
      lastUserIdRef.current = null;
    }
  }, [currentUser]);

  // Click outside to close autocomplete suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subtotal = cart.reduce((total, item) => {
    const price = item.product.promoPrice ? item.product.promoPrice : item.product.price;
    return total + price * item.quantity;
  }, 0);

  // Côte d'Ivoire delivery fees calculated using the selected city object or custom string fallback
  const getDeliveryFeeForCity = (cityName: string) => {
    if (!cityName) return 0;
    const matched = IVORY_COAST_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (matched) return matched.fee;
    const lower = cityName.toLowerCase();
    if (lower.includes('abidjan') || lower.includes('cocody') || lower.includes('yopougon') || lower.includes('marcory') || lower.includes('koumassi') || lower.includes('plateau') || lower.includes('abobo') || lower.includes('treichville') || lower.includes('adjamé') || lower.includes('bingerville') || lower.includes('bassam')) {
      return 1500;
    }
    return 3000; // Default for other locations/interior
  };

  const deliveryFee = city ? getDeliveryFeeForCity(city) : 0;
  const totalCost = subtotal > 0 ? (city ? subtotal + deliveryFee : subtotal) : 0;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!phone || !city || !address) {
      alert("Veuillez remplir toutes les informations d'expédition obligatoires.");
      return;
    }

    setLoading(true);

    const orderId = `cmd-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderPayload = {
      id: orderId,
      userId: currentUser.id,
      customerName: customerName || currentUser.name,
      customerPhone: phone,
      customerEmail: email || `${currentUser.id}@omii.ci`,
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
      status: 'En attente' as const,
      paymentMethod,
      paymentStatus: 'En attente' as const,
      date: new Date().toISOString()
    };

    // 1. Instant optimistic local write to Firestore (visible to snapshots instantly)
    try {
      await setDoc(doc(db, "orders", orderId), orderPayload);
      console.log("Order saved directly to Firestore client-side:", orderId);
    } catch (err) {
      console.error("Direct order Firestore write failed:", err);
    }

    // 2. Async Express sync in background to update stocks and server-side tracking
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).then(async (response) => {
      if (response.ok) {
        console.log("Express order sync succeeded");
      } else {
        console.warn("Express order sync warning status:", response.status);
      }
    }).catch(err => {
      console.error("Express order sync failed in background:", err);
    });

    setLastCreatedOrder(orderPayload);
    onOrderCreated(orderPayload);
    onClearCart();
    setCheckoutStep('success');
    setLoading(false);
  };

  if (checkoutStep === 'success' && lastCreatedOrder) {
    return (
      <div className="px-4 py-16 max-w-xl mx-auto text-center space-y-6 font-sans animate-scale-up">
        <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border-4 border-emerald-100">
          <CheckCircle2 className="h-10 w-10 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-rose-950 font-sans">Commande Enregistrée !</h2>
          <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
            Félicitations <b>{lastCreatedOrder.customerName}</b>, votre commande <b>#{lastCreatedOrder.id}</b> a bien été transmise à notre boutique d'Abidjan.
          </p>
        </div>

        {/* Receipt Recap Block */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-sans border-b pb-2">
            Récapitulatif de livraison
          </h4>
          <div className="text-xs space-y-2 text-zinc-700">
            <p className="flex justify-between">
              <span className="text-zinc-400">Date :</span>
              <span className="font-bold">{new Date().toLocaleDateString('fr-FR')}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-zinc-400">Destinataire :</span>
              <span className="font-bold">{lastCreatedOrder.customerPhone}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-zinc-400">Lieu de livraison :</span>
              <span className="font-bold">{lastCreatedOrder.address}, {lastCreatedOrder.city}</span>
            </p>
            <p className="flex justify-between border-t pt-2 text-rose-950">
              <span className="font-black text-zinc-950">Option de Paiement :</span>
              <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg uppercase text-[10px]">
                {lastCreatedOrder.paymentMethod}
              </span>
            </p>
            <p className="flex justify-between text-sm pt-2 font-black border-t text-rose-950">
              <span>Total global avec expédition :</span>
              <span className="text-base text-rose-600 font-black">
                {lastCreatedOrder.total.toLocaleString()} FCFA
              </span>
            </p>
          </div>
        </div>

        <p className="text-[10px] text-zinc-400 font-medium">
          Notre service de livraison vous appellera sur le numéro <b>{lastCreatedOrder.customerPhone}</b> avant de dépêcher le livreur à votre porte.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setCheckoutStep('cart');
              onSwitchTab('catalog');
            }}
            className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition uppercase"
          >
            Continuer mes achats
          </button>
          
          <button
            onClick={() => {
              setCheckoutStep('cart');
              onSwitchTab('profile');
            }}
            className="px-4 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
          >
            Suivre ma commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-transparent font-sans animate-fade-in animate-duration-300">
      
      {/* HEADER SPACE */}
      <div className="bg-rose-50/15 py-6 border-b border-rose-50 px-4 md:px-8 max-w-7xl mx-auto">
        <span className="text-[10px] text-rose-500 font-extrabold font-mono tracking-widest uppercase block">
          Votre Panier local
        </span>
        <h2 className="text-xl font-black text-rose-950 font-sans mt-0.5">
          {checkoutStep === 'cart' ? 'Mon Panier d’achats' : 'Expédition & Devis de livraison'}
        </h2>
      </div>

      <div className="px-4 py-8 max-w-7xl mx-auto">
        
        {cart.length === 0 ? (
          /* Empty Basket Scenario */
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-100 p-8 max-w-md mx-auto space-y-4">
            <span className="text-4xl">🛒</span>
            <div>
              <h4 className="text-sm font-bold text-rose-950">Votre Panier est vide</h4>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto">
                Parcourez nos crèmes hydratantes, huiles pour cheveux et pommades pour les ajouter instantanément dans votre panier local.
              </p>
            </div>
            <button
              onClick={() => onSwitchTab('catalog')}
              className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow"
            >
              Découvrir nos cosmétiques
            </button>
          </div>
        ) : (
          /* Cart with items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT CONTAINER: PRODUCT LIST OR EXPEDITION FORM */}
            <div className="lg:col-span-2 space-y-6">
              
              {checkoutStep === 'cart' ? (
                /* STEP 1: ITEMS TABLE */
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {cart.length} {cart.length > 1 ? 'articles choisis' : 'article choisi'}
                    </span>
                    <button
                      onClick={onClearCart}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded-lg transition"
                    >
                      Vider tout le panier
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cart.map((item) => {
                      const displayPrice = item.product.promoPrice ? item.product.promoPrice : item.product.price;
                      return (
                        <div
                          key={item.product.id}
                          className="bg-white rounded-2xl border border-zinc-150 p-3 sm:p-4 flex gap-4 items-center justify-between"
                        >
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-zinc-50 shrink-0 border border-rose-50">
                            <img
                              referrerPolicy="no-referrer"
                              src={item.product.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-2">
                            <span className="text-[8px] font-bold text-zinc-400 font-mono block">
                              {item.product.brand}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-rose-950 truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-xs font-black text-rose-600 mt-0.5">
                              {displayPrice.toLocaleString()} F CFA
                            </p>
                          </div>

                          {/* Quantities controls */}
                          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg shrink-0">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, item.quantity - 1);
                                } else {
                                  onRemoveItem(item.product.id);
                                }
                              }}
                              className="p-1 bg-white hover:bg-zinc-50 rounded text-zinc-650"
                              title="Diminuer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold font-mono px-2 min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                onUpdateQuantity(item.product.id, item.quantity + 1);
                              }}
                              className="p-1 bg-white hover:bg-zinc-50 rounded text-zinc-650"
                              title="Augmenter"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-2 bg-red-50 hover:bg-red-100/55 rounded-lg text-red-500 shrink-0 transition"
                            title="Retirer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* STEP 2: EXPEDITION FORM */
                <form id="shipping-form-checkout" onSubmit={handleCheckoutSubmit} className="bg-white rounded-3xl border border-zinc-150 p-5 sm:p-6 space-y-5">
                  <h3 className="text-sm font-black uppercase text-rose-950 tracking-wider font-sans border-b pb-3 mb-4 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-rose-500" />
                    <span>Adresse Locale de livraison</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">
                        Nom complet pour la réception <span className="text-zinc-400 font-normal">(🔒 Fixe)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <UserIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          required
                          readOnly
                          placeholder="Nom complet"
                          value={customerName}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed select-none focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">
                        Téléphone obligatoirement joignable <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500">
                          <Phone className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="Ex: +225 07 05 98 ..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-rose-300 focus:bg-white text-zinc-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* City (with suggestions) */}
                    <div className="space-y-1.5 relative" ref={autocompleteRef}>
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">
                        Ville ou localité d'expédition <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Saisissez votre ville (ex: Cocody, Yamoussoukro...)"
                          value={cityInput}
                          onChange={(e) => {
                            setCityInput(e.target.value);
                            setCity(e.target.value); // Sync typed text
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-300 focus:bg-white"
                        />
                      </div>
                      
                      {/* Suggestions list */}
                      {showSuggestions && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-zinc-100">
                          {IVORY_COAST_CITIES.filter(c => 
                            c.name.toLowerCase().includes(cityInput.toLowerCase())
                          ).map((suggestion) => (
                            <button
                              key={suggestion.name}
                              type="button"
                              onClick={() => {
                                setCityInput(suggestion.name);
                                setCity(suggestion.name);
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-rose-50/50 flex justify-between items-center transition cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="text-rose-950 font-bold">{suggestion.name}</span>
                                <span className="text-[9px] text-zinc-400 font-normal mt-0.5">{suggestion.details}</span>
                              </div>
                              <span className="text-rose-600 font-extrabold font-mono shrink-0 bg-rose-50 px-2 py-1 rounded text-[10px]">
                                + {suggestion.fee.toLocaleString()} F
                              </span>
                            </button>
                          ))}
                          {IVORY_COAST_CITIES.filter(c => 
                            c.name.toLowerCase().includes(cityInput.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-center text-zinc-400 text-[10px] italic">
                              Aucune suggestion trouvée. Saisie libre acceptée.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Email optional */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">
                        Adresse E-mail (Reçu numérique)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          placeholder="Ex: marc@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-rose-300 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specific Address street */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block">
                      Quartier & Adresse précise (Commune, Rue, Étage, Repères) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Ex: Cocody Angré 8ème Tranche, en face de la pharmacie des allées, Immeuble K, Appt 4"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-rose-300 focus:bg-white resize-none"
                    ></textarea>
                  </div>

                  {/* PAYMENT CHOICE SELECTION */}
                  <div className="space-y-3 border-t pt-4">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 block">
                      Manière de régler :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('A la livraison');
                          setShowMobileMoneyOptions(false);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition flex justify-between items-center cursor-pointer ${
                          paymentMethod === 'A la livraison'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm ring-1 ring-rose-300'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p>🤝 Paiement à la livraison</p>
                          <p className="text-[9px] text-zinc-400 font-normal mt-0.5">Réglez sur place à la réception du colis.</p>
                        </div>
                        {paymentMethod === 'A la livraison' && <span className="text-xs">🟢</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileMoneyOptions(true);
                          if (paymentMethod === 'A la livraison') {
                            setPaymentMethod('Wave'); // Default to Wave
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition flex justify-between items-center cursor-pointer ${
                          paymentMethod !== 'A la livraison'
                            ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm ring-1 ring-rose-300'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p>📱 Mobile Money</p>
                          <p className="text-[9px] text-zinc-400 font-normal mt-0.5">
                            {['Wave', 'Orange Money', 'MTN Money', 'Moov Money'].includes(paymentMethod)
                              ? `Réseau choisi : ${paymentMethod}`
                              : "Wave, Orange Money, MTN, Moov"}
                          </p>
                        </div>
                        {paymentMethod !== 'A la livraison' && <span className="text-xs">🟢</span>}
                      </button>
                    </div>

                    {/* Mobile Money Provider selection submenu */}
                    {showMobileMoneyOptions && (
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 animate-fade-in">
                        <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">
                          Sélectionnez votre réseau de paiement :
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Wave */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Wave')}
                            className={`p-3 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'Wave'
                                ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-sm ring-1 ring-sky-300'
                                : 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-lg">🌊</span>
                            <span className="font-extrabold text-[10px]">Wave</span>
                          </button>

                          {/* Orange Money */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Orange Money')}
                            className={`p-3 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'Orange Money'
                                ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-sm ring-1 ring-orange-300'
                                : 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-lg">🍊</span>
                            <span className="font-extrabold text-[10px]">Orange Money</span>
                          </button>

                          {/* MTN Money */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('MTN Money')}
                            className={`p-3 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'MTN Money'
                                ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-300'
                                : 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-lg">🟡</span>
                            <span className="font-extrabold text-[10px]">MTN Money</span>
                          </button>

                          {/* Moov Money */}
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Moov Money')}
                            className={`p-3 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'Moov Money'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm ring-1 ring-emerald-300'
                                : 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-lg">🟢</span>
                            <span className="font-extrabold text-[10px]">Moov Money</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-4 flex items-center justify-between border-t gap-4">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="px-5 py-3 bg-zinc-150 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition"
                    >
                      Retourner au Panier
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition uppercase flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Filiation en cours...</span>
                        </>
                      ) : (
                        <span>Confirmer Ma Commande (CFA)</span>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

            {/* RIGHT SIDEBAR: ORDER BILL RECAP */}
            <div className="space-y-4">
              <div id="cart-total-bill-panel" className="bg-zinc-50 rounded-3xl border border-zinc-150 p-5 sm:p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b pb-3 font-sans">
                  Devis & Calcul
                </h3>

                <div className="text-xs space-y-2.5 text-zinc-650">
                  <div className="flex justify-between font-normal">
                    <span>Sous-total articles :</span>
                    <span className="font-bold text-zinc-850">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  
                  <div className="flex justify-between font-normal items-start">
                    <div>
                      <span>Frais d'expédition :</span>
                      {city ? (
                        <span className="block text-[9px] text-emerald-600 font-bold mt-0.5">✓ {city}</span>
                      ) : (
                        <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">⚠️ Sélectionnez votre ville</span>
                      )}
                    </div>
                    <span className="font-bold text-zinc-850">
                      {city ? `${deliveryFee.toLocaleString()} FCFA` : "—"}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed bg-white border p-3 rounded-xl">
                    🏢 Abidjan / Communes: <b>1 500 FCFA</b> (Livreur moto, 24h)<br/>
                    🌍 Intérieur (Bouaké, Yamoussoukro etc.): <b>3 000 FCFA</b> (Dépôt gare ou colis, 48h)
                  </p>

                  <div className="border-t border-zinc-150 pt-3 flex justify-between text-rose-950 font-black text-sm">
                    <span>Total final à payer :</span>
                    <span className="text-base text-rose-600 font-black">{totalCost.toLocaleString()} FCFA</span>
                  </div>
                  {!city && (
                    <p className="text-[9px] text-center text-amber-600 font-medium bg-amber-50 rounded-lg p-2 leading-relaxed">
                      💡 Veuillez choisir une ville pour inclure les frais d'expédition au total.
                    </p>
                  )}
                </div>

                {checkoutStep === 'cart' && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onRequireLogin();
                        } else {
                          setCheckoutStep('checkout');
                        }
                      }}
                      className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 text-white font-extrabold text-xs rounded-xl shadow transition active:scale-95 text-center flex justify-center items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                    >
                      <span>Passer la Commande</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
                
              </div>

              {/* Secure order checkout guarantee card */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex items-center space-x-2.5">
                <span className="text-lg">🛡️</span>
                <p className="text-[10px] text-emerald-800 leading-normal font-medium">
                  Votre achat est 100% protégé. Nous acceptons le règlement sur place en espèces à la livraison une fois que vous avez touché le produit cosmétique.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
