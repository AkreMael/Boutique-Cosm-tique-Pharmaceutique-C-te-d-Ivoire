import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Catalog from './components/Catalog';
import BeautyQuestionnaire from './components/BeautyQuestionnaire';
import PharmacistChat from './components/PharmacistChat';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import Home from './components/Home';
import CategoriesGrid from './components/CategoriesGrid';
import OffersScreen from './components/OffersScreen';
import CartScreen from './components/CartScreen';
import ProfileScreen from './components/ProfileScreen';
import { Product, Category, User, CartItem, Order, ChatSession, ChatMessage, BeautyProfile } from './types';
import { HeartPulse, Plus, Check, Star, X, Shield, Info, ShoppingBag, MessageSquare, Send, Sparkles, Home as HomeIcon, Grid3X3, BadgePercent, ShoppingCart as BottomCartIcon, User as UserIcon } from 'lucide-react';
import { db, collection, doc, onSnapshot, setDoc, query, where, authenticateAnonymous, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  // Navigation tabs - Default with home (Accueil) per full-UI overhaul guidelines
  const [activeTab, setActiveTab] = useState<string>('home');
  const [preselectedCategory, setPreselectedCategory] = useState<any>('tous');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'client'>('admin');

  // Authentication & Loading States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'add_to_cart'; product: Product }
    | { type: 'switch_tab'; tab: string }
    | { type: 'open_cart' }
    | null
  >(null);

  // Firestore Live States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Local UI States
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('akwaba_cart');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Floating Chat states and unread indicators
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [floatingInput, setFloatingInput] = useState('');
  const [showNewMsgToast, setShowNewMsgToast] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const [lastMsgIdTracked, setLastMsgIdTracked] = useState<string | null>(null);

  // Monitor incoming notifications in real-time for normal client sessions
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || isFloatingChatOpen) return;

    const myMsgs = messages.filter((m) => m.chatId === currentUser.id);
    if (myMsgs.length === 0) return;

    const lastMsg = myMsgs[myMsgs.length - 1];
    if (lastMsg.sender === 'admin' && lastMsg.id !== lastMsgIdTracked) {
      setLastMsgIdTracked(lastMsg.id);
      setToastContent(lastMsg.message);
      setShowNewMsgToast(true);
      // Automatically dismiss the slide-in toast in 6 seconds
      const timer = setTimeout(() => setShowNewMsgToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [messages, currentUser, isFloatingChatOpen, lastMsgIdTracked]);

  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState<boolean>(false);

  // 1. Initial configuration check: load logged-in user session
  useEffect(() => {
    // Authenticate anonymously in background to solve Firestore secure reads under 'auth != null' rules
    authenticateAnonymous()
      .then(() => {
        setIsFirebaseAuthed(true);
      })
      .catch((err) => {
        console.error("Silent anonymous login fail:", err);
      });

    const cached = localStorage.getItem('akwaba_user');
    if (cached) {
      try {
        const parsed: User = JSON.parse(cached);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setActiveTab('admin');
          setAdminViewMode('admin');
        } else {
          setActiveTab('catalog');
        }
      } catch {
        localStorage.removeItem('akwaba_user');
      }
    } else {
      setActiveTab('catalog');
    }
    setLoading(false);
  }, []);

  // 2. Real-Time Cloud Firestore Continuous Subscriptions (Public & Authenticated Collections)
  useEffect(() => {
    if (!isFirebaseAuthed) return;

    // 1) Subscribe to Products Collection (Public Read allowed)
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    }, (err) => {
      console.error("Realtime Products Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "products");
    });

    // 2) Subscribe to Categories Collection (Public Read allowed)
    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      const list = snap.docs.map(doc => {
        const data = doc.data() as Category;
        return {
          slug: doc.id,
          ...data
        } as Category;
      });
      setCategories(list);
    }, (err) => {
      console.error("Realtime Categories Subscribe error:", err);
      handleFirestoreError(err, OperationType.LIST, "categories");
    });

    let unsubMessages = () => {};
    let unsubUsers = () => {};
    let unsubOrders = () => {};
    let unsubChats = () => {};

    if (isFirebaseAuthed && currentUser) {
      // 3) Subscribe to Messages Collection (Authenticated Read allowed)
      unsubMessages = onSnapshot(collection(db, "messages"), (snap) => {
        const list = snap.docs.map(doc => doc.data() as ChatMessage);
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(list);
      }, (err) => {
        console.error("Realtime Messages Subscribe error:", err);
        handleFirestoreError(err, OperationType.LIST, "messages");
      });

      // 4) Subscribe to Users Collection (Admin only) or own user document (Client)
      if (currentUser.role === 'admin') {
        unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
          const list = snap.docs.map(doc => doc.data() as User);
          setUsers(list);
        }, (err) => {
          console.error("Realtime Users Subscribe error:", err);
          handleFirestoreError(err, OperationType.LIST, "users");
        });
      } else {
        // Subscribe to own details for real-time sync with database/admin updates
        unsubUsers = onSnapshot(doc(db, "users", currentUser.id), (snap) => {
          if (snap.exists()) {
            const uData = snap.data() as User;
            setCurrentUser(uData);
            localStorage.setItem('akwaba_user', JSON.stringify(uData));
          }
        }, (err) => {
          console.error("Realtime own user doc Subscribe error:", err);
        });
      }

      // 5) Subscribe to Orders Collection (Real-time updates)
      const ordersRef = collection(db, "orders");
      const ordersQuery = currentUser.role === 'admin'
        ? query(ordersRef)
        : query(ordersRef, where("userId", "==", currentUser.id));

      unsubOrders = onSnapshot(ordersQuery, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(list);
      }, (err) => {
        console.error("Realtime Orders Subscribe error:", err);
        handleFirestoreError(err, OperationType.LIST, "orders");
      });

      // 6) Subscribe to Chats Collection (Real-time updates)
      const chatsRef = collection(db, "chats");
      const chatsQuery = currentUser.role === 'admin'
        ? query(chatsRef)
        : query(chatsRef, where("id", "==", currentUser.id));

      unsubChats = onSnapshot(chatsQuery, (snap) => {
        const list = snap.docs.map(doc => doc.data() as ChatSession);
        setChats(list);
      }, (err) => {
        console.error("Realtime Chats Subscribe error:", err);
        handleFirestoreError(err, OperationType.LIST, "chats");
      });
    }

    return () => {
      unsubProducts();
      unsubCategories();
      unsubMessages();
      unsubUsers();
      unsubOrders();
      unsubChats();
    };
  }, [currentUser, isFirebaseAuthed]);

  // 2.1 Initial Catalog & Categories One-Time Fallback Fetch (gives instant display on launch)
  useEffect(() => {
    const fetchCatalogOnce = async () => {
      try {
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const prodList = await prodRes.json() as Product[];
          if (prodList.length > 0) setProducts(prodList);
        }
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catList = await catRes.json() as Category[];
          if (catList.length > 0) setCategories(catList);
        }
      } catch (err) {
        console.warn("Catalog initial fetch waiting for backend server initialization...");
      }
    };
    fetchCatalogOnce();
  }, []);

  // 2.2 Secure Server REST Polling for messages, orders, chats, and customers
  useEffect(() => {
    const fetchFullPlatformData = async () => {
      try {
        // Load authenticated user state lists
        if (currentUser) {
          // Fetch user or admin Orders
          const ordUrl = currentUser.role === 'admin' 
            ? '/api/orders' 
            : `/api/orders/user/${currentUser.id}`;
          const ordRes = await fetch(ordUrl);
          if (ordRes.ok) {
            const ordList = await ordRes.json() as Order[];
            ordList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOrders(ordList);
          }

          if (currentUser.role === 'admin') {
            // Fetch chats for backend management thread list
            const chatRes = await fetch('/api/chats');
            if (chatRes.ok) {
              const chatList = await chatRes.json() as ChatSession[];
              setChats(chatList);
            }

            // Fetch list of registered clients for admin customer cards
            const usersRes = await fetch('/api/users');
            if (usersRes.ok) {
              const uList = await usersRes.json() as User[];
              setUsers(uList);
            }

            // Sync all messages across all conversations for admin dashboard
            const msgRes = await fetch('/api/messages');
            if (msgRes.ok) {
              const msgList = await msgRes.json() as ChatMessage[];
              msgList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              setMessages(msgList);
            }
          } else {
            // Sync specific client messages for dynamic private conversation thread
            const msgRes = await fetch(`/api/chats/${currentUser.id}/messages`);
            if (msgRes.ok) {
              const msgList = await msgRes.json() as ChatMessage[];
              msgList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              setMessages(msgList);
            }
          }
        }
      } catch (err) {
        // Soft warning to handle brief offline states or server restarts gracefully without flooding console.error
        console.warn("Background sync waiting for backend server initialization...");
      }
    };

    // Run sync immediately on mount or user change
    fetchFullPlatformData();

    // Setup periodic sync every 3 seconds for extremely responsive dashboard updates
    const interval = setInterval(fetchFullPlatformData, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Authentication submit
  const handleLogin = async (userPayload: User) => {
    try {
      // Connect to Firestore auth anonymously
      await authenticateAnonymous();

      // Exchange details with express to retrieve profile or persist credentials
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
      });
      const synchronizedUser: User = res.ok ? await res.json() : userPayload;

      // Save locally
      localStorage.setItem('akwaba_user', JSON.stringify(synchronizedUser));
      setCurrentUser(synchronizedUser);
      setShowLoginModal(false);

      // Register profile in Firestore client-side and initialize active chat session
      if (isFirebaseAuthed) {
        try {
          await setDoc(doc(db, "users", synchronizedUser.id), synchronizedUser, { merge: true });
          
          if (synchronizedUser.role === 'client') {
            await setDoc(doc(db, "chats", synchronizedUser.id), {
              id: synchronizedUser.id,
              clientName: synchronizedUser.name,
              clientPhone: synchronizedUser.phone,
              clientCity: synchronizedUser.city || '',
              active: true
            }, { merge: true });
          }
        } catch (dbErr) {
          console.error("Firestore user registration merge error:", dbErr);
        }
      }

      if (synchronizedUser.role === 'admin') {
        setActiveTab('admin');
        setAdminViewMode('admin');
      } else {
        if (pendingAction) {
          if (pendingAction.type === 'add_to_cart') {
            let updatedCart: CartItem[] = [];
            const existing = cart.find((item) => item.product.id === pendingAction.product.id);
            if (existing) {
              updatedCart = cart.map((item) =>
                item.product.id === pendingAction.product.id ? { ...item, quantity: item.quantity + 1 } : item
              );
            } else {
              updatedCart = [...cart, { product: pendingAction.product, quantity: 1 }];
            }
            syncCartWithDb(updatedCart);
          } else if (pendingAction.type === 'switch_tab') {
            setActiveTab(pendingAction.tab);
          } else if (pendingAction.type === 'open_cart') {
            setIsCartOpen(true);
          }
          setPendingAction(null);
        } else {
          setActiveTab('catalog');
        }
      }
    } catch (err) {
      console.error("Authentication handshake failure:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('akwaba_user');
    setCurrentUser(null);
    setCart([]);
  };

  // E-commerce Cart Operations with local persistence
  const syncCartWithDb = async (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('akwaba_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product) => {
    if (!currentUser) {
      setPendingAction({ type: 'add_to_cart', product });
      setShowLoginModal(true);
      return;
    }
    let updatedCart: CartItem[] = [];
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updatedCart = cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, { product, quantity: 1 }];
    }
    syncCartWithDb(updatedCart);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const updatedCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    syncCartWithDb(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    syncCartWithDb(updatedCart);
  };

  const handleClearCart = () => {
    syncCartWithDb([]);
  };

  // Checkout complete orders
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    handleClearCart();
  };

  // Beauty profile customized routine diagnostic saving
  const handleSaveBeautyProfile = async (profile: BeautyProfile, diagnosticResult: any) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      skinProfile: profile
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('akwaba_user', JSON.stringify(updatedUser));

    try {
      const dbDiagId = `diag-${Date.now()}`;

      // 1. Direct Firestore setDoc on client-side for absolute instant database replication
      if (isFirebaseAuthed) {
        await setDoc(doc(db, "users", updatedUser.id), { skinProfile: profile }, { merge: true });
        
        // Save matching diagnostic record inside diagnostics collection
        await setDoc(doc(db, "diagnostics", dbDiagId), {
          id: dbDiagId,
          userId: updatedUser.id,
          userName: updatedUser.name,
          userPhone: updatedUser.phone,
          userCity: updatedUser.city || '',
          gender: profile.gender,
          age: profile.age,
          skinType: profile.skinType,
          hairType: profile.hairType,
          concerns: profile.concerns || [],
          result: diagnosticResult,
          createdAt: new Date().toISOString()
        });
      }

      // 2. Hit profile express endpoint for record consistency
      await fetch(`/api/users/${updatedUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });

      // 3. Save diagnostic record to diagnostics collection for admin real-time view
      await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedUser.id,
          userName: updatedUser.name,
          userPhone: updatedUser.phone,
          userCity: updatedUser.city || '',
          profile: profile,
          result: diagnosticResult
        })
      });
    } catch (err) {
      console.error("Beauty profile sync error:", err);
    }
  };

  // Chat conversation messenger API dispatch
  const handleSendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return;
    const senderRole = currentUser.role === 'client' ? 'client' : 'admin';
    const senderName = currentUser.name;

    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderRole,
          senderName,
          message: text
        })
      });
    } catch (err) {
      console.error("Chat sync failed, appending message client-side fallback", err);
      // Fallback local append back to Firestore messages directly
      const fallbackMsgId = `msg-${Date.now()}`;
      await setDoc(doc(db, "messages", fallbackMsgId), {
        id: fallbackMsgId,
        chatId,
        sender: senderRole,
        senderName,
        message: text,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Dispatch product recommendations in-chat
  const handleSendPharmacistPrescription = async (chatId: string, productId: string) => {
    if (!currentUser) return;
    await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'admin',
        senderName: currentUser.name,
        message: "Je vous recommande vivement d'intégrer ce produit cosmétique dans votre routine beauté quotidienne.",
        suggestedProductIds: [productId]
      })
    });
  };

  // Admin operational actions
  const handleAddProduct = async (prodPayload: Omit<Product, 'id' | 'dateAdded'>) => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodPayload)
    });
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    await fetch(`/api/products/${updatedProd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProd)
    });
  };

  const handleDeleteProduct = async (prodId: string) => {
    await fetch(`/api/products/${prodId}`, {
      method: 'DELETE'
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }  // Loading spinner view
  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/20 flex flex-col items-center justify-center font-sans">
        <div className="h-12 w-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-mono text-rose-950 mt-4 tracking-widest uppercase">Omi'i Institut • Chargement...</p>
      </div>
    );
  }

  const cartTotalCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans relative selection:bg-rose-100">
      
      {/* 1. HEADER */}
      <Header
        currentUser={currentUser}
        cart={cart}
        cartCount={cartTotalCount}
        onLogout={handleLogout}
        onOpenCart={() => setActiveTab('cart')}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (!currentUser && (tab === 'diagnostic' || tab === 'chat')) {
            setPendingAction({ type: 'switch_tab', tab });
            setShowLoginModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        adminViewMode={adminViewMode}
        setAdminViewMode={setAdminViewMode}
        onLoginClick={() => {
          setPendingAction(null);
          setShowLoginModal(true);
        }}
      />

      {/* Mode Preview visual banner for administrator preview convenience */}
      {currentUser?.role === 'admin' && adminViewMode === 'client' && (
        <div id="admin-preview-top-alert" className="bg-rose-600 text-white text-xs font-bold py-2.5 px-4 text-center flex flex-col sm:flex-row justify-center items-center gap-1.5 shadow-sm border-b border-rose-500 animate-pulse">
          <span>👀 MODE APERÇU BOUTIQUE ACTIF — Vous visualisez le rendu exact de la boutique côté client.</span>
          <button 
            onClick={() => {
              setAdminViewMode('admin');
              setActiveTab('admin');
            }}
            className="px-3 py-1 bg-zinc-950 font-black tracking-wide hover:bg-zinc-900 rounded-full text-[10px] uppercase cursor-pointer"
          >
            Quitter l'Aperçu & Retourner au Panel
          </button>
        </div>
      )}

      {/* 2. CORE RENDERING ENGINE */}
      <main className="flex-1">
        {(!currentUser || currentUser.role === 'client' || adminViewMode === 'client') ? (
          <>
            {activeTab === 'home' && (
              <Home
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
                onSwitchTab={(tab, arg) => {
                  if (tab === 'categories' && arg) {
                    setPreselectedCategory(arg);
                  }
                  setActiveTab(tab);
                }}
                currentSearchQuery={globalSearchQuery}
                setGlobalSearchQuery={setGlobalSearchQuery}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesGrid
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
                preselectedCategorySlug={preselectedCategory}
                setPreselectedCategorySlug={setPreselectedCategory}
              />
            )}

            {activeTab === 'offers' && (
              <OffersScreen
                products={products}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'cart' && (
              <CartScreen
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                currentUser={currentUser}
                onOrderCreated={handleOrderCreated || ((o) => console.log(o))}
                onRequireLogin={() => {
                  setPendingAction({ type: 'switch_tab', tab: 'cart' });
                  setShowLoginModal(true);
                }}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                currentUser={currentUser}
                orders={orders}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'catalog' && (
              <Catalog
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
              />
            )}

            {activeTab === 'diagnostic' && (
              !currentUser ? (
                <div className="max-w-md mx-auto my-12 p-8 bg-white border border-rose-100 rounded-[2rem] text-center space-y-6 shadow-xs animate-fade-in font-sans">
                  <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-800">
                    <Sparkles className="h-8 w-8 animate-pulse text-rose-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-rose-950">Diagnostic de peau Omi'i Institut</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                      Veuillez vous connecter ou créer un compte pour effectuer votre diagnostic de peau gratuit, obtenir des recommandations d'experts, et échanger en temps réel avec un pharmacien.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPendingAction({ type: 'switch_tab', tab: 'diagnostic' });
                      setShowLoginModal(true);
                    }}
                    className="w-full py-3 bg-rose-950 hover:bg-rose-900 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Se connecter / Créer mon compte client
                  </button>
                </div>
              ) : (
                <BeautyQuestionnaire
                  currentProfile={currentUser?.skinProfile}
                  products={products}
                  onSaveProfile={handleSaveBeautyProfile}
                  onGoHome={() => setActiveTab('home')}
                />
              )
            )}

            {activeTab === 'chat' && currentUser && (
              <PharmacistChat
                currentUser={currentUser}
                products={products}
                currentProfile={currentUser.skinProfile}
                chats={chats}
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendPharmacistPrescription={handleSendPharmacistPrescription}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
              />
            )}
          </>
        ) : (
          currentUser && (
            <AdminPanel
              products={products}
              orders={orders}
              users={users}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              currentUser={currentUser}
              chats={chats}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendPharmacistPrescription={handleSendPharmacistPrescription}
              onAddToCart={handleAddToCart}
              onSelectProductDetails={(product) => setSelectedProduct(product)}
            />
          )
        )}
      </main>

      {/* ======================================= */}
      {/* DRAWER: PRODUCT DETAILS MODAL DETAILCARD */}
      {/* ======================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div 
            onClick={() => setSelectedProduct(null)} 
            className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs"
          ></div>
          <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
            <div className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl text-left border border-rose-50 flex flex-col animate-scale-up">
              
              {/* Product Header image cover */}
              <div className="relative h-64 bg-zinc-100 shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name} 
                  className="h-full w-full object-cover"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 p-2.5 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-full text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Product Card Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-rose-800">
                  <span>Marque CI: {selectedProduct.brand}</span>
                  <span className="text-zinc-400">{selectedProduct.category}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-rose-950 leading-snug">{selectedProduct.name}</h3>
                  <div className="flex items-center space-x-2.5 mt-2">
                    <span className="text-lg font-extrabold text-rose-700">
                      {selectedProduct.promoPrice ? selectedProduct.promoPrice.toLocaleString() : selectedProduct.price.toLocaleString()} F CFA
                    </span>
                    {selectedProduct.promoPrice && (
                      <span className="text-xs text-zinc-400 line-through">
                        {selectedProduct.price.toLocaleString()} F CFA
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-rose-50 pt-3">
                  <h4 className="text-[10px] uppercase font-mono tracking-widest font-black text-zinc-400 mb-1">
                    Description & Conseils d'Utilisation :
                  </h4>
                  <p className="text-xs text-zinc-650 leading-relaxed font-normal">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Shipping conditions & details */}
                <div className="p-3 bg-zinc-50 border rounded-2xl flex items-center space-x-2.5">
                  <span className="text-lg">🌿</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Formulé sans perturbateurs endocriniens, idéal pour sublimer et nourrir la peau sous le climat chaud et humide de l'Afrique de l'Ouest.
                  </p>
                </div>

                {/* Cart Action bottom bar */}
                <div className="pt-3 border-t flex justify-between items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase">Disponibilité locale :</span>
                    <span className={`text-xs font-bold ${selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedProduct.stock > 0 
                        ? `En Stock centrale (${selectedProduct.stock} pces)` 
                        : 'En rupture momentanée'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock === 0}
                    className="px-5 py-3 bg-rose-950 hover:bg-rose-900 font-bold text-xs rounded-xl text-white disabled:opacity-50 transition cursor-pointer"
                  >
                    Mettre dans mon Panier
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. SHOPPING CART DRAWER OVERLAY */}
      <Cart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onOrderCreated={handleOrderCreated}
        onRequireLogin={() => {
          setPendingAction({ type: 'open_cart' });
          setIsCartOpen(false);
          setShowLoginModal(true);
        }}
      />

      {/* ======================================= */}
      {/* PORTAL: LOGIN ON-DEMAND MODAL OVERLAY  */}
      {/* ======================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans" role="dialog">
          <div 
            onClick={() => {
              setShowLoginModal(false);
              setPendingAction(null);
            }} 
            className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs cursor-pointer"
          ></div>
          <div className="flex items-center justify-center min-h-screen p-4 z-55 relative">
            <div className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl border border-rose-50 relative p-6 animate-scale-up">
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  setPendingAction(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-center mb-6">
                <span className="inline-flex h-12 w-12 rounded-full bg-rose-50 text-rose-500 items-center justify-center mb-2">
                  <HeartPulse className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-rose-950">Identification Requise</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Veuillez vous identifier pour enregistrer vos produits, dialoguer avec la conseillère beauté ou valider votre commande.
                </p>
              </div>
              <LoginScreen onLogin={handleLogin} isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-zinc-900 text-zinc-400 py-8 border-t border-zinc-800 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-zinc-200 font-sans">Omi'i Institut — Boutique en Ligne</p>
            <p className="text-[10px] text-zinc-500 mt-1">Votre destination privilégiée pour les produits de beauté et de soins cosmétiques de qualité en Côte d'Ivoire.</p>
          </div>
          <div className="font-mono text-[10px] text-zinc-500 text-center sm:text-right">
            <p>Devise: Franc CFA (XOF)</p>
            <p className="mt-0.5">© 2026 Abidjan, Côte d'Ivoire. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 5. FLOATING CHAT MESSENGER (CLIENT ONLY) */}
      {(!currentUser || currentUser.role !== 'admin' || adminViewMode === 'client') && (
        <div id="floating-messenger-and-toast-portal" className="font-sans">
          
          {/* New Message Toast Overlay */}
          {showNewMsgToast && !isFloatingChatOpen && (
            <div 
              onClick={() => {
                setIsFloatingChatOpen(true);
                setShowNewMsgToast(false);
              }}
              className="fixed bottom-24 right-6 bg-white border border-rose-100 p-4 rounded-3xl shadow-2xl max-w-xs z-50 animate-scale-up flex gap-3 cursor-pointer hover:bg-zinc-50 border-l-4 border-l-rose-500"
            >
              <div className="h-9 w-9 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-rose-950">Message de la conseillère !</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 truncate leading-tight">{toastContent}</p>
                <p className="text-[9px] text-rose-600 mt-1 font-bold font-mono uppercase tracking-wider">Cliquez pour répondre</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewMsgToast(false);
                }}
                className="text-zinc-300 hover:text-zinc-650 p-1 rounded-full text-[10px] self-start"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Floating Compact Chat Window */}
          {isFloatingChatOpen && (
            <div className="fixed bottom-24 right-6 w-80 sm:w-85 h-[420px] bg-white border border-rose-100/70 rounded-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col justify-between animate-scale-up">
              
              {/* Header section with branding */}
              <div className="bg-rose-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-rose-900 shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center shadow">
                    <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">Inès • Conseillère Beauté</h4>
                    <p className="text-[9px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping"></span>
                      <span>En ligne • Abidjan</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFloatingChatOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Masquer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat messages feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
                {!currentUser ? (
                  /* Requiring login scenario */
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                    <span className="text-3xl">💬</span>
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">Dialogue de Routine Privée</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        Pour enregistrer vos rituels, obtenir des diagnostics et discuter avec notre pharmacie, veuillez d'abord vous identifier.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsFloatingChatOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-white font-bold text-[10.5px] rounded-xl transition shadow active:scale-95 cursor-pointer"
                    >
                      S'identifier / S'enregistrer
                    </button>
                  </div>
                ) : (
                  /* Authenticated discussion feed */
                  <>
                    <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-2xl text-[10px] text-zinc-650 leading-relaxed">
                      <p className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                        <span>Omi'i Institut Conseillère IA</span>
                      </p>
                      Posez-moi vos questions ! Mon diagnostic s'améliore si vous décrivez votre type de peau ou routine dans votre espace profil.
                    </div>

                    {messages.filter(m => m.chatId === currentUser.id).length === 0 && (
                      <div className="text-center py-6 text-[10px] text-zinc-400">
                        Aucun message précédent. Lancez la discussion !
                      </div>
                    )}

                    {messages.filter(m => m.chatId === currentUser.id).map((msg) => {
                      const isMe = msg.sender === 'client';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-xs ${
                            isMe ? 'bg-rose-950 text-white rounded-tr-none' : 'bg-white border border-zinc-150 text-zinc-800 rounded-tl-none'
                          }`}>
                            <p className="font-semibold text-[8px] opacity-75 mb-0.5 capitalize">{msg.senderName}</p>
                            <p className="whitespace-pre-line font-normal text-xs leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Chat text box input zone */}
              {currentUser && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!floatingInput.trim()) return;
                    const textToSend = floatingInput;
                    setFloatingInput('');
                    await handleSendMessage(currentUser.id, textToSend);
                  }}
                  className="p-3 bg-white border-t border-rose-50 shrink-0 flex gap-1.5 items-center"
                >
                  <input
                    type="text"
                    required
                    placeholder="Écrivez un message..."
                    value={floatingInput}
                    onChange={(e) => setFloatingInput(e.target.value)}
                    className="flex-1 p-2.5 bg-zinc-50 border border-zinc-150 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-rose-450 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-rose-950 hover:bg-rose-900 text-white rounded-xl transition cursor-pointer active:scale-95 shadow shrink-0"
                    title="Envoyer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}

            </div>
          )}

          {/* Floating trigger button */}
          <button
            onClick={() => {
              setIsFloatingChatOpen(!isFloatingChatOpen);
              setShowNewMsgToast(false);
            }}
            className="fixed bottom-22 right-6 h-14 w-14 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-300 hover:scale-105 active:scale-95 transition cursor-pointer z-50 flex-shrink-0"
            title="Aide & Conseils Beauté"
            aria-label="Contacter la conseillère"
          >
            {isFloatingChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            {/* Pulsating badge indicator for unread administrator messages */}
            {messages.filter(m => currentUser && m.chatId === currentUser.id && m.sender === 'admin').length > 0 && !isFloatingChatOpen && (
              <span className="absolute -top-1 -right-1 bg-red-600 border-2 border-white rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                !
              </span>
            )}
          </button>

        </div>
      )}

      {/* 🧭 STYLISH BOTTOM NAVIGATION BAR (ALWAYS VISIBLE AT THE BOTTOM OVERALL) */}
      <div 
        id="always-visible-bottom-navigation-bar" 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-md py-3 px-6 flex justify-around items-center"
      >
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 ${
            activeTab === 'home' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Accueil</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 ${
            activeTab === 'categories' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Catégories</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 ${
            activeTab === 'offers' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <BadgePercent className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Offres</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              setPendingAction({ type: 'switch_tab', tab: 'diagnostic' });
              setShowLoginModal(true);
            } else {
              setActiveTab('diagnostic');
            }
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 ${
            activeTab === 'diagnostic' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
          <span className="text-[10px] tracking-tight">Diagnostic</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 relative ${
            activeTab === 'cart' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <BottomCartIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Panier</span>
          {cartTotalCount > 0 && (
            <span className="absolute -top-1 right-1 bg-rose-500 text-white font-extrabold text-[8px] h-4 w-4 rounded-full border border-white flex items-center justify-center animate-bounce">
              {cartTotalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition duration-200 active:scale-90 ${
            activeTab === 'profile' ? 'text-rose-600 font-extrabold scale-102' : 'text-zinc-400 hover:text-zinc-650 font-semibold'
          }`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Profil</span>
        </button>
      </div>

    </div>
  );
}
