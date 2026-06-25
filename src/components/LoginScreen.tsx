import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, User, Smartphone, MapPin, KeyRound, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { User as AppUser } from '../types';

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
  isModal?: boolean;
}

export default function LoginScreen({ onLogin, isModal = false }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [error, setError] = useState<string | null>(null);

  // Client forms
  const [clientName, setClientName] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Admin forms
  const [adminName, setAdminName] = useState('');
  const [adminCity, setAdminCity] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Only allow plus, space, and numbers
    const clean = value.replace(/[^\d+ ]/g, '');
    return clean;
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientCity.trim() || !clientPhone.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // Checking if it matches administrator!
    // Exact Admin credentials: Nom: Maël, Ville: Cocody, Numéro: 07 05 05 26 32
    const normalName = clientName.trim().toLowerCase();
    const normalCity = clientCity.trim().toLowerCase();
    const normalNum = clientPhone.replace(/\+225/g, '').replace(/\s+/g, ''); // strip prefix +225 and spaces

    const targetNum = "0705052632";

    if (
      (normalName === "mael" || normalName === "maël") &&
      normalCity === "cocody" &&
      normalNum === targetNum
    ) {
      const adminUser: AppUser = {
        id: 'usr-admin-mael',
        name: 'Maël',
        phone: '07 05 05 26 32',
        email: 'mael@cosmetiques.ci',
        city: 'Cocody',
        address: 'Cocody, Abidjan',
        role: 'admin'
      };
      onLogin(adminUser);
      return;
    }

    // Normal client phone checks
    const digitsOnly = clientPhone.replace(/\+225/g, '').replace(/\s+/g, '');
    if (digitsOnly.length !== 10 || isNaN(Number(digitsOnly))) {
      setError("Format incorrect. Le numéro de téléphone doit être de 10 chiffres (ex: +225 0700000000).");
      return;
    }

    if (!clientPhone.startsWith('+225')) {
      setError("L'indicatif +225 de la Côte d'Ivoire est obligatoire.");
      return;
    }

    const normalizedPhone = `+225${digitsOnly}`;

    // Dynamically derive username under-the-hood to match the exact 3 fields specified
    const derivedUsername = clientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

    // Creating the client user structure
    const appUser: AppUser = {
      id: `usr-client-${Date.now()}`,
      name: clientName.trim(),
      username: derivedUsername,
      phone: normalizedPhone,
      email: `${derivedUsername}@cosmetiques.ci`,
      city: clientCity.trim(),
      address: `${clientCity.trim()}, Côte d'Ivoire`,
      role: 'client'
    };

    onLogin(appUser);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalName = adminName.trim().toLowerCase();
    const normalCity = adminCity.trim().toLowerCase();
    const normalNum = adminPhone.trim().replace(/\s+/g, ''); // strip spaces for robust comparison

    // Expected Admin info: Nom: Maël, Ville: Cocody, Numéro: 07 05 05 26 32
    const targetNum = "0705052632";
    const targetNumWithPrefix = "+2250705052632";

    if (
      normalName === "mael" &&
      normalCity === "cocody" &&
      (normalNum === targetNum || normalNum === targetNumWithPrefix || normalNum === "0705052632")
    ) {
      const adminUser: AppUser = {
        id: 'usr-admin-mael',
        name: 'Maël',
        phone: '07 05 05 26 32',
        email: 'mael@cosmetiques.ci',
        city: 'Cocody',
        address: 'Cocody, Abidjan',
        role: 'admin'
      };
      onLogin(adminUser);
    } else {
      setError("Informations d'identification administrateur incorrectes. Accès refusé.");
    }
  };

  const formContent = (
    <motion.div 
      initial={{ opacity: 0, y: isModal ? 0 : 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full ${isModal ? 'bg-white space-y-6' : 'max-w-md bg-white border border-rose-100/70 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 space-y-8'}`}
    >
      {/* Header Branding */}
      <div className="text-center space-y-2.5">
        <div className="mx-auto h-14 w-14 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-rose-950 font-sans tracking-tight leading-tight">
            Omi'i Institut
          </h2>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
            Boutique Cosmétique & Soins • CI
          </p>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="bg-zinc-100 p-1.5 rounded-2xl flex items-center border border-zinc-200/50">
        <button
          type="button"
          onClick={() => { setActiveTab('client'); setError(null); }}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'client'
              ? 'bg-white text-rose-950 shadow-sm border border-rose-50'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Portail Client</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('admin'); setError(null); }}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'admin'
              ? 'bg-zinc-950 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Commandement Admin</span>
        </button>
      </div>

      {/* Error Alert Box */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-650 font-medium leading-relaxed"
        >
          {error}
        </motion.div>
      )}

      {/* Dynamic Forms */}
      {activeTab === 'client' ? (
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Nom complet *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="ex: Kouassi Amenan"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Ville *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="ex: Abidjan, Yamoussoukro, Bouaké..."
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Numéro de téléphone CI *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Smartphone className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="+225 0700000000"
                value={clientPhone}
                onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition font-mono"
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block mt-1">Format obligatoire: +225 suivi de 10 chiffres. Graceful verification active.</span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow active:scale-95 cursor-pointer mt-6"
          >
            <span>Entrer sur la Boutique</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl text-[11px] text-zinc-500 leading-relaxed max-w-sm">
            🔑 L'administration d'Omi'i Institut requiert une authentification unique. Renseignez vos clés de console exclusives.
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Nom de l'administrateur *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Entrer le nom"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Ville administrative *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Entrer la ville"
                value={adminCity}
                onChange={(e) => setAdminCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-650 text-xs font-bold font-sans">Numéro d'accès *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="07 00 00 00 00"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow active:scale-95 cursor-pointer mt-6"
          >
            <span>Déverrouiller le Pupitre</span>
            <ShieldCheck className="h-4 w-4" />
          </button>
        </form>
      )}
    </motion.div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div id="auth-portal" className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 selection:bg-rose-100 font-sans">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_right,#ffe4e6_0%,transparent_40%)] opacity-70 pointer-events-none"></div>
      {formContent}
    </div>
  );
}
