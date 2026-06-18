import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Coins, Users, ShoppingBag, Plus, Trash2, Edit, Check, Eye, X, 
  RotateCw, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, Truck, Ban, CheckCheck,
  FolderOpen, MessageSquare, Globe, ToggleLeft, ToggleRight, List, Shield, History, MapPin, Smartphone
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Product, Order, ChatSession, User as AppUser, AdminStats, Category, ChatMessage, Module, Item, UserModuleAccess, ActivityLog } from '../types';
import PharmacistChat from './PharmacistChat';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs, db, query, where } from '../lib/firebase';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  users: AppUser[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id' | 'dateAdded'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  currentUser: AppUser;
  chats: ChatSession[];
  messages: ChatMessage[];
  onSendMessage: (text: string, attachProdId?: string) => Promise<void>;
  onSendPharmacistPrescription: (chatId: string, productId: string) => Promise<void>;
  onAddToCart: (product: Product) => void;
}

export default function AdminPanel({
  products,
  orders,
  users,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  currentUser,
  chats,
  messages,
  onSendMessage,
  onSendPharmacistPrescription,
  onAddToCart
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'stats' | 'orders' | 'products' | 'promos' | 'categories' | 'messages' | 'modules' | 'items' | 'users' | 'logs'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // SQL Connect custom administrator collections
  const [modules, setModules] = useState<Module[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [moduleAccess, setModuleAccess] = useState<UserModuleAccess[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Continuous listener hooks for SQL Connect databases
  useEffect(() => {
    // 1. Modules
    const unsubModules = onSnapshot(collection(db, "modules"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
      setModules(list);
    });

    // 2. Items
    const unsubItems = onSnapshot(collection(db, "items"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(list);
    });

    // 3. All Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setAllUsers(list);
    });

    // 4. Access rights
    const unsubAccess = onSnapshot(collection(db, "userModuleAccess"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserModuleAccess));
      setModuleAccess(list);
    });

    // 5. Activity Logs
    const unsubLogs = onSnapshot(collection(db, "activityLogs"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(list);
    });

    return () => {
      unsubModules();
      unsubItems();
      unsubUsers();
      unsubAccess();
      unsubLogs();
    };
  }, []);

  // Operation Handlers for Admin Dashboard
  const handleToggleModuleStatus = async (moduleId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateDoc(doc(db, "modules", moduleId), { status: nextStatus });
      
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Changement de statut module/service",
        details: `Le module ${moduleId} a été basculé à : ${nextStatus}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Module toggle err:", err);
    }
  };

  const handleDeleteListingItem = async (itemId: string, itemTitle: string) => {
    if (!window.confirm(`Confirmez-vous la destitution complète de l'annonce "${itemTitle}" de la base de données ?`)) return;
    try {
      await deleteDoc(doc(db, "items", itemId));
      
      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Suppression d'annonce",
        details: `L'annonce "${itemTitle}" a été destituée définitivement de la base.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Delete listing err:", err);
    }
  };

  const handleUpdateUserRole = async (userId: string, userName: string, currentRole: string) => {
    const roles: ('client' | 'pharmacist' | 'admin' | 'agent')[] = ['client', 'pharmacist', 'admin', 'agent'];
    const nextIndex = (roles.indexOf(currentRole as any) + 1) % roles.length;
    const nextRole = roles[nextIndex];

    try {
      await updateDoc(doc(db, "users", userId), { role: nextRole });

      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Altération privilège rôle",
        details: `Le rôle de ${userName} a été altéré de "${currentRole}" vers "${nextRole}"`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Changing role err:", err);
    }
  };

  const handleToggleAccessLevel = async (accessId: string, currentLevel: string) => {
    try {
      const nextLevel = currentLevel === 'GRANTED' ? 'DENIED' : 'GRANTED';
      await updateDoc(doc(db, "userModuleAccess", accessId), { accessLevel: nextLevel });

      await addDoc(collection(db, "activityLogs"), {
        userId: currentUser.id,
        userName: currentUser.name,
        action: "Abonnement statut altéré",
        details: `Autorisation d'accès d'un utilisateur a été basculée à : ${nextLevel}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Access change err:", err);
    }
  };

  // New product form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(5000);
  const [prodPromo, setProdPromo] = useState<number | undefined>(undefined);
  const [prodStock, setProdStock] = useState(20);
  const [prodImg, setProdImg] = useState('https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop');
  const [prodCat, setProdCat] = useState('soins-visage');
  const [prodBrand, setProdBrand] = useState('PharmaPure CI');



  // Create or update promotion form state
  const [promoProductId, setPromoProductId] = useState('');
  const [promoPercentage, setPromoPercentage] = useState(15);

  // New category form states
  const [catNameInput, setCatNameInput] = useState('');
  const [catSlugInput, setCatSlugInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    if (!catNameInput || !catSlugInput) {
      setCatError('Le nom et le slug de la catégorie sont requis.');
      return;
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: catSlugInput.toLowerCase().trim().replace(/\s+/g, '-'),
          name: catNameInput.trim(),
          description: catDescInput.trim(),
          icon: 'Sparkles'
        })
      });
      if (res.ok) {
        setCatSuccess('Catégorie ajoutée avec succès !');
        setCatNameInput('');
        setCatSlugInput('');
        setCatDescInput('');
      } else {
        const data = await res.json();
        setCatError(data.error || 'Erreur lors de la création');
      }
    } catch {
      setCatError('Une erreur réseau est survenue.');
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    setCatError('');
    setCatSuccess('');
    try {
      const res = await fetch(`/api/categories/${slug}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCatSuccess('Catégorie supprimée avec succès !');
      } else {
        const data = await res.json();
        setCatError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setCatError('Une erreur réseau est survenue.');
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/statistics');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
    } catch {
      // Offline fallback calculation for prototype
      const mockStats: AdminStats = {
        ordersCount: orders.length,
        revenue: orders.filter((o) => o.status !== 'Annulée').reduce((sum, o) => sum + o.total, 0),
        conversionRate: 6.8,
        newCustomers: users.filter((u) => u.role === 'client').length,
        popularProducts: products.slice(0, 4).map((p) => ({
          name: p.name,
          sales: Math.floor(Math.random() * 8) + 3,
          revenue: p.price * (Math.floor(Math.random() * 5) + 2)
        })),
        salesByDay: [
          { day: '12 Juin', amount: 35000 },
          { day: '13 Juin', amount: 52000 },
          { day: '14 Juin', amount: 48000 },
          { day: '15 Juin', amount: 75000 },
          { day: '16 Juin', amount: 98000 },
          { day: '17 Juin', amount: 112000 }
        ]
      };
      setStats(mockStats);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [orders, products]);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProduct) {
      onUpdateProduct({
        ...editProduct,
        name: prodName,
        description: prodDesc,
        price: prodPrice,
        promoPrice: prodPromo || undefined,
        stock: prodStock,
        images: [prodImg],
        category: prodCat,
        brand: prodBrand
      });
    } else {
      onAddProduct({
        name: prodName,
        description: prodDesc,
        price: prodPrice,
        promoPrice: prodPromo || undefined,
        stock: prodStock,
        images: [prodImg],
        category: prodCat,
        brand: prodBrand,
        isAvailable: prodStock > 0
      });
    }
    
    // reset form
    setEditProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(5000);
    setProdPromo(undefined);
    setProdStock(20);
    setProdCat('soins-visage');
    setShowProductModal(false);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdPromo(p.promoPrice);
    setProdStock(p.stock);
    setProdImg(p.images[0]);
    setProdCat(p.category);
    setProdBrand(p.brand);
    setShowProductModal(true);
  };



  const handleApplyPromoAction = () => {
    const p = products.find((prod) => prod.id === promoProductId);
    if (p) {
      const discount = Math.round(p.price * (1 - promoPercentage / 100));
      onUpdateProduct({
        ...p,
        promoPrice: discount
      });
      setPromoProductId('');
    }
  };

  return (
    <div id="admin-backoffice-section" className="py-8 bg-zinc-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-rose-100 gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-rose-950 font-sans tracking-tight">Console de Gestion (Boutique)</h2>
            <p className="text-zinc-500 text-xs mt-1">Gérez le catalogue des articles de soins cosmétiques, validez les expéditions et configurez les promotions.</p>
          </div>

          {/* Tab Submenu */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAdminTab('stats')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'stats' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Statistiques</span>
            </button>
            <button
              onClick={() => setAdminTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'orders' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Commandes ({orders.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('products')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'products' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Articles ({products.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('categories')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'categories' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Catégories ({categories.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('promos')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'promos' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <span>Promos & Réductions</span>
            </button>
            <button
              onClick={() => setAdminTab('users')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'users' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Clients & Diagnostics ({users.filter(u => u.role !== 'admin').length})</span>
            </button>
            <button
              onClick={() => setAdminTab('messages')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                adminTab === 'messages' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Messages / Chats ({chats.length})</span>
            </button>

          </div>
        </div>

        {/* ==================================== */}
        {/* TAB 1: ANALYTICS & STATS MODULE     */}
        {/* ==================================== */}
        {adminTab === 'stats' && stats && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Metric 1 */}
              <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">Chiffres d'Affaires</p>
                  <p className="text-xl font-black text-rose-950 mt-1">{stats.revenue.toLocaleString()} F CFA</p>
                  <p className="text-[9px] text-zinc-400 mt-1">Cumulé sur les ventes payées</p>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">Total Commandes</p>
                  <p className="text-xl font-black text-rose-950 mt-1">{stats.ordersCount} fiches</p>
                  <p className="text-[9px] text-emerald-600 mt-1 font-semibold">Taux de rétention élevé</p>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">Nouveaux Clients</p>
                  <p className="text-xl font-black text-rose-950 mt-1">{stats.newCustomers} inscrits</p>
                  <p className="text-[9px] text-zinc-400 mt-1">En provenance d'Abidjan & San Pedro</p>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="bg-white p-5 rounded-3xl border border-rose-50 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">Taux de Conversion</p>
                  <p className="text-xl font-black text-rose-950 mt-1">{stats.conversionRate} %</p>
                  <p className="text-[9px] text-zinc-400 mt-1">Basé sur les soumissions de quiz</p>
                </div>
              </div>

            </div>

            {/* Recharts Graphical charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sales Growth Line graph (CFA CFA) */}
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm lg:col-span-2">
                <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-rose-950 mb-4">Évolution Temporelle des Ventes (CFA)</h4>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.salesByDay}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                      <YAxis style={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                      <Tooltip formatter={(value) => [`${value} CFA`, 'Revenu']} />
                      <Area type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Seller list */}
              <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-rose-950 mb-4 text-left">Cosmétiques les Plus Vendus</h4>
                  
                  <div className="space-y-4">
                    {stats.popularProducts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-rose-50">
                        <div className="min-w-0 pr-3">
                          <p className="font-bold text-zinc-800 truncate leading-normal">{p.name}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{p.sales} unités écoulées</p>
                        </div>
                        <span className="font-extrabold text-rose-800 whitespace-nowrap">{p.revenue.toLocaleString()} CFA</span>
                      </div>
                    ))}

                    {stats.popularProducts.length === 0 && (
                      <p className="text-zinc-400 text-xs text-center py-10">Aucune commande validée pour le moment.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setAdminTab('products')}
                  className="w-full mt-4 py-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-950 font-bold text-xs rounded-xl"
                >
                  Gérer l'inventaire complet
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 2: ORDER MANAGEMENT DISPATCHBOARD */}
        {/* ==================================== */}
        {adminTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden animate-fade-in">
            
            <div className="px-6 py-5 border-b border-rose-50 flex justify-between items-center bg-rose-50/20">
              <h3 className="font-extrabold text-rose-950 text-sm">Régulation du Pipeline Logistique</h3>
              <button 
                onClick={fetchStats}
                className="p-1.5 rounded-full hover:bg-rose-100 text-zinc-500 hover:text-rose-950 transition"
                title="Actualiser la liste"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider border-b border-rose-100">
                    <th className="py-4 px-6">ID Commande</th>
                    <th className="py-4 px-6">Acheteur / Contact</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Lieu d'Exp édition</th>
                    <th className="py-4 px-6 text-right">Montant</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Actions Logistiques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50/50 text-xs text-zinc-700">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-zinc-50/50">
                      <td className="py-4.5 px-6 font-mono font-bold text-rose-950">{ord.id}</td>
                      <td className="py-4.5 px-6">
                        <p className="font-bold">{ord.customerName}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{ord.customerPhone}</p>
                      </td>
                      <td className="py-4.5 px-6 text-zinc-500">
                        {new Date(ord.date).toLocaleDateString()}
                      </td>
                      <td className="py-4.5 px-6 font-medium">
                        {ord.city}
                      </td>
                      <td className="py-4.5 px-6 text-right font-extrabold text-rose-800">
                        {ord.total.toLocaleString()} CFA
                      </td>
                      <td className="py-4.5 px-6 text-center">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase inline-block ${
                          ord.status === 'Livrée' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'En livraison' ? 'bg-indigo-100 text-indigo-800' :
                          ord.status === 'Préparation' ? 'bg-amber-100 text-amber-800' :
                          ord.status === 'Annulée' ? 'bg-red-100 text-red-800' :
                          'bg-zinc-100 text-zinc-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      
                      {/* Interactive Stage triggers */}
                      <td className="py-4.5 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {ord.status === 'En attente' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Confirmée')}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-[9px] uppercase"
                            >
                              Confirmer
                            </button>
                          )}
                          {ord.status === 'Confirmée' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Préparation')}
                              className="px-2 py-1 bg-yellow-105 text-amber-800 rounded font-bold text-[9px] uppercase border"
                            >
                              Préparer
                            </button>
                          )}
                          {ord.status === 'Préparation' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'En livraison')}
                              className="px-2 py-1 bg-indigo-600 text-white rounded font-bold text-[9px] uppercase flex items-center space-x-1"
                            >
                              <Truck className="h-3 w-3 inline" />
                              <span>Expédier</span>
                            </button>
                          )}
                          {ord.status === 'En livraison' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Livrée')}
                              className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[9px] uppercase"
                            >
                              Terminer
                            </button>
                          )}
                          {ord.status !== 'Livrée' && ord.status !== 'Annulée' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Annulée')}
                              className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold text-[9px] uppercase"
                              title="Annuler"
                            >
                              Annuler
                            </button>
                          )}
                          {(ord.status === 'Livrée' || ord.status === 'Annulée') && (
                            <span className="text-[10px] text-zinc-400 font-mono">— Clôturée</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 font-normal">
                        Aucune commande enregistrée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* TAB 3: PRODUCTS INVENTORY DIRECTORY */}
        {/* ==================================== */}
        {adminTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {/* Options bar */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditProduct(null);
                  setProdName('');
                  setProdDesc('');
                  setProdPrice(5000);
                  setProdStock(20);
                  setShowProductModal(true);
                }}
                className="px-5 py-3 bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Ajouter un Cosmétique</span>
              </button>
            </div>

            {/* List products panel */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider border-b border-rose-100">
                      <th className="py-4 px-6">Visuel</th>
                      <th className="py-4 px-6">Dénomination produit</th>
                      <th className="py-4 px-6">Catégorie</th>
                      <th className="py-4 px-6">Marque</th>
                      <th className="py-4 px-6 text-right">Prix</th>
                      <th className="py-4 px-6 text-center">Stock</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50/50 text-xs text-zinc-700">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-6">
                          <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded-xl border border-rose-50" />
                        </td>
                        <td className="py-3 px-6 font-bold text-rose-950 max-w-[280px]">
                          <p className="truncate" title={p.name}>{p.name}</p>
                          <p className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">{p.description}</p>
                        </td>
                        <td className="py-3 px-6 font-mono capitalize">{p.category.replace('-', ' ')}</td>
                        <td className="py-3 px-6">{p.brand}</td>
                        <td className="py-3 px-6 text-right font-extrabold text-rose-800">
                          {p.promoPrice ? (
                            <span className="text-rose-600 block">{p.promoPrice.toLocaleString()} CFA <span className="text-[9px] text-zinc-400 line-through block font-normal">{p.price} CFA</span></span>
                          ) : (
                            <span>{p.price.toLocaleString()} CFA</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center font-bold text-xs">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] ${
                            p.stock === 0 ? 'bg-red-50 text-red-600' :
                            p.stock <= 5 ? 'bg-amber-50 text-amber-600' :
                            'bg-zinc-50 text-zinc-700'
                          }`}>
                            {p.stock} pces
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-zinc-500 hover:text-rose-950 hover:bg-zinc-100 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Retirer complètement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRODUCT MODAL FORMULA */}
            {showProductModal && (
              <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
                <div onClick={() => setShowProductModal(false)} className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs"></div>
                <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 text-left border border-rose-100">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h4 className="font-bold text-rose-950 text-sm">
                        {editProduct ? 'Modifier la Fiche Article' : 'Créer un Produit Cosmétique'}
                      </h4>
                      <button onClick={() => setShowProductModal(false)} className="p-1 text-zinc-400 hover:text-rose-950">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Nom du produit *</label>
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="ex: Lait exfoliant doux Éburnie"
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Description thérapeutique *</label>
                        <textarea
                          rows={2}
                          required
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="Composition dermatologique, bienfaits..."
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-700 font-bold mb-1">Prix régulier (CFA) *</label>
                          <input
                            type="number"
                            required
                            value={prodPrice}
                            onChange={(e) => setProdPrice(parseInt(e.target.value))}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-bold mb-1">Prix promotionnel (CFA)</label>
                          <input
                            type="number"
                            value={prodPromo || ''}
                            onChange={(e) => setProdPromo(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Optionnel"
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-700 font-bold mb-1">Marque & Informations complémentaires *</label>
                          <input
                            type="text"
                            required
                            placeholder="ex: Gamme Naturelle de Côte d'Ivoire"
                            value={prodBrand}
                            onChange={(e) => setProdBrand(e.target.value)}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-bold mb-1">Stock disponible *</label>
                          <input
                            type="number"
                            required
                            value={prodStock}
                            onChange={(e) => setProdStock(parseInt(e.target.value))}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Catégorie d'étalage *</label>
                        <select
                          value={prodCat}
                          onChange={(e) => setProdCat(e.target.value)}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        >
                          {categories.filter((c) => c.slug !== 'promotions').map((category) => (
                            <option key={category.slug} value={category.slug}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Lien d'image de présentation *</label>
                        <input
                          type="text"
                          required
                          value={prodImg}
                          onChange={(e) => setProdImg(e.target.value)}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowProductModal(false)}
                          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-xl"
                        >
                          {editProduct ? 'Sauvegarder' : 'Ajouter le produit'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {/* ==================================== */}
        {/* TAB 5: MANAGING TEMPORARY PROMOTIONS */}
        {/* ==================================== */}
        {adminTab === 'promos' && (
          <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-6 animate-fade-in text-xs font-sans">
            <div>
              <h3 className="font-extrabold text-rose-950 text-sm mb-1">Appliquer des Réductions d'Étalage</h3>
              <p className="text-zinc-500 mb-4">Créez des remises instantanées sur votre stock d'articles cosmétiques.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-zinc-700 font-bold mb-1.5">1. Sélectionner le produit *</label>
                <select
                  value={promoProductId}
                  onChange={(e) => setPromoProductId(e.target.value)}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl"
                >
                  <option value="">Sélectionner</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} CFA)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1.5">2. Taux de Réduction (%) *</label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={promoPercentage}
                  onChange={(e) => setPromoPercentage(parseInt(e.target.value))}
                  className="w-full p-3 bg-white border border-zinc-200 rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyPromoAction}
                disabled={!promoProductId}
                className="w-full py-3.5 bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs rounded-xl disabled:opacity-50"
              >
                Appliquer le prix promotionnel
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 mb-3.5 block">Articles Déjà En Promotion :</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter((p) => p.promoPrice !== undefined).map((p) => {
                  const pct = Math.round(((p.price - (p.promoPrice || p.price)) / p.price) * 100);
                  return (
                    <div key={p.id} className="p-4 rounded-xl bg-rose-50/10 border border-rose-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-rose-950 text-xs truncate max-w-[170px]">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Normal: {p.price} CFA • Promo: <span className="text-rose-700 font-extrabold">{p.promoPrice} CFA</span></p>
                      </div>
                      <span className="px-2 py-1 bg-rose-200 border border-rose-300 rounded font-black text-rose-800 text-[10px]">{pct}% rabais</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 6: MANAGING CATEGORIES         */}
        {/* ==================================== */}
        {adminTab === 'categories' && (
          <div className="space-y-6 animate-fade-in text-xs font-sans">
            {/* Create Category Form */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="font-extrabold text-rose-950 text-sm mb-1">Ajouter une Nouvelle Catégorie d'Étalage</h3>
              <p className="text-zinc-500 mb-4">Créez des étagères virtuelles pour ranger et segmenter vos articles cosmétiques.</p>

              {catError && (
                <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{catError}</span>
                </div>
              )}

              {catSuccess && (
                <div className="p-4 mb-4 rounded-xl bg-emerald-50 text-emerald-800 font-medium flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{catSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1.5">Nom de la catégorie *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Soins Capillaires"
                    value={catNameInput}
                    onChange={(e) => {
                      setCatNameInput(e.target.value);
                      // Automatic slug suggestion
                      if (!catSlugInput) {
                        setCatSlugInput(e.target.value.toLowerCase()
                          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
                          .replace(/[^a-z0-9 ]/g, '') // remove special chars
                          .trim().replace(/\s+/g, '-'));
                      }
                    }}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1.5">Slug (Identifiant d'URL unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: soins-capillaires"
                    value={catSlugInput}
                    onChange={(e) => setCatSlugInput(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1.5">Description optionnelle</label>
                  <input
                    type="text"
                    placeholder="ex: Gamme d'huiles et shampoings"
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-xl flex items-center space-x-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer la catégorie</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List Existing Categories */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="font-extrabold text-rose-950 text-sm mb-4">Catégories Enregistrées dans la Boutique</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const productCount = products.filter(p => p.category === cat.slug).length;
                  return (
                    <div key={cat.slug} className="p-5 rounded-2xl bg-zinc-55 border border-zinc-150 relative transition hover:shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2.5">
                          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-zinc-900 text-sm leading-tight">{cat.name}</h4>
                            <p className="font-mono text-[9px] text-rose-500 font-semibold">{cat.slug}</p>
                          </div>
                        </div>
                        <p className="text-zinc-500 leading-relaxed min-h-[36px]">{cat.description || "Aucune description renseignée."}</p>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-600 font-extrabold text-[10px]">{productCount} article{productCount > 1 ? 's' : ''}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.slug)}
                          className="text-zinc-400 hover:text-red-600 p-1 rounded-lg transition"
                          title="Supprimer la catégorie"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 6.5: MANAGING CUSTOMERS & RITUELS */}
        {/* ==================================== */}
        {adminTab === 'users' && (
          <div className="space-y-6 animate-fade-in text-xs font-sans">
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="font-extrabold text-rose-950 text-sm mb-1">Fichiers Clients & Diagnostics Beauté</h3>
              <p className="text-zinc-500 mb-4">Consultez la liste des clients enregistrés, leurs coordonnées (Nom, Ville, Téléphone) et l'historique de leur diagnostic de peau.</p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead>
                    <tr className="text-left font-mono text-[10px] uppercase font-black tracking-wider text-zinc-400 bg-zinc-50 rounded-xl">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Contact & Ville</th>
                      <th className="py-3 px-4">Diagnostic de Peau / Routines</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {users.filter(u => u.role !== 'admin').map((user) => {
                      const profile = user.skinProfile;
                      return (
                        <tr key={user.id} className="hover:bg-zinc-50/50 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center border border-rose-100 shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 text-sm whitespace-nowrap">{user.name || 'Client de passage'}</p>
                                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <div className="flex items-center space-x-1.5 text-zinc-700">
                              <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                              <span className="font-mono text-xs whitespace-nowrap">{user.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-zinc-500">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{user.city || 'Non spécifiée'}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate max-w-[200px]" title={user.address}>{user.address}</p>
                          </td>
                          <td className="py-4 px-4">
                            {profile ? (
                              <div className="p-3 bg-rose-50/15 border border-rose-100/50 rounded-2xl max-w-sm space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-extrabold text-rose-950 font-sans whitespace-nowrap">{profile.gender} • {profile.age} ans</span>
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-black rounded text-[9px] uppercase tracking-wide whitespace-nowrap">{profile.skinType}</span>
                                </div>
                                <div className="text-[11px] text-zinc-650 leading-normal">
                                  <span className="font-bold text-zinc-700">Cheveux & Cuir :</span> {profile.hairType}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {profile.concerns && profile.concerns.length > 0 ? (
                                    profile.concerns.map((con) => (
                                      <span key={con} className="px-2 py-0.5 bg-white border border-rose-100/70 text-[9px] text-rose-900 font-bold rounded whitespace-nowrap">
                                        {con}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-zinc-400 italic">Aucune préoccupation renseignée</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5 text-zinc-400 italic">
                                <span>Aucun diagnostic de peau effectué</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => {
                                setAdminTab('messages');
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-900 font-bold rounded-lg transition whitespace-nowrap cursor-pointer"
                            >
                              Discuter / Précrire
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {users.filter(u => u.role !== 'admin').length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-zinc-400">
                          <span className="text-2xl">👤</span>
                          <p className="text-xs font-bold mt-2 font-sans">Aucun client enregistré pour l'instant</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 7: MESSAGING CHAT FOR ADMIN    */}
        {/* ==================================== */}
        {adminTab === 'messages' && (
          <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm animate-fade-in">
            <div className="mb-4">
              <h3 className="font-extrabold text-rose-950 text-sm mb-1">Messagerie Clientèle Directe</h3>
              <p className="text-zinc-400 text-xs">Suivez, lisez et répondez aux rituels d'échange et questions de diagnostic reçus en temps réel.</p>
            </div>
            <div className="border border-zinc-100 rounded-3xl overflow-hidden min-h-[500px]">
              <PharmacistChat
                currentUser={currentUser}
                products={products}
                currentProfile={currentUser.skinProfile}
                chats={chats}
                messages={messages}
                onSendMessage={onSendMessage}
                onSendPharmacistPrescription={onSendPharmacistPrescription}
                onAddToCart={onAddToCart}
              />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
