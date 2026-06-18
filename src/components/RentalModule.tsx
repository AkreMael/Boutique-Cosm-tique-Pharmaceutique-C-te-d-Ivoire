import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  BedDouble, 
  Sparkles, 
  Calendar, 
  PlusCircle, 
  DollarSign, 
  Image as ImageIcon,
  CheckCircle, 
  Search,
  ChevronRight,
  Calculator,
  X,
  Smartphone,
  Info
} from 'lucide-react';
import { Item, User, Module } from '../types';
import { collection, onSnapshot, addDoc, query, where, db } from '../lib/firebase';

interface RentalModuleProps {
  currentUser: User | null;
  onRequireLogin: () => void;
}

export default function RentalModule({ currentUser, onRequireLogin }: RentalModuleProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  
  // Modals / forms toggle states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Listing publication form state (Formulaire immobilier)
  const [pubTitle, setPubTitle] = useState('');
  const [pubPrice, setPubPrice] = useState('');
  const [pubDescription, setPubDescription] = useState('');
  const [pubType, setPubType] = useState('Appartement'); // Appartement, Villa, Bureau, Équipement
  const [pubLocation, setPubLocation] = useState('');
  const [pubRooms, setPubRooms] = useState('2');
  const [pubImageUrl, setPubImageUrl] = useState('');
  const [pubStatus, setPubStatus] = useState('A Louer'); // A Louer, A Vendre
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Booking form state (Formulaire de location)
  const [bookStartDate, setBookStartDate] = useState('');
  const [bookEndDate, setBookEndDate] = useState('');
  const [bookGuests, setBookGuests] = useState('1');
  const [bookClientNote, setBookClientNote] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Load real-time rental listings from collection(db, "items")
  useEffect(() => {
    // We synchronize all items. We can filter the ones loaded where moduleId === "rental"
    const unsub = onSnapshot(collection(db, "items"), (snap) => {
      const list = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Item))
        .filter(item => item.moduleId === 'rental');
      setItems(list);
    });
    return () => unsub();
  }, []);

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setErrorMsg('');
    setIsPublishing(true);

    const priceNum = Number(pubPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setIsPublishing(false);
      setErrorMsg("Veuillez entrer un montant valide supérieur à 0 XOF.");
      return;
    }

    try {
      // Prefill cool Unsplash images based on property type
      let finalImg = pubImageUrl.trim();
      if (!finalImg) {
        if (pubType === 'Villa') {
          finalImg = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop";
        } else if (pubType === 'Bureau') {
          finalImg = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop";
        } else if (pubType === 'Équipement') {
          finalImg = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop";
        } else {
          finalImg = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop";
        }
      }

      // Format SQL Connect metadata format
      const metadataObj = {
        type: pubType,
        rooms: pubType === 'Équipement' ? 0 : Number(pubRooms),
        location: pubLocation,
        status: pubStatus,
        wifi: true,
        parking: true
      };

      const newItemPayload = {
        title: pubTitle,
        price: priceNum,
        status: 'AVAILABLE',
        description: pubDescription,
        images: [finalImg],
        metadata: JSON.stringify(metadataObj),
        moduleId: 'rental',
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        ownerPhone: currentUser.phone,
        dateAdded: new Date().toISOString()
      };

      // Add to Firestore collection "items"
      await addDoc(collection(db, "items"), newItemPayload);

      // Audit Log
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Publication d'annonce",
        details: `Ajout d'une nouvelle annonce immobilière : ${pubTitle} (${pubLocation})`,
        timestamp: new Date().toISOString()
      });

      // Send System alert
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.id,
        title: "Annonce immobilière publiée",
        message: `Votre bien "${pubTitle}" est à présent visible sur le portail sous la catégorie ${pubType}.`,
        timestamp: new Date().toISOString(),
        read: false
      });

      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setShowPublishModal(false);
        // Clear forms
        setPubTitle('');
        setPubPrice('');
        setPubDescription('');
        setPubLocation('');
        setPubImageUrl('');
      }, 1500);

    } catch (err) {
      console.error("Publishing property error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!selectedItem) return;
    setIsBooking(true);

    try {
      // Create unified transactions of Order category inside Firestore
      const totalAmount = (selectedItem.price * Number(bookGuests));
      const orderId = `loc-${Math.floor(1000 + Math.random() * 9000)}`;

      const bookingPayload = {
        id: orderId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        itemId: selectedItem.id,
        itemTitle: selectedItem.title,
        itemPrice: selectedItem.price,
        quantity: Number(bookGuests),
        total: totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'Mobile Money CI (A la confirmation)',
        startDate: bookStartDate,
        endDate: bookEndDate,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "orders"), bookingPayload);

      // Save Message to owner or system inbox to enable Peer conversations
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: selectedItem.ownerId || "usr-admin-mael",
        content: `👋 [RÉSERVATION LOCATIVE] Intéressé(e) par l'annonce "${selectedItem.title}". Réservation demandée du ${bookStartDate} au ${bookEndDate} (${bookGuests} personne(s)). Note client: "${bookClientNote}"`,
        timestamp: new Date().toISOString(),
        orderId
      });

      // Log historical step
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Réservation logée",
        details: `Réservation formulée pour le bien "${selectedItem.title}" représentant ${totalAmount} XOF`,
        timestamp: new Date().toISOString()
      });

      // Push notify
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.id,
        title: "Demande de location initiée",
        message: `Votre demande de réservation pour "${selectedItem.title}" a bien été transmise à l'annonceur.`,
        timestamp: new Date().toISOString(),
        read: false
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setShowBookingModal(false);
        setSelectedItem(null);
        setBookStartDate('');
        setBookEndDate('');
        setBookClientNote('');
      }, 1500);

    } catch (err) {
      console.error("Booking transactional error:", err);
    } finally {
      setIsBooking(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  // Filtering listings locally
  const filteredItems = items.filter(item => {
    const meta = item.metadata ? JSON.parse(item.metadata) : {};
    const matchesCategory = selectedCategory === 'Tous' || meta.type === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (meta.location && meta.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = item.price <= maxPrice;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  return (
    <div id="rental-module-section" className="bg-rose-50/10 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner with listing introduction */}
        <div className="bg-rose-950 text-white rounded-[2rem] p-6 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f43f5e_0%,transparent_35%)] opacity-35 pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-350 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30">
              <Building2 className="h-3 w-3" />
              <span>Module Biens & Immobilier de Côte d'Ivoire</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Trouvez un Logement de Rêve ou Louez vos Équipements</h1>
            <p className="text-xs md:text-sm text-rose-100/85 leading-relaxed font-normal">
              Accédez à nos dizaines d'offres de studios meublés, appartements haut standing, villas avec piscine à Abidjan/Cocody et partout en Côte d'Ivoire. Enregistrement rapide dans notre base de données sécurisée.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!currentUser) onRequireLogin();
                  else setShowPublishModal(true);
                }}
                className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-950 font-black text-xs rounded-full flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-rose-600" />
                <span>Publier une Annonce Immobilière</span>
              </button>
            </div>
          </div>
        </div>

        {/* Searching & Filtering Controls */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Input keyword */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par titre, quartier (ex: Cocody, Angré, Marcory...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-205 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-400 focus:bg-white transition"
              />
            </div>

            {/* Price slider */}
            <div className="w-full md:w-72 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-650">
                <span>Budget Maximum</span>
                <span className="text-rose-950 font-extrabold text-xs">{maxPrice.toLocaleString()} XOF</span>
              </div>
              <input
                type="range"
                min={20000}
                max={1500000}
                step={20000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-150 rounded-lg appearance-none cursor-pointer accent-rose-950"
              />
            </div>

          </div>

          {/* Sliced Categories Navigation Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {['Tous', 'Appartement', 'Villa', 'Bureau', 'Équipement'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                  selectedCategory === category
                    ? 'bg-rose-950 text-white border-rose-950'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-650'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Listings display grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-150/50">
            <Info className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-400">Aucun appartement ou bien disponible avec ces critères.</p>
            <p className="text-xs text-zinc-300 mt-1">Vous pouvez publier votre propre annonce immobilière pour étoffer l'offre !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => {
              const meta = item.metadata ? JSON.parse(item.metadata) : {};
              return (
                <motion.div
                  layout
                  key={item.id}
                  className="bg-white rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden bg-zinc-100">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop'}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      alt={item.title}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-rose-950/90 text-white text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full shadow-sm">
                        {meta.status || 'A Louer'}
                      </span>
                    </div>
                    {meta.rooms > 0 && (
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10px] font-extrabold text-zinc-800 shadow-sm">
                        <BedDouble className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{meta.rooms} Pcs</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-[10px] uppercase tracking-wider">
                        <Building2 className="h-3 w-3" />
                        <span>{meta.type || 'Résidence'}</span>
                      </div>
                      <h3 className="text-xs font-black text-rose-950 leading-snug line-clamp-1">{item.title}</h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-normal">{item.description}</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">Tarif indiqué</span>
                        <span className="font-extrabold text-sm text-rose-950 font-sans">{item.price.toLocaleString()} XOF</span>
                        {meta.status !== 'A Vendre' && <span className="text-[10px] text-zinc-400">/mois</span>}
                      </div>

                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onRequireLogin();
                          } else {
                            setSelectedItem(item);
                            setShowBookingModal(true);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-rose-900 to-rose-950 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-xs transition hover:brightness-110 active:scale-95 cursor-pointer"
                      >
                        Réserver / Visite
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* PUBLISH PROPERTY/EQUIPMENT Listing MODAL (Formulaire immobilier / Publication des annonces) */}
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

                <div className="text-center mb-6">
                  <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-2">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-bold text-rose-950">Publication d'Annonce Immobilière / Matériel</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Formulaire immobilier agréé. Veuillez saisir les informations de votre bien locatif pour enregistrement en base.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-100/50 border border-red-250 text-xs text-red-650 font-bold rounded-xl text-center mb-4">
                    {errorMsg}
                  </div>
                )}

                {publishSuccess ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-emerald-800">Votre annonce a bien été transmise et archivée dans la base !</p>
                    <p className="text-xs text-zinc-500">Mise en ligne en temps réel active.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePublishListing} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-zinc-600 text-xs font-bold">Titre descriptif de l'annonce *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Studio Américain Climatise Cocody Angré"
                        value={pubTitle}
                        onChange={(e) => setPubTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Type de Bien *</label>
                        <select
                          value={pubType}
                          onChange={(e) => setPubType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer"
                        >
                          <option value="Appartement">Appartement</option>
                          <option value="Villa">Villa / Résidence</option>
                          <option value="Bureau">Bureau / Local</option>
                          <option value="Équipement">Équipement locatif</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Nature Offre *</label>
                        <select
                          value={pubStatus}
                          onChange={(e) => setPubStatus(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer"
                        >
                          <option value="A Louer">À Louer (Location)</option>
                          <option value="A Vendre">À Vendre (Achat)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Prix de l'annonce (en XOF) *</label>
                        <input
                          type="number"
                          required
                          placeholder="ex: 150000"
                          value={pubPrice}
                          onChange={(e) => setPubPrice(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Quartier / Localisation *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Cocody Mermoz, Abidjan"
                          value={pubLocation}
                          onChange={(e) => setPubLocation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Pièces minimum (si Immo)</label>
                        <select
                          value={pubRooms}
                          onChange={(e) => setPubRooms(e.target.value)}
                          disabled={pubType === 'Équipement'}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400"
                        >
                          <option value="1">1 Pièce (Studio)</option>
                          <option value="2">2 Pièces</option>
                          <option value="3">3 Pièces</option>
                          <option value="4">4 Pièces et plus</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-600 text-xs font-bold">Illustration Photo (URL)</label>
                        <input
                          type="text"
                          placeholder="Laisser vide pour auto-générer"
                          value={pubImageUrl}
                          onChange={(e) => setPubImageUrl(e.target.value)}
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-600 text-xs font-bold">Description complète et atouts *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Précisez les points clés : climatisation, sécurité, accès, caution..."
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
                      <span>{isPublishing ? "Mise en base..." : "Publier l'Annonce dans la Base SQL Connect"}</span>
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* BOOKING MODAL (Formulaire de location) */}
      <AnimatePresence>
        {showBookingModal && selectedItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <div onClick={() => { setShowBookingModal(false); setSelectedItem(null); }} className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs cursor-pointer"></div>
            <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl border border-rose-50 p-6 md:p-8 relative"
              >
                <button
                  onClick={() => { setShowBookingModal(false); setSelectedItem(null); }}
                  className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-650 transition cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="text-center mb-4">
                  <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-2">
                    <Calendar className="h-6 w-6" />
                  </span>
                  <h3 className="text-base font-bold text-rose-950 leading-relaxed">Formulaire de Réservation Immobilière</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Pour le bien : "{selectedItem.title}"</p>
                </div>

                {bookingSuccess ? (
                  <div className="p-6 text-center space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-emerald-800">Demande de location transmise avec succès !</p>
                    <p className="text-[11px] text-zinc-500">Un espace d'échange avec l'annonceur a été automatiquement ouvert.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-650 text-xs font-bold">Débute le *</label>
                        <input
                          type="date"
                          required
                          value={bookStartDate}
                          onChange={(e) => setBookStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-650 text-xs font-bold">Se termine le *</label>
                        <input
                          type="date"
                          required
                          value={bookEndDate}
                          onChange={(e) => setBookEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-zinc-650 text-xs font-bold">Personnes</label>
                        <select
                          value={bookGuests}
                          onChange={(e) => setBookGuests(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition cursor-pointer"
                        >
                          <option value="1">1 Personne</option>
                          <option value="2">2 Personnes</option>
                          <option value="3">3 Personnes</option>
                          <option value="4">Famille (4+)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-zinc-400 text-xs font-mono select-none">Total estimé</label>
                        <div className="px-3 py-2 bg-zinc-50 border border-zinc-150 rounded-xl text-xs font-black text-rose-950 font-mono">
                          {((selectedItem.price * Number(bookGuests))).toLocaleString()} XOF
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-zinc-650 text-xs font-bold">Consignes particulières pour l'hôte *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Heure d'arrivée estimée ou questions sur les charges..."
                        value={bookClientNote}
                        onChange={(e) => setBookClientNote(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isBooking}
                      className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow cursor-pointer active:scale-95 mt-4"
                    >
                      <span>{isBooking ? "Transmission..." : "Valider mon dossier de location"}</span>
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
