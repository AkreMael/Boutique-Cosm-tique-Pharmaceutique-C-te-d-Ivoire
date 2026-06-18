import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  Clock, 
  PhoneCall, 
  Briefcase, 
  FileText, 
  AlertCircle, 
  Calendar, 
  User, 
  CheckCircle, 
  ArrowRight,
  X,
  PlusCircle,
  HelpCircle as InfoIcon
} from 'lucide-react';
import { Item, User as AppUser, Module } from '../types';
import { collection, onSnapshot, addDoc, query, where, db } from '../lib/firebase';

interface ServiceModuleProps {
  currentUser: AppUser | null;
  onRequireLogin: () => void;
}

export default function ServiceModule({ currentUser, onRequireLogin }: ServiceModuleProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedService, setSelectedService] = useState<Item | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Solicitation state (Formulaire de demande de service)
  const [applyDate, setApplyDate] = useState('');
  const [applyTime, setApplyTime] = useState('14:00');
  const [applyPhone, setApplyPhone] = useState(currentUser?.phone || '');
  const [applyDetails, setApplyDetails] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Listing publication state (Publication d'offre de service)
  const [pubTitle, setPubTitle] = useState('');
  const [pubPrice, setPubPrice] = useState('');
  const [pubDescription, setPubDescription] = useState('');
  const [pubDuration, setPubDuration] = useState('1h 00');
  const [pubType, setPubType] = useState('Soin Visage'); // Soin Visage, Capillaire, Conseils, Coaching
  const [pubImageUrl, setPubImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Real-time synchronization of services
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Item))
        .filter(item => item.moduleId === 'service');
      setItems(list);
    });
    return () => unsub();
  }, []);

  const handleApplyService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!selectedService) return;
    setIsApplying(true);

    try {
      const transactionId = `srv-${Math.floor(1000 + Math.random() * 9000)}`;

      // Save standardized transactional Order inside SQL Connect model
      const orderPayload = {
        id: transactionId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: applyPhone,
        itemId: selectedService.id,
        itemTitle: selectedService.title,
        itemPrice: selectedService.price,
        quantity: 1,
        total: selectedService.price,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'Mobile Money CI (A la séance)',
        startDate: applyDate,
        endDate: applyTime,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "orders"), orderPayload);

      // Create message to counselor
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: selectedService.ownerId || "usr-admin-mael",
        content: `👋 [DEMANDE DE PRESTATION] Sollicitation du service "${selectedService.title}". Session planifiée le ${applyDate} à ${applyTime}. Détails client: "${applyDetails}" (Contact: ${applyPhone})`,
        timestamp: new Date().toISOString(),
        orderId: transactionId
      });

      // Activity log
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Prestation sollicitée",
        details: `Formulaire de demande de service validé : ${selectedService.title}`,
        timestamp: new Date().toISOString()
      });

      // User notification
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.id,
        title: "Dossier de service initié",
        message: `Votre demande de prestation pour "${selectedService.title}" le ${applyDate} a bien été archivée.`,
        timestamp: new Date().toISOString(),
        read: false
      });

      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        setShowApplyModal(false);
        setSelectedService(null);
        setApplyDate('');
        setApplyDetails('');
      }, 1500);

    } catch (err) {
      console.error("Apply service mistake:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handlePublishService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    const priceNum = Number(pubPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Veuillez saisir un prix valide.");
      return;
    }
    setIsPublishing(true);

    try {
      let finalImg = pubImageUrl.trim();
      if (!finalImg) {
        if (pubType === 'Capillaire') {
          finalImg = "https://images.unsplash.com/photo-1527799881356-1177961ee291?q=80&w=600&auto=format&fit=crop";
        } else if (pubType === 'Conseils') {
          finalImg = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
        } else {
          finalImg = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop";
        }
      }

      const metadataObj = {
        duration: pubDuration,
        type: pubType,
        rating: 5.0,
        provider: currentUser.name
      };

      const newItem = {
        title: pubTitle,
        price: priceNum,
        status: 'AVAILABLE',
        description: pubDescription,
        images: [finalImg],
        metadata: JSON.stringify(metadataObj),
        moduleId: 'service',
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone,
        dateAdded: new Date().toISOString()
      };

      await addDoc(collection(db, "items"), newItem);

      // Add to logs
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Création d'offre de service",
        details: `Ajout du service "${pubTitle}" (Durée : ${pubDuration}) dans la base.`,
        timestamp: new Date().toISOString()
      });

      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setShowPublishModal(false);
        setPubTitle('');
        setPubPrice('');
        setPubDescription('');
        setPubImageUrl('');
      }, 1500);

    } catch (err) {
      console.error("Publish service errored:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div id="service-module-section" className="bg-rose-50/10 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner with listing introduction */}
        <div className="bg-gradient-to-r from-zinc-900 to-rose-950 text-white rounded-[2rem] p-6 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#be123c_0%,transparent_35%)] opacity-25 pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-rose-50/15 text-rose-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/20">
              <Sparkles className="h-3 w-3" />
              <span>Soin sur-mesure & Dermo-esthétique assisté</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Nos Soins & Prestations de Services Spécialisés</h1>
            <p className="text-xs md:text-sm text-zinc-100/80 leading-relaxed font-normal">
              Prenez rendez-vous directement pour des soins dermatologiques, de la coiffure, du conseil dermo-cosmétique ou du coaching bien-être à Abidjan avec validation sécurisée.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (!currentUser) onRequireLogin();
                  else setShowPublishModal(true);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Publier une Offre de Prestation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Displaying service cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => {
            const meta = item.metadata ? JSON.parse(item.metadata) : {};
            return (
              <div key={item.id} className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-4">
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-zinc-100">
                    <img 
                      src={item.images?.[0] || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"} 
                      className="h-full w-full object-cover" 
                      alt={item.title} 
                    />
                    <div className="absolute top-3 left-3 bg-rose-950/80 px-2.5 py-1 rounded-full text-[9px] font-black text-rose-50 tracking-wider">
                      {meta.type || 'Soin Corps'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-rose-950 font-sans leading-tight">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-normal line-clamp-3">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-300" />
                      <span>{meta.duration || '45 mins'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-zinc-300" />
                      <span>Prestataire : {meta.provider || 'Akwaba Expert'}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-zinc-100 mt-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">Tarif de séance</span>
                    <span className="text-sm font-extrabold text-rose-950">{item.price.toLocaleString()} XOF</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        onRequireLogin();
                      } else {
                        setSelectedService(item);
                        setShowApplyModal(true);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-zinc-900 to-rose-950 text-white font-extrabold text-[10px] tracking-wide uppercase rounded-xl transition hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>Solliciter</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SOLLICITATION MODAL (Formulaire de demande de service) */}
      <AnimatePresence>
        {showApplyModal && selectedService && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div onClick={() => { setShowApplyModal(false); setSelectedService(null); }} className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs cursor-pointer"></div>
            <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-rose-50 p-6 md:p-8 relative"
              >
                <button
                  onClick={() => { setShowApplyModal(false); setSelectedService(null); }}
                  className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-650 transition cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="text-center mb-4">
                  <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-2">
                    <Briefcase className="h-6 w-6" />
                  </span>
                  <h3 className="text-base font-bold text-rose-950">Formulaire de Demande de Prestation</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Demande pour : "{selectedService.title}"</p>
                </div>

                {applySuccess ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-emerald-800">Demande de prestation enregistrée avec succès !</p>
                    <p className="text-[11px] text-zinc-500">Un pharmacien expert-conseil examinera votre dossier.</p>
                  </div>
                ) : (
                  <form onSubmit={handleApplyService} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-650 text-xs font-bold">Sélectionner Date *</label>
                        <input
                          type="date"
                          required
                          value={applyDate}
                          onChange={(e) => setApplyDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-650 text-xs font-bold">Heure d'intervention *</label>
                        <input
                          type="time"
                          required
                          value={applyTime}
                          onChange={(e) => setApplyTime(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-650 text-xs font-bold">Téléphone de contact direct *</label>
                      <input
                        type="text"
                        required
                        placeholder="+225 07..."
                        value={applyPhone}
                        onChange={(e) => setApplyPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-650 text-xs font-bold">Détaillez vos besoins d'intervention dermo-cosmétique *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Quels sont les symptômes, le type de peau ou d'accompagnement souhaité ?"
                        value={applyDetails}
                        onChange={(e) => setApplyDetails(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isApplying}
                      className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow cursor-pointer active:scale-95 mt-4"
                    >
                      <span>{isApplying ? "Enregistrement en cours..." : "Valider mon rendez-vous de prestation"}</span>
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLISH SERVICE OFFER MODAL (Publication des annonces) */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div onClick={() => setShowPublishModal(false)} className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs cursor-pointer"></div>
            <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl border border-rose-50 p-6 md:p-8 relative"
              >
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="text-center mb-4">
                  <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-2">
                    <Briefcase className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-bold text-rose-950">Publication d'Offre de Prestation de Service</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Formulaire de mise en ligne de prestations validées.
                  </p>
                </div>

                {publishSuccess ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-emerald-800">L'offre de prestation a bien été approuvée et enregistrée !</p>
                    <p className="text-[11px] text-zinc-500">Mise en ligne temps réel effective.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePublishService} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-600 text-xs font-bold">Dénomination du service *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Massage Facial & Modelage Hydratant Karité"
                        value={pubTitle}
                        onChange={(e) => setPubTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Catégorie d'activité *</label>
                        <select
                          value={pubType}
                          onChange={(e) => setPubType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer"
                        >
                          <option value="Soin Visage">Soin Visage / Derme</option>
                          <option value="Capillaire">Coiffure & Cheveux</option>
                          <option value="Conseils">Conseil Consultatif</option>
                          <option value="Coaching">Coaching Corps</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Durée estimée *</label>
                        <select
                          value={pubDuration}
                          onChange={(e) => setPubDuration(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer"
                        >
                          <option value="30 mins">30 minutes</option>
                          <option value="1h 00">1 heure</option>
                          <option value="1h 30">1h 30</option>
                          <option value="2h 00">2 heures</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Tarif de séance (XOF) *</label>
                        <input
                          type="number"
                          required
                          placeholder="ex: 12000"
                          value={pubPrice}
                          onChange={(e) => setPubPrice(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Image d'illustration (URL)</label>
                        <input
                          type="text"
                          placeholder="Laisser vide pour auto-alimenter"
                          value={pubImageUrl}
                          onChange={(e) => setPubImageUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-600 text-xs font-bold">Déroulement et consignes cliniques *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Expliquez comment se déroule la séance, le matériel requis et les contre-indications..."
                        value={pubDescription}
                        onChange={(e) => setPubDescription(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPublishing}
                      className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow cursor-pointer active:scale-95 mt-4"
                    >
                      <span>{isPublishing ? "Création..." : "Enregistrer la Prestation en base"}</span>
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
