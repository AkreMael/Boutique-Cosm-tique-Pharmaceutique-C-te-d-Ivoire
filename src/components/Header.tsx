import React from 'react';
import { ShoppingBag, MessageSquare, ShieldCheck, Sparkles, ShoppingCart, LogOut, LogIn } from 'lucide-react';
import { User as AppUser, CartItem } from '../types';

interface HeaderProps {
  currentUser: AppUser | null;
  cart: CartItem[];
  cartCount: number;
  onLogout: () => void;
  onOpenCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  adminViewMode?: 'admin' | 'client';
  setAdminViewMode?: (mode: 'admin' | 'client') => void;
  onLoginClick?: () => void;
}

export default function Header({
  currentUser,
  cart,
  cartCount,
  onLogout,
  onOpenCart,
  activeTab,
  setActiveTab,
  adminViewMode = 'admin',
  setAdminViewMode,
  onLoginClick
}: HeaderProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white border-b border-rose-100 shadow-sm font-sans">
      {/* Top Banner Contextual */}
      <div className="bg-rose-950 text-rose-50 px-4 py-2 text-xs font-sans font-medium flex justify-between items-center tracking-wide">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Boutique Centrale Abidjan — Expédition Côte d'Ivoire 24h/48h</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span>Monnaie: CFA (XOF)</span>
          <span>Service Client: (+225) 07 05 05 26 32</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo / Title */}
          <div 
            onClick={() => {
              if (!currentUser || currentUser.role === 'client' || adminViewMode === 'client') {
                setActiveTab('catalog');
              }
            }} 
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="h-11 w-11 rounded-full bg-rose-500 flex items-center justify-center shadow-md shadow-rose-200">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans text-rose-950 tracking-tight leading-none animate-fade-in">
                Akwaba <span className="text-rose-500">Beauté</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Boutique Cosmétique & Soins</p>
            </div>
          </div>

          {/* Navigation Links for Client vs Admin */}
          {(!currentUser || currentUser.role === 'client' || adminViewMode === 'client') ? (
            <nav className="hidden md:flex space-x-1 lg:space-x-2 items-center">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setAdminViewMode?.('admin')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-black bg-zinc-950 hover:bg-zinc-900 text-white flex items-center space-x-1 shadow-xs border border-zinc-800 transition mr-2.5 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>CONSOLES ADMIN</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-rose-50 text-rose-950 font-semibold border border-rose-100'
                    : 'text-zinc-600 hover:text-rose-950 hover:bg-zinc-50'
                }`}
              >
                Catalogue Produits
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'diagnostic'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-600 hover:text-rose-950 hover:bg-rose-50/50'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Questionnaire Beauté</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 relative cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-rose-50 text-rose-950 font-semibold border border-rose-100'
                    : 'text-zinc-600 hover:text-rose-950 hover:bg-zinc-50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Conseils & Messagerie</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center space-x-2 bg-zinc-50 p-1 rounded-full border border-zinc-200">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-zinc-950 text-white flex items-center space-x-1.5 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>CONSOLE ADMINISTRATEUR</span>
              </span>
              <button
                onClick={() => {
                  setAdminViewMode?.('client');
                  setActiveTab('catalog');
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-rose-950 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition whitespace-nowrap cursor-pointer"
              >
                Aperçu Boutique (Client)
              </button>
            </nav>
          )}

          {/* Right Area: Session Details & Cart & Logout */}
          <div className="flex items-center space-x-4">
            
            {/* Shopping Cart Button - seen by Clients or Admin in preview mode */}
            {(!currentUser || currentUser.role === 'client' || adminViewMode === 'client') && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-full bg-rose-50 text-rose-950 hover:bg-rose-100 transition-colors border border-rose-200/50 cursor-pointer"
                aria-label="Voir le panier"
              >
                <ShoppingCart className="h-5 w-5 text-rose-950" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-2 ml-1">
                <div className="h-9 w-9 rounded-full bg-zinc-200 border-2 border-rose-200 flex items-center justify-center text-rose-950 font-bold text-xs shadow-sm overflow-hidden select-none">
                  {currentUser.role === 'client' ? (
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" className="h-full w-full object-cover" alt="Profile" />
                  ) : (
                    <div className="bg-zinc-950 text-white w-full h-full flex items-center justify-center font-bold font-sans">M</div>
                  )}
                </div>
                <div className="hidden lg:block text-left select-none">
                  <p className="text-xs font-semibold leading-none text-rose-950">{currentUser.name}</p>
                  <p className="text-[10px] uppercase font-mono font-medium text-rose-500 mt-0.5">{currentUser.role === 'admin' ? 'Administrateur' : 'Client'}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-full flex items-center space-x-1.5 shadow transition active:scale-95 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Se connecter</span>
              </button>
            )}

            {/* Logout Action */}
            {currentUser && (
              <button
                onClick={onLogout}
                title="Se déconnecter"
                className="p-2.5 rounded-full bg-zinc-100 text-zinc-650 hover:bg-red-50 hover:text-red-700 transition border border-zinc-200/50 flex items-center justify-center hover:shadow-sm cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation bar - seen by Clients or Admin in preview mode */}
        {(!currentUser || currentUser.role === 'client' || adminViewMode === 'client') && (
          <div className="flex md:hidden items-center justify-center space-x-2 py-3 border-t border-rose-50">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setAdminViewMode?.('admin')}
                className="px-2.5 py-1.5 rounded-full text-[10px] font-black bg-zinc-950 text-white flex items-center space-x-1 cursor-pointer"
              >
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>ADMIN</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                activeTab === 'catalog' ? 'bg-rose-50 text-rose-900 font-semibold' : 'text-zinc-600'
              }`}
            >
              Catalogues
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 cursor-pointer ${
                activeTab === 'diagnostic' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white' : 'text-zinc-600'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Diagnostic</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 cursor-pointer ${
                activeTab === 'chat' ? 'bg-rose-50 text-rose-900 font-semibold' : 'text-zinc-600'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Conseils</span>
            </button>
          </div>
        )}

        {currentUser?.role === 'admin' && adminViewMode === 'admin' && (
          <div className="flex md:hidden items-center justify-between py-2.5 border-t border-zinc-100 px-3">
            <span className="text-[10px] font-extrabold text-zinc-950 tracking-wider flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>CONSOLE UNIQUE ADMIN : MAËL (COCODY)</span>
            </span>
            <button
              onClick={() => {
                setAdminViewMode?.('client');
                setActiveTab('catalog');
              }}
              className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-150 transition cursor-pointer"
            >
              Aperçu Boutique
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
