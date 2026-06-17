import React from 'react';
import { ShoppingBag, MessageSquare, ShieldCheck, HeartPulse, Sparkles, User, ShoppingCart, RefreshCw } from 'lucide-react';
import { User as AppUser, CartItem } from '../types';

interface HeaderProps {
  currentUser: AppUser;
  cart: CartItem[];
  cartCount: number;
  onRoleChange: (role: 'client' | 'pharmacist' | 'admin') => void;
  onOpenCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({
  currentUser,
  cart,
  cartCount,
  onRoleChange,
  onOpenCart,
  activeTab,
  setActiveTab
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-rose-100 shadow-sm">
      {/* Top Banner Contextual */}
      <div className="bg-rose-950 text-rose-50 px-4 py-2 text-xs font-sans font-medium flex justify-between items-center tracking-wide">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Boutique Centrale Abidjan — Expédition Côte d'Ivoire 24h/48h</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span>Monnaie: CFA (XOF)</span>
          <span>Service Client: (+225) 07 07 07 07 07</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo / Title */}
          <div 
            onClick={() => setActiveTab('catalog')} 
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="h-11 w-11 rounded-full bg-rose-500 flex items-center justify-center shadow-md shadow-rose-200">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans text-rose-950 tracking-tight leading-none">
                Akwaba <span className="text-rose-500">PharmaSkin</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Cosmétique & Parapharmacie</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-rose-50 text-rose-950 font-semibold'
                  : 'text-zinc-600 hover:text-rose-950 hover:bg-zinc-50'
              }`}
            >
              Catalogue Produits
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 ${
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 relative ${
                activeTab === 'chat'
                  ? 'bg-rose-50 text-rose-950 font-semibold'
                  : 'text-zinc-600 hover:text-rose-950 hover:bg-zinc-50'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Conseil Pharmacien</span>
            </button>
            
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-red-600 hover:bg-red-50 font-medium'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Panel Admin</span>
              </button>
            )}

            {currentUser.role === 'pharmacist' && (
              <button
                onClick={() => setActiveTab('pharmacist')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'pharmacist'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-emerald-700 hover:bg-emerald-50 font-medium'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Espace Praticien</span>
              </button>
            )}
          </nav>

          {/* Right Area: Interactive Session Simulation Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Quick Role Simulation Selector */}
            <div className="bg-zinc-100 p-1 rounded-xl flex items-center space-x-1 border border-zinc-200">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-500 px-2 hidden sm:inline-block">Simuler:</span>
              <button
                onClick={() => onRoleChange('client')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  currentUser.role === 'client'
                    ? 'bg-white text-rose-950 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => onRoleChange('pharmacist')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  currentUser.role === 'pharmacist'
                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Docteur
              </button>
              <button
                onClick={() => onRoleChange('admin')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  currentUser.role === 'admin'
                    ? 'bg-zinc-900 text-white shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full bg-rose-50 text-rose-950 hover:bg-rose-100 transition-colors border border-rose-200/50"
              aria-label="Voir le panier"
            >
              <ShoppingCart className="h-5 w-5 text-rose-950" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Micro User Avatar Indicator */}
            <div className="flex items-center space-x-2 ml-1">
              <div className="h-9 w-9 rounded-full bg-zinc-200 border-2 border-rose-200 flex items-center justify-center text-rose-950 font-bold text-xs shadow-sm overflow-hidden">
                {currentUser.role === 'client' ? (
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" className="h-full w-full object-cover" alt="Profile" />
                ) : currentUser.role === 'pharmacist' ? (
                  <img src="https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=150&auto=format&fit=crop" className="h-full w-full object-cover" alt="Doctor" />
                ) : (
                  <span className="text-zinc-700 bg-zinc-200 w-full h-full flex items-center justify-center">A</span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold leading-none text-rose-950">{currentUser.name}</p>
                <p className="text-[10px] uppercase font-mono font-medium text-rose-500 mt-0.5">{currentUser.role}</p>
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-center space-x-2 py-3 border-t border-rose-50">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              activeTab === 'catalog' ? 'bg-rose-50 text-rose-900 font-semibold' : 'text-zinc-600'
            }`}
          >
            Catalogues
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 ${
              activeTab === 'diagnostic' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white' : 'text-zinc-600'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Diagnostic</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
              activeTab === 'chat' ? 'bg-rose-50 text-rose-900 font-semibold' : 'text-zinc-600'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Conseils</span>
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                activeTab === 'admin' ? 'bg-zinc-900 text-white font-semibold' : 'text-red-600'
              }`}
            >
              Admin
            </button>
          )}
          {currentUser.role === 'pharmacist' && (
            <button
              onClick={() => setActiveTab('pharmacist')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                activeTab === 'pharmacist' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-700'
              }`}
            >
              Docteur
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
