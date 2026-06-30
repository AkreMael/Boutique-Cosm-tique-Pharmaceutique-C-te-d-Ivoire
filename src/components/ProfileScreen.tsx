import React, { useState } from 'react';
import { User as UserIcon, MapPin, Phone, History, LogOut, ClipboardList, Shield, RefreshCw, CheckCircle, Package, Truck, Calendar, Trash2 } from 'lucide-react';
import { User as AppUser, Order } from '../types';
import LoginScreen from './LoginScreen';

interface ProfileScreenProps {
  currentUser: AppUser | null;
  orders: Order[];
  onLogin: (user: AppUser) => void;
  onLogout: () => void;
  onSwitchTab: (tab: string) => void;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export default function ProfileScreen({
  currentUser,
  orders,
  onLogin,
  onLogout,
  onSwitchTab,
  onDeleteOrder
}: ProfileScreenProps) {
  // Unpack or filter orders specific to this logged in client
  const myOrders = orders.filter((o) => o.userId === currentUser?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Confirmée': return 'bg-blue-50 text-blue-600 border-blue-105';
      case 'Préparation': return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'En livraison': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Livrée': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-zinc-50 text-zinc-550 border-zinc-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente': return '⏳';
      case 'Confirmée': return '✅';
      case 'Préparation': return '📦';
      case 'En livraison': return '🚚';
      case 'Livrée': return '🎉';
      default: return '📄';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen pb-24 bg-transparent flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-rose-100 p-8 rounded-[2.5rem] shadow-xl text-center space-y-6 animate-scale-up">
          <div className="h-14 w-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <UserIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-950 font-sans">Espace Mon Profil</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs mx-auto font-normal">
              Veuillez vous identifier pour accéder à vos rituels, suivre vos commandes et éditer votre fiche d'Abidjan.
            </p>
          </div>
          <LoginScreen onLogin={onLogin} isModal={true} />
        </div>
      </div>
    );
  }

  return (
    <div id="profile-container-content" className="pb-24 bg-transparent font-sans animate-fade-in animate-duration-300">
      
      {/* PROFILE HEADER CARD */}
      <div className="bg-rose-50/15 py-12 border-b border-rose-100/50 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar block with initial text */}
            <div className="h-18 w-18 rounded-full bg-rose-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-rose-200">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-rose-950">{currentUser.name}</h3>
              <p className="text-xs text-rose-500 font-extrabold uppercase tracking-widest font-mono">
                {currentUser.role === 'admin' ? "Administrateur Principal" : "Client Privilégié"}
              </p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-xs text-zinc-500 font-medium justify-center sm:justify-start">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-zinc-400" /> {currentUser.city}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" /> {currentUser.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-red-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* BODY CONTENT CONTAINER */}
      <div className="px-4 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CLIENT RECAP PARAMETERS CARD */}
          <div className="bg-zinc-50 rounded-3xl border border-zinc-150 p-6 space-y-6 shadow-xs h-fit">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b pb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-rose-500" />
              <span>Dossier Coordonnées</span>
            </h4>

            <div className="space-y-4 text-xs font-medium text-zinc-700">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider font-mono">Nom Complet :</span>
                <p className="p-2.5 bg-white border rounded-xl text-zinc-800 font-bold">{currentUser.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider font-mono">Résidence :</span>
                <p className="p-2.5 bg-white border rounded-xl text-zinc-800 font-semibold">{currentUser.city}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider font-mono">Mobile :</span>
                <p className="p-2.5 bg-white border rounded-xl text-zinc-800 font-mono font-bold">{currentUser.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider font-mono">E-mail boutique :</span>
                <p className="p-2.5 bg-white border rounded-xl text-zinc-650 truncate">{currentUser.email || "Non renseigné"}</p>
              </div>
            </div>

            {currentUser.skinProfile && (
              <div className="mt-6 p-4 bg-rose-50/25 border border-rose-100 rounded-2xl space-y-3">
                <h5 className="text-[11px] font-black text-rose-950 uppercase tracking-widest flex items-center gap-1.5">
                  ✨ Diagnostic Peau Actif :
                </h5>
                <div className="text-[11px] space-y-1 text-zinc-600">
                  <p>• Type de Peau : <b className="text-rose-900">{currentUser.skinProfile.skinType}</b></p>
                  <p>• Cheveux : <b className="text-rose-900">{currentUser.skinProfile.hairType}</b></p>
                  <p className="line-clamp-2">• Priorités : <b>{currentUser.skinProfile.concerns.join(', ')}</b></p>
                </div>
              </div>
            )}
          </div>

          {/* HISTORIQUE COMMANDES */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-sm font-black uppercase text-rose-950 tracking-wider flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-rose-500" />
                <span>Mes Commandes en cours & Historique</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-black bg-zinc-100 px-2.5 py-1 rounded-lg">
                Abidjan fret
              </span>
            </div>

            {myOrders.length > 0 ? (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-zinc-150 overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    {/* Top summary row of Order */}
                    <div className="bg-zinc-50/65 px-4.5 py-4 border-b flex flex-wrap justify-between items-center gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">
                          Référence de commande :
                        </span>
                        <h5 className="text-xs font-black text-zinc-900">
                          #{order.id}
                        </h5>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <span className="font-mono text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          {new Date(order.date).toLocaleDateString('fr-FR')}
                        </span>
                        
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </span>

                        {order.status === 'Annulée' && (
                          <button
                            onClick={() => {
                              if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande définitivement ?")) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                            title="Supprimer la commande"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order items lists details */}
                    <div className="p-4.5 space-y-3">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-3 justify-between items-center text-xs">
                            <div className="flex gap-2.5 items-center min-w-0">
                              <div className="h-10 w-10 rounded-lg overflow-hidden bg-zinc-50 shrink-0 border">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="font-semibold text-zinc-800 truncate max-w-xs">{item.name}</span>
                            </div>
                            <span className="text-zinc-405 shrink-0">
                              {item.quantity} x {item.price.toLocaleString()} F
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total bill & destination summary */}
                      <div className="border-t pt-3.5 flex flex-wrap justify-between items-center gap-3 text-xs">
                        <p className="text-zinc-500 font-medium">
                          Expédié à <b>{order.address}, {order.city}</b> ({order.customerPhone})
                        </p>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold block uppercase">TOTAL RÉGLÉ :</span>
                          <span className="text-sm font-black text-rose-600">
                            {order.total.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              /* No Orders history empty state */
              <div className="text-center py-16 bg-zinc-50 border border-zinc-150 rounded-3xl p-6 space-y-4">
                <span className="text-3xl">🛒</span>
                <div>
                  <h5 className="text-xs font-bold text-rose-950">Aucun achat enregistré</h5>
                  <p className="text-[10px] text-zinc-410 leading-normal max-w-xs mx-auto mt-1">
                    Les commandes que vous passerez sur la boutique apparaîtront ici en temps réel afin de surveiller leur expédition depuis le stock principal.
                  </p>
                </div>
                <button
                  onClick={() => onSwitchTab('catalog')}
                  className="px-4.5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs rounded-xl"
                >
                  Faire un premier achat
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
