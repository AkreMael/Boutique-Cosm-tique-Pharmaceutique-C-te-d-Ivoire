import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Smartphone, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  History, 
  CreditCard, 
  CheckCircle, 
  Send, 
  Lock, 
  Hourglass,
  Bell,
  Check
} from 'lucide-react';
import { User, ActivityLog, UserModuleAccess, Module, Notification } from '../types';
import { doc, updateDoc, collection, addDoc, getDocs, query, where, onSnapshot } from '../lib/firebase';
import { db } from '../lib/firebase';

interface ProfileModuleProps {
  currentUser: User | null;
  onUpdateProfile?: (updated: User) => void;
  modules?: Module[];
  onRequireLogin?: () => void;
}

export default function ProfileModule({ currentUser, onUpdateProfile, modules }: ProfileModuleProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [profilePicture, setProfilePicture] = useState(currentUser?.profilePicture || '');
  
  // Verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Subscriptions & History states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [moduleAccess, setModuleAccess] = useState<UserModuleAccess[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedSubModule, setSelectedSubModule] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load subscriptions, activities and notifications for current user
  useEffect(() => {
    if (!currentUser) return;

    // Direct Firestore continuous subscriptions
    const unsubLogs = onSnapshot(
      query(collection(db, "activityLogs"), where("userId", "==", currentUser.id)),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityLogs(list);
      }
    );

    const unsubAccess = onSnapshot(
      query(collection(db, "userModuleAccess"), where("userId", "==", currentUser.id)),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserModuleAccess));
        setModuleAccess(list);
      }
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, "notifications"), where("userId", "==", currentUser.id)),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(list);
      }
    );

    return () => {
      unsubLogs();
      unsubAccess();
      unsubNotifs();
    };
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedUser: User = {
        ...currentUser,
        name,
        phone,
        email,
        city,
        address,
        profilePicture: profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop'
      };

      // Save to Firestore
      await updateDoc(doc(db, "users", currentUser.id), {
        name,
        phone,
        email,
        city,
        address,
        profilePicture: updatedUser.profilePicture
      });

      // Add audit log
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Mise à jour profil",
        details: "Mise à jour des informations personnelles de profile.",
        timestamp: new Date().toISOString()
      });

      onUpdateProfile(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save profile mistake:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setOtpError('');
    setIsVerifying(true);
    try {
      // Simulate code sending over SMS gateway
      setTimeout(() => {
        setSmsSent(true);
        setIsVerifying(false);
      }, 1000);
    } catch {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!currentUser) return;
    setOtpError('');
    setIsVerifying(true);

    // Accept standard test OTP "123456" or any 6 digit input for high convenience simulation
    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setOtpError("Le code doit contenir exactement 6 chiffres d'authentification.");
      setIsVerifying(false);
      return;
    }

    try {
      // Save status
      await updateDoc(doc(db, "users", currentUser.id), {
        isPhoneVerified: true
      });

      // Add internal log
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Vérification OTP passée",
        details: `Vérification du numéro de téléphone ${phone} validée avec succès.`,
        timestamp: new Date().toISOString()
      });

      // Send greeting notification
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.id,
        title: "Numéro de téléphone vérifié",
        message: "Félicitations ! Votre numéro est à présent entièrement validé pour la sécurité du portail.",
        timestamp: new Date().toISOString(),
        read: false
      });

      const updatedUser = {
        ...currentUser,
        isPhoneVerified: true
      };
      onUpdateProfile(updatedUser);

      setTimeout(() => {
        setIsVerifying(false);
        setShowVerifyModal(false);
        setSmsSent(false);
        setOtpCode('');
      }, 800);

    } catch (err) {
      console.error("OTP verification crash:", err);
      setOtpError("Erreur interne lors de la validation. Veuillez réessayer.");
      setIsVerifying(false);
    }
  };

  const handleRequestSubscription = async (moduleId: string) => {
    if (!currentUser) return;
    try {
      const accessId = `${currentUser.id}_${moduleId}`;
      
      await addDoc(collection(db, "userModuleAccess"), {
        userId: currentUser.id,
        moduleId,
        accessLevel: 'PENDING_SUBSCRIBED'
      });

      // Activity log
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Demande d'abonnement",
        details: `Demande d'accès au module : ${modules.find(m => m.id === moduleId)?.name || moduleId}`,
        timestamp: new Date().toISOString()
      });

      // Send notice
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.id,
        title: "Demande d'abonnement enregistrée",
        message: `Votre demande d'abonnement pour le module ${modules.find(m => m.id === moduleId)?.name || moduleId} est en attente de validation admin.`,
        timestamp: new Date().toISOString(),
        read: false
      });

    } catch (err) {
      console.error("Subscription issue:", err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    } catch (err) {
      console.error("Notification marking err:", err);
    }
  };

  return (
    <div id="user-profile-module" className="bg-rose-50/10 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Banner Welcome */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-rose-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative h-20 w-20 rounded-full border-4 border-rose-200 shadow-sm overflow-hidden bg-zinc-100 flex items-center justify-center">
              <img 
                src={currentUser?.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop'} 
                className="h-full w-full object-cover" 
                alt="Avatar" 
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-rose-950 font-sans tracking-tight">{currentUser?.name || "Client Privé"}</h2>
                {currentUser?.isPhoneVerified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-150">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Vérifié</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-150">
                    <Hourglass className="h-3 w-3" />
                    <span>Non Vérifié</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{currentUser?.email}</p>
              <p className="text-[10px] uppercase font-mono bg-zinc-100 px-2 py-0.5 rounded-md inline-block text-zinc-500 font-bold mt-2">
                Rôle : {currentUser?.role === 'admin' ? 'Administrateur' : 'Client standard'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!currentUser?.isPhoneVerified && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-full flex items-center space-x-2 shadow transition active:scale-95 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Vérifier mon numéro</span>
              </button>
            )}
            <button
              onClick={handleMarkAllNotificationsAsRead}
              className="px-5 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-650 font-bold text-xs rounded-full flex items-center space-x-2 transition cursor-pointer"
            >
              <Bell className="h-4 w-4 text-zinc-400" />
              <span>Marquer alertes lues ({notifications.filter(n => !n.read).length})</span>
            </button>
          </div>
        </div>

        {/* Triple Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main profile form card */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-md border border-zinc-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
              <UserIcon className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider">Fiche d'Information Personnelle</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Numéro Téléphone</label>
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-400 cursor-not-allowed font-mono"
                  />
                  <span className="text-[10px] text-zinc-400 block mt-1">Non modifiable pour la sécurité d'accès.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Adresse Courriel (Email)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Avatar Photo de Profil (URL)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Ville de Résidence</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-600 text-xs font-bold font-sans">Adresse de livraison domiciliaire</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-700 font-medium rounded-xl text-xs flex items-center space-x-1.5 shadow-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Votre fiche de profil a été mise à jour et enregistrée avec succès !</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3.5 bg-rose-950 hover:bg-rose-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer shadow active:scale-95"
              >
                <span>{isSaving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}</span>
              </button>
            </form>
          </div>

          {/* Module subscription & control card */}
          <div className="bg-white rounded-[2rem] shadow-md border border-zinc-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <CreditCard className="h-4 w-4 text-zinc-650" />
              <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider">Abonnements & Accès aux Modules</h3>
            </div>

            <div className="space-y-4">
              {modules.map(mod => {
                const userAccess = moduleAccess.find(a => a.moduleId === mod.id);
                return (
                  <div key={mod.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-rose-950">{mod.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Type de service : {mod.type} • Status : {mod.status}</p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {userAccess ? (
                        userAccess.accessLevel === 'GRANTED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-emerald-150">
                            <Check className="h-3 w-3" />
                            <span>Accès Autorisé</span>
                          </span>
                        ) : userAccess.accessLevel === 'PENDING_SUBSCRIBED' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-amber-150">
                            <ClockIcon />
                            <span>En Validation</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-red-150">
                            <Lock className="h-3 w-3" />
                            <span>Refusé</span>
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => handleRequestSubscription(mod.id)}
                          className="px-3.5 py-1.5 bg-rose-50 text-rose-900 border border-rose-150 text-[10px] font-black uppercase rounded-lg transition hover:bg-rose-100 cursor-pointer"
                        >
                          S'abonner / Demander Accès
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Audit Log / History and notifications pane */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Notifications Alerts */}
          <div className="bg-white rounded-[2rem] shadow-md border border-zinc-100 p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-zinc-400 animate-swing" />
              <span>Dernières alertes & notifications</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  Aucune notification active pour le moment.
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition ${notif.read ? 'bg-zinc-50/50 border-zinc-150 text-zinc-500' : 'bg-rose-50/40 border-rose-100 text-rose-950 font-medium shadow-2xs'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-900">{notif.title}</span>
                      <span className="text-[9px] font-mono text-zinc-400">{new Date(notif.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-600">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Logs history */}
          <div className="bg-white rounded-[2rem] shadow-md border border-zinc-100 p-6 md:p-8 space-y-4">
            <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-4 w-4 text-zinc-400" />
              <span>Historique d'activité de navigation</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activityLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  Aucune activité enregistrée sur votre compte.
                </div>
              ) : (
                activityLogs.map(log => (
                  <div key={log.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-150 text-xs flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shadow"></div>
                    <div>
                      <div className="font-bold text-zinc-700">{log.action}</div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{log.details}</p>
                      <span className="text-[9px] font-mono text-zinc-400 mt-1 block">
                        {new Date(log.timestamp).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Verification OTP Modal Dialog */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-55 overflow-y-auto font-sans">
            <div onClick={() => setShowVerifyModal(false)} className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs cursor-pointer"></div>
            <div className="flex items-center justify-center min-h-screen p-4 z-59 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-rose-50 p-6 md:p-8 relative"
              >
                <div className="text-center mb-6">
                  <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-3">
                    <Smartphone className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-bold text-rose-950">Vérification de Numéro</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Nous allons valider votre numéro de Côte d'Ivoire {phone} grâce à une vérification par message OTP sécurisé.
                  </p>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-100/50 border border-red-200 text-xs text-red-650 font-semibold rounded-xl text-center mb-4">
                    {otpError}
                  </div>
                )}

                {smsSent ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-600 text-xs font-bold font-sans text-center">Entrez le code à 6 chiffres reçu :</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-widest px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-lg font-extrabold focus:outline-none focus:border-rose-450 focus:bg-white text-zinc-800 transition"
                      />
                    </div>

                    <button
                      onClick={handleVerifyOTP}
                      disabled={isVerifying}
                      className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow cursor-pointer active:scale-95"
                    >
                      <span>{isVerifying ? "Validation..." : "Valider le Code OTP"}</span>
                    </button>

                    <button
                      onClick={handleSendVerificationCode}
                      className="text-xs text-rose-600 font-bold block mx-auto py-1 hover:underline cursor-pointer"
                    >
                      Renvoyer le code SMS OTP
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={isVerifying}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow cursor-pointer active:scale-95"
                  >
                    <span>{isVerifying ? "Envoi du SMS..." : "Recevoir mon Code OTP"}</span>
                    <Send className="h-4 w-4" />
                  </button>
                )}

                <p className="text-[10px] text-zinc-400 text-center mt-5 font-mono leading-relaxed max-w-xs mx-auto">
                  Note : Vous pouvez renseigner un code factice à 6 chiffres quelconque (ex: 123456) pour valider l'OTP sous environnement d'évaluation.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Mini clock helper to avoid missing import errors
function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
