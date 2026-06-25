import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Coins, Users, ShoppingBag, Plus, Trash2, Edit, Check, Eye, X, 
  RotateCw, AlertCircle, ShieldAlert, Sparkles, CheckCircle2, Truck, Ban, CheckCheck,
  FolderOpen, MessageSquare, Globe, ToggleLeft, ToggleRight, List, Shield, History, MapPin, Smartphone, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Product, Order, ChatSession, User as AppUser, AdminStats, Category, ChatMessage, Module, Item, UserModuleAccess, ActivityLog } from '../types';
import PharmacistChat from './PharmacistChat';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc, getDocs, db, query, where, handleFirestoreError, OperationType } from '../lib/firebase';

// Helper to compress and convert images to high-compatibility Base64 JPEG/WEBP
export function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Standardize output to highly compressed JPEG
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => resolve(event.target?.result as string);
    };
    reader.onerror = (err) => resolve('');
  });
}

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
  onSelectProductDetails?: (product: Product) => void;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onDeleteChatSession?: (chatId: string) => Promise<void>;
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
  onAddToCart,
  onSelectProductDetails,
  onDeleteMessage,
  onDeleteChatSession
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'stats' | 'orders' | 'products' | 'promos' | 'categories' | 'messages' | 'modules' | 'items' | 'users' | 'logs'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Custom states for beauty customer & diagnostics syncing
  const [diagnosticsList, setDiagnosticsList] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'all-users' | 'all-diagnostics'>('all-users');
  const [activeChatUserId, setActiveChatUserId] = useState<string | undefined>(undefined);

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
    }, (err) => {
      console.error("Realtime Modules Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "modules");
    });

    // 2. Items
    const unsubItems = onSnapshot(collection(db, "items"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(list);
    }, (err) => {
      console.error("Realtime Items Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "items");
    });

    // 3. All Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setAllUsers(list);
    }, (err) => {
      console.error("Realtime Users Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "users");
    });

    // 4. Access rights
    const unsubAccess = onSnapshot(collection(db, "userModuleAccess"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserModuleAccess));
      setModuleAccess(list);
    }, (err) => {
      console.error("Realtime Access Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "userModuleAccess");
    });

    // 5. Activity Logs
    const unsubLogs = onSnapshot(collection(db, "activityLogs"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(list);
    }, (err) => {
      console.error("Realtime Logs Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "activityLogs");
    });

    // 6. Beauty Diagnostics
    const unsubDiagnostics = onSnapshot(collection(db, "diagnostics"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDiagnosticsList(list);
    }, (err) => {
      console.error("Realtime Diagnostics Subscribe error in AdminPanel:", err);
    });

    return () => {
      unsubModules();
      unsubItems();
      unsubUsers();
      unsubAccess();
      unsubLogs();
      unsubDiagnostics();
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
  const [prodCat, setProdCat] = useState('soins-peau');
  const [prodBrand, setProdBrand] = useState('PharmaPure CI');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);



  // Create or update promotion form state
  const [promoProductId, setPromoProductId] = useState('');
  const [promoPercentage, setPromoPercentage] = useState(15);

  // New category form states
  const [catNameInput, setCatNameInput] = useState('');
  const [catSlugInput, setCatSlugInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [catImageUrlInput, setCatImageUrlInput] = useState('');
  const [catParentSlugInput, setCatParentSlugInput] = useState('');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // Category Edit states
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatImageUrl, setEditCatImageUrl] = useState('');
  const [editCatParentSlug, setEditCatParentSlug] = useState('');

  const handleOpenEditCategory = (cat: Category) => {
    setEditCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatImageUrl(cat.imageUrl || cat.image || '');
    setEditCatParentSlug((cat as any).parentSlug || '');
    setShowCategoryEditModal(true);
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;
    setCatError('');
    setCatSuccess('');
    if (!editCatName.trim()) {
      setCatError('Le nom de la catégorie est requis.');
      return;
    }
    if (!editCatDesc.trim()) {
      setCatError('La description de la catégorie est requise.');
      return;
    }
    if (!editCatImageUrl.trim()) {
      setCatError("L'image de la catégorie est requise.");
      return;
    }

    const updatedCategoryData = {
      slug: editCategory.slug,
      name: editCatName.trim(),
      description: editCatDesc.trim(),
      imageUrl: editCatImageUrl.trim(),
      image: editCatImageUrl.trim(),
      icon: editCategory.icon || 'Sparkles',
      parentSlug: editCatParentSlug || null
    };

    setIsSubmittingCategory(true);
    try {
      // 1. Direct write to Firestore for instant real-time synchronization across clients
      await setDoc(doc(db, "categories", editCategory.slug), updatedCategoryData);

      // 2. Parallel API call to update backend database
      await fetch(`/api/categories/${editCategory.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategoryData)
      });

      setCatSuccess('Catégorie mise à jour avec succès !');
      setShowCategoryEditModal(false);
      setEditCategory(null);
    } catch (err: any) {
      console.error("Erreur de mise à jour de catégorie:", err);
      setCatError(`Une erreur est survenue lors de la mise à jour: ${err.message || err}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    if (!catNameInput.trim()) {
      setCatError('Le nom de la catégorie est requis.');
      return;
    }
    if (!catDescInput.trim()) {
      setCatError('La description de la catégorie est requise.');
      return;
    }
    if (!catImageUrlInput.trim()) {
      setCatError("L'image de la catégorie est requise (veuillez importer une image ou coller un lien URL).");
      return;
    }

    // Automatically generate technical slug from category name
    const generatedSlug = catNameInput.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9 ]/g, '') // remove special chars
      .trim().replace(/\s+/g, '-');

    if (!generatedSlug) {
      setCatError('Veuillez saisir un nom de catégorie valide.');
      return;
    }

    const newCategoryData = {
      slug: generatedSlug,
      name: catNameInput.trim(),
      description: catDescInput.trim(),
      imageUrl: catImageUrlInput.trim(),
      image: catImageUrlInput.trim(),
      icon: 'Sparkles',
      parentSlug: catParentSlugInput || null
    };

    setIsSubmittingCategory(true);
    try {
      // 1. Direct write to Firestore for instant real-time synchronization
      await setDoc(doc(db, "categories", generatedSlug), newCategoryData);

      // 2. Parallel API call to update backend database
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData)
      });

      setCatSuccess('Catégorie ajoutée avec succès !');
      setCatNameInput('');
      setCatSlugInput('');
      setCatDescInput('');
      setCatImageUrlInput('');
      setCatParentSlugInput('');
    } catch (err: any) {
      console.error("Erreur d'ajout de catégorie:", err);
      setCatError(`Une erreur est survenue lors de l'ajout: ${err.message || err}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    setCatError('');
    setCatSuccess('');
    
    // Check if products are still attached to this category
    const associatedProducts = products.filter((p) => p.category === slug || p.categoryId === slug);
    if (associatedProducts.length > 0) {
      setCatError(`Impossible de supprimer la catégorie "${slug}" car ${associatedProducts.length} produit(s) y sont encore associés. Veuillez réassigner ou supprimer ces produits d'abord.`);
      return;
    }

    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    try {
      // 1. Direct delete from Firestore for instant real-time sync
      await deleteDoc(doc(db, "categories", slug));

      // 2. Parallel API call to delete from backend database
      await fetch(`/api/categories/${slug}`, {
        method: 'DELETE'
      });

      setCatSuccess('Catégorie supprimée avec succès !');
    } catch (err: any) {
      console.error("Erreur de suppression de catégorie:", err);
      setCatError(`Une erreur est survenue lors de la suppression: ${err.message || err}`);
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    try {
      if (editProduct) {
        await onUpdateProduct({
          ...editProduct,
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          promoPrice: prodPromo || undefined,
          stock: prodStock,
          images: [prodImg],
          category: prodCat,
          categoryId: prodCat,
          brand: prodBrand,
          isAvailable: prodStock > 0,
          isActive: prodStock > 0
        });
      } else {
        await onAddProduct({
          name: prodName,
          description: prodDesc,
          price: prodPrice,
          promoPrice: prodPromo || undefined,
          stock: prodStock,
          images: [prodImg],
          category: prodCat,
          categoryId: prodCat,
          brand: prodBrand,
          isAvailable: prodStock > 0,
          isActive: prodStock > 0,
          createdAt: new Date().toISOString()
        });
      }
      
      // reset form
      setEditProduct(null);
      setProdName('');
      setProdDesc('');
      setProdPrice(5000);
      setProdPromo(undefined);
      setProdStock(20);
      setProdCat('soins-peau');
      setShowProductModal(false);
    } catch (err) {
      console.error("Error submitting product:", err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdPromo(p.promoPrice);
    setProdStock(p.stock);
    setProdImg(p.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop');
    setProdCat(p.category || p.categoryId || (categories[0]?.slug || 'soins-peau'));
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
                    <React.Fragment key={ord.id}>
                      <tr 
                        className="hover:bg-rose-50/5 cursor-pointer transition-colors"
                        onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                      >
                        <td className="py-4.5 px-6 font-mono font-bold text-rose-955 flex items-center space-x-1.5">
                          <span className="text-[10px] text-rose-800 shrink-0 select-none">
                            {expandedOrderId === ord.id ? '▼' : '▶'}
                          </span>
                          <span className="truncate max-w-[80px]" title={ord.id}>{ord.id}</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <p className="font-bold">{ord.customerName}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{ord.customerPhone}</p>
                        </td>
                        <td className="py-4.5 px-6 text-zinc-500">
                          <p className="font-bold">{new Date(ord.date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{new Date(ord.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-4.5 px-6 font-medium">
                          {ord.city}
                        </td>
                        <td className="py-4.5 px-6 text-right font-extrabold text-rose-800">
                          {ord.total.toLocaleString()} CFA
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase inline-block ${
                            ord.status === 'Livrée' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            ord.status === 'En livraison' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            ord.status === 'Préparation' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            ord.status === 'Annulée' ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-zinc-100 text-zinc-800 border border-zinc-200'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        
                        {/* Interactive Stage triggers */}
                        <td className="py-4.5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {ord.status !== 'Confirmée' && ord.status !== 'Annulée' && ord.status !== 'Livrée' && (
                              <>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'Confirmée')}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase transition flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Valider la Commande"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Valider</span>
                                </button>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'Annulée')}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-black text-[10px] uppercase transition flex items-center gap-1 cursor-pointer border border-rose-200"
                                  title="Annuler la Commande"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Annuler</span>
                                </button>
                              </>
                            )}
                            {ord.status === 'Confirmée' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-600 font-extrabold font-mono bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1 select-none">
                                  <CheckCheck className="h-3 w-3" /> Validée
                                </span>
                                <button
                                  onClick={() => onUpdateOrderStatus(ord.id, 'En livraison')}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[9px] uppercase transition cursor-pointer"
                                >
                                  Mettre en Livraison
                                </button>
                              </div>
                            )}
                            {ord.status === 'En livraison' && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, 'Livrée')}
                                className="px-2.5 py-1 bg-emerald-650 hover:bg-emerald-700 text-white rounded-md font-bold text-[9px] uppercase transition cursor-pointer"
                              >
                                Marquer Livrée
                              </button>
                            )}
                            {ord.status === 'Annulée' && (
                              <span className="text-[10px] text-red-600 font-extrabold font-mono bg-red-50 px-2.5 py-1 rounded-md border border-red-200 select-none">
                                ✗ Annulée
                              </span>
                            )}
                            {ord.status === 'Livrée' && (
                              <span className="text-[10px] text-zinc-500 font-extrabold font-mono bg-zinc-100 px-2.5 py-1 rounded-md select-none">
                                ✓ Livrée & Clôturée
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Articles details drawer */}
                      {expandedOrderId === ord.id && (
                        <tr className="bg-rose-50/5">
                          <td colSpan={7} className="py-4 px-6 border-b border-rose-100/50">
                            <div className="text-left space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 bg-white p-4 rounded-2xl border border-rose-100/30 gap-4">
                                <div>
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-rose-950 block">Destinataire & Contact :</span>
                                  <p className="text-zinc-800 font-bold text-xs mt-1.5 flex items-center gap-1.5">
                                    <span>👤</span>
                                    <span>{ord.customerName}</span>
                                  </p>
                                  <p className="text-zinc-500 font-mono text-xs mt-1 flex items-center gap-1.5">
                                    <span>📞</span>
                                    <span className="font-bold">{ord.customerPhone}</span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-rose-950 block">Adresse de Livraison :</span>
                                  <p className="text-zinc-600 font-bold text-xs mt-1.5 flex items-center gap-1.5">
                                    <span>📍</span>
                                    <span>{ord.city}</span>
                                  </p>
                                  <p className="text-zinc-500 font-medium text-xs mt-1">
                                    {ord.address || "Aucune rue fournie"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-rose-950 block">Paiement & Date :</span>
                                  <p className="text-zinc-600 font-medium text-xs mt-1.5 flex items-center gap-1.5">
                                    <span>💳</span>
                                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">{ord.paymentMethod}</span>
                                  </p>
                                  <p className="text-zinc-400 font-mono text-[10px] mt-1 flex items-center gap-1.5">
                                    <span>🕒</span>
                                    <span>{new Date(ord.date).toLocaleDateString()} à {new Date(ord.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-950 block mb-2.5">Détail des Articles Commandés ({ord.items ? ord.items.length : 0}) :</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ord.items && ord.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-center p-3 rounded-xl bg-white border border-rose-100/30">
                                        <img
                                          referrerPolicy="no-referrer"
                                          src={item.image || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop"}
                                          alt={item.name}
                                          className="h-12 w-12 object-cover rounded-xl mr-3 border shrink-0"
                                        />
                                        <div className="flex-1 min-w-0 pr-2">
                                          <p className="font-bold text-rose-950 text-xs truncate">{item.name}</p>
                                          <p className="text-[10px] text-zinc-400 mt-1">
                                            {item.price.toLocaleString()} CFA × <span className="text-rose-900 font-black">{item.quantity}</span>
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="font-black text-rose-950 text-xs text-nowrap">{(item.price * item.quantity).toLocaleString()} CFA</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200/50 space-y-3">
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-rose-950 block border-b pb-2">Decompte Financier de la commande :</span>
                                  <div className="text-xs space-y-2 text-zinc-600">
                                    <div className="flex justify-between">
                                      <span>Sous-total Articles :</span>
                                      <span className="font-bold text-zinc-800">
                                        {(ord.items ? ord.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) : 0).toLocaleString()} FCFA
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Frais de livraison :</span>
                                      <span className="font-bold text-zinc-800">
                                        {((ord.city === 'Abidjan' || ord.city?.toLowerCase().includes('abidjan') || ord.city?.toLowerCase().includes('cocody') || ord.city?.toLowerCase().includes('plateau') || ord.city?.toLowerCase().includes('yopougon') || ord.city?.toLowerCase().includes('marory') || ord.city?.toLowerCase().includes('koumassi') || ord.city?.toLowerCase().includes('angre') || ord.city?.toLowerCase().includes('deux plateaux')) ? 1500 : 3000).toLocaleString()} FCFA
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2.5 font-black text-rose-950 text-sm">
                                      <span>Total de la commande :</span>
                                      <span className="text-rose-600">{ord.total.toLocaleString()} FCFA</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {orders.length === 0 && (
                    <tr key="empty-orders">
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
                  setProdPromo(undefined);
                  setProdStock(20);
                  setProdImg('https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop');
                  setProdCat(categories[0]?.slug || 'soins-peau');
                  setProdBrand('PharmaPure CI');
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
                      <tr 
                        key={p.id} 
                        className="hover:bg-rose-50/10 cursor-pointer transition-colors"
                        onClick={() => handleOpenEditProduct(p)}
                        title="Cliquer pour modifier cet article"
                      >
                        <td className="py-3 px-6">
                          <img 
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop"} 
                            alt={p.name} 
                            className="h-10 w-10 object-cover rounded-xl border border-rose-50"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop";
                            }}
                          />
                        </td>
                        <td className="py-3 px-6 font-bold text-rose-950 max-w-[280px]">
                          <p className="truncate text-sm" title={p.name}>{p.name}</p>
                          <p className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">{p.description}</p>
                        </td>
                        <td className="py-3 px-6 font-semibold text-zinc-800">
                          {categories.find(c => c.slug === (p.category || p.categoryId))?.name || (p.category || p.categoryId || '').replace('-', ' ')}
                        </td>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditProduct(p);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-rose-950 hover:bg-zinc-100 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProduct(p.id);
                              }}
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
                          {categories.filter(c => !c.parentSlug && c.slug !== 'tous').map((mainCat) => {
                            const subCats = categories.filter(sub => sub.parentSlug === mainCat.slug);
                            return (
                              <React.Fragment key={mainCat.slug}>
                                <option value={mainCat.slug} className="font-semibold text-rose-950">
                                  {mainCat.name}
                                </option>
                                {subCats.map((subCat) => (
                                  <option key={subCat.slug} value={subCat.slug}>
                                    &nbsp;&nbsp;&nbsp;&nbsp;↳ {subCat.name}
                                  </option>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </select>
                      </div>

                      <div className="border-t border-rose-50 pt-3">
                        <label className="block text-rose-950 font-extrabold mb-1.5 text-xs">Image du produit *</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          {/* Option 1: File Importer */}
                          <div className="p-3 bg-rose-50/10 border border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 min-h-[110px] relative hover:bg-rose-50/20 transition group">
                            <input
                              type="file"
                              accept="image/*"
                              id="product-file-upload"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressImage(file).then(compressed => {
                                    setProdImg(compressed);
                                  }).catch(() => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === 'string') {
                                        setProdImg(reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }
                              }}
                            />
                            <label htmlFor="product-file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full space-y-1">
                              <FolderOpen className="h-6 w-6 text-rose-400 group-hover:scale-110 transition duration-200" />
                              <span className="font-bold text-rose-950">Importer un fichier</span>
                              <span className="text-[9px] text-zinc-400 font-normal">Formats: PNG, JPG, WEBP</span>
                            </label>
                          </div>

                          {/* Option 2: Image URL input */}
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-center space-y-1.5 min-h-[110px]">
                            <span className="font-bold text-zinc-700 block">Ou lien URL direct</span>
                            <input
                              type="text"
                              placeholder="ex: https://images.unsplash.com/..."
                              value={prodImg.startsWith('data:') ? '' : prodImg}
                              onChange={(e) => setProdImg(e.target.value)}
                              className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-mono"
                            />
                            <p className="text-[9px] text-zinc-400 leading-none">URL web vers une image publique.</p>
                          </div>
                        </div>

                        {/* Active Preview */}
                        {prodImg && (
                          <div className="mt-3 p-2 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={prodImg} 
                                alt="Aperçu produit" 
                                className="h-10 w-10 object-cover rounded-lg border border-rose-100"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop";
                                }}
                              />
                              <div className="max-w-[200px]">
                                <span className="font-bold text-rose-950 text-[10px] block">Aperçu sélectionné</span>
                                <span className="text-[9px] text-zinc-400 font-mono block truncate">
                                  {prodImg.startsWith('data:') ? 'Image importée (Base64)' : prodImg}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProdImg('https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop')}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[9px] rounded transition"
                            >
                              Réinitialiser
                            </button>
                          </div>
                        )}
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
                          disabled={isSubmittingProduct}
                          className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmittingProduct ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span>Enregistrement...</span>
                            </>
                          ) : (
                            <span>{editProduct ? 'Sauvegarder' : 'Ajouter le produit'}</span>
                          )}
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
                      <div className="min-w-0 flex-1 mr-2 text-left">
                        <p className="font-bold text-rose-950 text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Normal: {p.price} CFA • Promo: <span className="text-rose-700 font-extrabold">{p.promoPrice} CFA</span></p>
                      </div>
                      <div className="flex flex-col items-end space-y-1 shrink-0">
                        <span className="px-2 py-0.5 bg-rose-200 border border-rose-300 rounded font-black text-rose-800 text-[9px]">{pct}% rabais</span>
                        <button
                          type="button"
                          onClick={() => {
                            const { promoPrice, discountRate, isOnSale, promoPercentage, discount, ...rest } = p as any;
                            onUpdateProduct({
                              ...rest,
                              promoPrice: undefined
                            });
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-900 cursor-pointer underline"
                        >
                          Retirer
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

              <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-zinc-700 font-bold mb-1.5">Nom de la catégorie *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Soins Capillaires"
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-zinc-700 font-bold mb-1.5">Description de la catégorie *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="ex: Gamme complète d'huiles, sérums et shampoings d'Afrique pour sublimer votre chevelure."
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-zinc-700 font-bold mb-1.5">Catégorie parente (Optionnel - pour créer une sous-catégorie)</label>
                  <select
                    value={catParentSlugInput}
                    onChange={(e) => setCatParentSlugInput(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                  >
                    <option value="">-- Aucune (C'est une catégorie principale) --</option>
                    {categories.filter(c => !c.parentSlug && c.slug !== 'tous').map((category) => (
                      <option key={category.slug} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 border-t border-rose-50 pt-4">
                  <label className="block text-rose-950 font-extrabold mb-2 text-sm">Image de la catégorie *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: File Importer */}
                    <div className="p-4 bg-rose-50/10 border border-dashed border-rose-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 min-h-[140px] relative hover:bg-rose-50/20 transition group">
                      <input
                        type="file"
                        accept="image/*"
                        id="category-file-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file).then(compressed => {
                              setCatImageUrlInput(compressed);
                            }).catch(() => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setCatImageUrlInput(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                      <label htmlFor="category-file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full space-y-2">
                        <FolderOpen className="h-8 w-8 text-rose-400 group-hover:scale-110 transition duration-200" />
                        <span className="font-bold text-rose-950 text-xs">Importer un fichier image</span>
                        <span className="text-[10px] text-zinc-400 font-normal">Formats acceptés: PNG, JPG, WEBP</span>
                      </label>
                    </div>

                    {/* Option 2: Image URL input */}
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-center space-y-2 min-h-[140px]">
                      <span className="font-bold text-zinc-700 block text-xs">Ou renseigner un lien URL</span>
                      <input
                        type="text"
                        placeholder="ex: https://images.unsplash.com/photo-..."
                        value={catImageUrlInput.startsWith('data:') ? '' : catImageUrlInput}
                        onChange={(e) => setCatImageUrlInput(e.target.value)}
                        className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-mono"
                      />
                      <p className="text-[10px] text-zinc-400 leading-tight">Collez le lien complet vers une image publique hébergée en ligne.</p>
                    </div>
                  </div>

                  {/* Active Preview */}
                  {catImageUrlInput && (
                    <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={catImageUrlInput} 
                          alt="Aperçu" 
                          className="h-14 w-14 object-cover rounded-xl border border-rose-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="max-w-[280px]">
                          <span className="font-bold text-rose-950 text-xs block">Aperçu de l'image sélectionnée</span>
                          <span className="text-[10px] text-zinc-400 font-mono block truncate mt-0.5">
                            {catImageUrlInput.startsWith('data:') ? 'Image importée (Base64)' : catImageUrlInput}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCatImageUrlInput('')}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] rounded-lg transition"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="px-6 py-3 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-xl flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCategory ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Créer la catégorie</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List Existing Categories */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="font-extrabold text-rose-950 text-sm mb-4">Catégories Enregistrées dans la Boutique</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                  const productCount = products.filter(p => p.category === cat.slug || p.categoryId === cat.slug).length;
                  return (
                    <div 
                      key={cat.slug} 
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-5 rounded-2xl bg-zinc-55 border border-zinc-150 hover:border-rose-300 hover:bg-rose-50/5 relative transition hover:shadow-xs group flex flex-col justify-between cursor-pointer"
                      title="Cliquer pour modifier cette catégorie"
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-2.5">
                          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                            <FolderOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-zinc-900 text-sm leading-tight">
                              {cat.parentSlug && <span className="text-rose-500 mr-1 text-[11px] font-black">↳</span>}
                              {cat.name}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
                              <span className="font-mono text-[8px] text-zinc-400 font-semibold">{cat.slug}</span>
                              {cat.parentSlug && (
                                <span className="bg-rose-50 text-rose-600 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                                  Sous-catégorie de : {categories.find(c => c.slug === cat.parentSlug)?.name || cat.parentSlug}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-500 leading-relaxed min-h-[36px]">{cat.description || "Aucune description renseignée."}</p>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-600 font-extrabold text-[10px]">{productCount} article{productCount > 1 ? 's' : ''}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditCategory(cat);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-950 hover:bg-zinc-100 rounded-lg transition"
                            title="Modifier la catégorie"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat.slug);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer la catégorie"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CATEGORY EDIT MODAL */}
            {showCategoryEditModal && editCategory && (
              <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
                <div onClick={() => { setShowCategoryEditModal(false); setEditCategory(null); }} className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs"></div>
                <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 text-left border border-rose-100">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h4 className="font-bold text-rose-950 text-sm flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-rose-600" />
                        <span>Modifier la Catégorie : {editCategory.name}</span>
                      </h4>
                      <button onClick={() => { setShowCategoryEditModal(false); setEditCategory(null); }} className="p-1 text-zinc-400 hover:text-rose-950">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateCategorySubmit} className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Nom de la catégorie *</label>
                        <input
                          type="text"
                          required
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          placeholder="Nom de la catégorie"
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Description de la catégorie *</label>
                        <textarea
                          required
                          rows={3}
                          value={editCatDesc}
                          onChange={(e) => setEditCatDesc(e.target.value)}
                          placeholder="Description de la catégorie..."
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-bold mb-1">Catégorie parente (Optionnel - pour créer une sous-catégorie)</label>
                        <select
                          value={editCatParentSlug}
                          onChange={(e) => setEditCatParentSlug(e.target.value)}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                        >
                          <option value="">-- Aucune (C'est une catégorie principale) --</option>
                          {categories.filter(c => !c.parentSlug && c.slug !== 'tous' && c.slug !== editCategory.slug).map((category) => (
                            <option key={category.slug} value={category.slug}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-rose-950 font-extrabold mb-2 text-xs">Image de la catégorie *</label>
                        <div className="grid grid-cols-1 gap-3">
                          {/* File input and URL Input options */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-rose-50/10 border border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer relative hover:bg-rose-50/20 transition group">
                              <input
                                type="file"
                                accept="image/*"
                                id="edit-category-file-upload"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressImage(file).then(compressed => {
                                      setEditCatImageUrl(compressed);
                                    }).catch(() => {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          setEditCatImageUrl(reader.result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  }
                                }}
                              />
                              <label htmlFor="edit-category-file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full py-2">
                                <FolderOpen className="h-5 w-5 text-rose-400 group-hover:scale-110 transition duration-150" />
                                <span className="font-bold text-rose-950 text-[10px] mt-1">Importer un fichier</span>
                              </label>
                            </div>

                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-center">
                              <span className="text-[9px] text-zinc-500 font-bold mb-1">Lien URL de l'image</span>
                              <input
                                type="text"
                                placeholder="ex: https://images.unsplash.com/..."
                                value={editCatImageUrl.startsWith('data:') ? '' : editCatImageUrl}
                                onChange={(e) => setEditCatImageUrl(e.target.value)}
                                className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-mono"
                              />
                            </div>
                          </div>

                          {/* Image preview */}
                          {editCatImageUrl && (
                            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <img 
                                  src={editCatImageUrl} 
                                  alt="Aperçu" 
                                  className="h-10 w-10 object-cover rounded-lg border border-rose-100"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="max-w-[160px]">
                                  <span className="font-bold text-rose-950 text-[10px] block leading-none">Aperçu</span>
                                  <span className="text-[9px] text-zinc-400 font-mono block truncate mt-0.5">
                                    {editCatImageUrl.startsWith('data:') ? 'Image importée (Base64)' : editCatImageUrl}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditCatImageUrl('')}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[9px] rounded-md transition"
                              >
                                Retirer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => { setShowCategoryEditModal(false); setEditCategory(null); }}
                          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingCategory}
                          className="px-6 py-2.5 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmittingCategory ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                              <span>Sauvegarde...</span>
                            </>
                          ) : (
                            <span>Sauvegarder</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'users' && (
          <div className="space-y-6 animate-fade-in text-xs font-sans">
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="font-extrabold text-rose-950 text-sm mb-1">Fichiers Clients & Diagnostics Beauté</h3>
              <p className="text-zinc-500 mb-6">Consultez la liste des clients enregistrés, leurs coordonnées et l'historique en temps réel de tous les diagnostics de peau soumis.</p>

              {/* Real-time sync sub-tabs selection */}
              <div className="flex space-x-2 border-b border-rose-100 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSubTab('all-users')}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    subTab === 'all-users'
                      ? 'bg-rose-950 text-white shadow-xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-650'
                  }`}
                >
                  Fiches Clients enregistrés ({users.filter(u => u.role !== 'admin').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('all-diagnostics')}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center space-x-2 cursor-pointer ${
                    subTab === 'all-diagnostics'
                      ? 'bg-rose-950 text-white shadow-xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-650'
                  }`}
                >
                  <span>Diagnostics Soumis ({diagnosticsList.length})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </button>
              </div>

              {subTab === 'all-users' ? (
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
                                type="button"
                                onClick={() => {
                                  setActiveChatUserId(user.id);
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
                        <tr key="empty-users">
                          <td colSpan={4} className="text-center py-12 text-zinc-400">
                            <span className="text-2xl">👤</span>
                            <p className="text-xs font-bold mt-2 font-sans">Aucun client enregistré pour l'instant</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-100">
                    <thead>
                      <tr className="text-left font-mono text-[10px] uppercase font-black tracking-wider text-zinc-400 bg-zinc-50 rounded-xl">
                        <th className="py-3 px-4">Client Soumissionnaire</th>
                        <th className="py-3 px-4">Coordonnées</th>
                        <th className="py-3 px-4">Diagnostic Profil & Réponses</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {diagnosticsList.map((diag) => (
                        <tr key={diag.id} className="hover:bg-zinc-50/50 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center border border-emerald-100 shrink-0">
                                {diag.userName ? diag.userName.charAt(0).toUpperCase() : 'D'}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 text-sm whitespace-nowrap">{diag.userName || 'Client connecté'}</p>
                                <p className="text-[9px] text-zinc-400 font-mono mt-0.5" title="User ID">UID: {diag.userId || 'N/A'}</p>
                                <p className="text-[9px] text-zinc-450 font-mono mt-0.5" title="Date de soumission">Soumis le: {diag.createdAt ? new Date(diag.createdAt).toLocaleString('fr-FR') : 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <div className="flex items-center space-x-1.5 text-zinc-700">
                              <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                              <span className="font-mono text-xs whitespace-nowrap">{diag.userPhone || 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-zinc-500">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{diag.userCity || 'Non spécifiée'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="p-3 bg-zinc-50/50 border border-zinc-150 rounded-2xl max-w-sm space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-bold text-zinc-800 whitespace-nowrap">
                                  {diag.gender} • {diag.age} ans
                                </span>
                                <span className="px-2 py-0.5 bg-rose-55 text-rose-950 font-black rounded text-[9px] uppercase tracking-wide whitespace-nowrap">
                                  {diag.skinType}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-650 leading-normal">
                                <span className="font-semibold text-zinc-500">Cheveux :</span> {diag.hairType}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {diag.concerns && diag.concerns.length > 0 ? (
                                  diag.concerns.map((con: string) => (
                                    <span key={con} className="px-2 py-0.5 bg-white border border-zinc-200 text-[9px] text-zinc-700 font-bold rounded whitespace-nowrap">
                                      {con}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-zinc-400 italic">Aucune préoccupation</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (diag.userId) {
                                  setActiveChatUserId(diag.userId);
                                }
                                setAdminTab('messages');
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-900 font-bold rounded-lg transition whitespace-nowrap cursor-pointer"
                            >
                              Discuter / Précrire
                            </button>
                          </td>
                        </tr>
                      ))}

                      {diagnosticsList.length === 0 && (
                        <tr key="empty-diagnostics">
                          <td colSpan={4} className="text-center py-12 text-zinc-400">
                            <span className="text-2xl">📋</span>
                            <p className="text-xs font-bold mt-2 font-sans">Aucun diagnostic enregistré dans la base de données</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
                currentProfile={users.find(u => u.id === activeChatUserId)?.skinProfile}
                chats={chats}
                messages={messages}
                onSendMessage={onSendMessage}
                onSendPharmacistPrescription={onSendPharmacistPrescription}
                onAddToCart={onAddToCart}
                defaultSelectedChatId={activeChatUserId}
                onSelectChatSession={(chatId) => setActiveChatUserId(chatId)}
                onSelectProductDetails={onSelectProductDetails}
                onDeleteMessage={onDeleteMessage}
                onDeleteChatSession={onDeleteChatSession}
              />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
