import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Catalog from './components/Catalog';
import BeautyQuestionnaire from './components/BeautyQuestionnaire';
import PharmacistChat from './components/PharmacistChat';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { Product, Category, User, CartItem, Order, ChatSession, ChatMessage, BeautyProfile } from './types';
import { HeartPulse, Plus, Check, Star, X, Shield, Info, ShoppingBag } from 'lucide-react';
import { db, collection, doc, onSnapshot, setDoc, query, where, authenticateAnonymous } from './lib/firebase';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('catalog');

  // Authentication & Loading States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore Live States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Local UI States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 1. Initial configuration check: load logged-in user session
  useEffect(() => {
    const cached = localStorage.getItem('akwaba_user');
    if (cached) {
      try {
        const parsed: User = JSON.parse(cached);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('catalog');
        }
        // Authenticate anonymously in background to solve FireStore 'auth != null' condition
        authenticateAnonymous().catch((err) => {
          console.error("Silent anonymous login fail:", err);
        });
      } catch {
        localStorage.removeItem('akwaba_user');
      }
    }
    setLoading(false);
  }, []);

  // 2. Real-Time Cloud Firestore Continuous Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // 1) Subscribe to Products Collection
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    }, (err) => console.error("Realtime Products Subscribe error:", err));

    // 2) Subscribe to Categories Collection
    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      const list = snap.docs.map(doc => doc.data() as Category);
      setCategories(list);
    }, (err) => console.error("Realtime Categories Subscribe error:", err));

    // 3) Subscribe to Orders Collection (Secure separation)
    const oQuery = currentUser.role === 'admin'
      ? collection(db, "orders")
      : query(collection(db, "orders"), where("userId", "==", currentUser.id));

    const unsubOrders = onSnapshot(oQuery, (snap) => {
      const list = snap.docs.map(doc => doc.data() as Order);
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(list);
    }, (err) => console.error("Realtime Orders Subscribe error:", err));

    // 4) Subscribe to Chat Sessions Collection (Secure separation)
    const cQuery = currentUser.role === 'admin'
      ? collection(db, "chats")
      : query(collection(db, "chats"), where("id", "==", currentUser.id));

    const unsubChats = onSnapshot(cQuery, (snap) => {
      const list = snap.docs.map(doc => doc.data() as ChatSession);
      setChats(list);
    }, (err) => console.error("Realtime Chats Subscribe error:", err));

    // 5) Subscribe to Global Users List (Only for Admin to display Client names, profiles and statistics)
    let unsubUsers = () => {};
    if (currentUser.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const list = snap.docs.map(doc => doc.data() as User);
        setUsers(list);
      }, (err) => console.error("Realtime Users Subscribe error:", err));
    }

    // 6) Subscribe to User Basket/Cart dynamically linked to db
    let unsubCart = () => {};
    if (currentUser.role === 'client') {
      unsubCart = onSnapshot(doc(db, "carts", currentUser.id), (docSnap) => {
        if (docSnap.exists()) {
          setCart(docSnap.data().items || []);
        }
      }, (err) => console.error("Realtime Cart sync error:", err));
    }

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubChats();
      unsubUsers();
      unsubCart();
    };
  }, [currentUser]);

  // 3. Real-Time Chat messages sync
  useEffect(() => {
    if (!currentUser) return;

    // Listen to ALL messages so chat feeds can filter them instantly in real time
    const unsubMessages = onSnapshot(collection(db, "messages"), (snap) => {
      const list = snap.docs.map(doc => doc.data() as ChatMessage);
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(list);
    }, (err) => console.error("Realtime Messages Subscribe error:", err));

    return () => {
      unsubMessages();
    };
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

      // Persist profile to Firestore users list
      await setDoc(doc(db, "users", synchronizedUser.id), synchronizedUser, { merge: true });

      // Save locally
      localStorage.setItem('akwaba_user', JSON.stringify(synchronizedUser));
      setCurrentUser(synchronizedUser);

      if (synchronizedUser.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('catalog');
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

  // E-commerce Cart Operations with synchronous database replication
  const syncCartWithDb = async (newCart: CartItem[]) => {
    setCart(newCart);
    if (currentUser && currentUser.role === 'client') {
      try {
        await setDoc(doc(db, "carts", currentUser.id), { items: newCart }, { merge: true });
      } catch (err) {
        console.error("Failed to sync cart to Firestore:", err);
      }
    }
  };

  const handleAddToCart = (product: Product) => {
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
      // Synchronize back to database
      await setDoc(doc(db, "users", currentUser.id), updatedUser, { merge: true });
      
      // Hit profile express endpoint for record consistency
      await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
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
  };

  // Loading spinner view
  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50/20 flex flex-col items-center justify-center font-sans">
        <div className="h-12 w-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
        <p className="text-xs font-mono text-rose-950 mt-4 tracking-widest uppercase">Akwaba Beauté • Chargement...</p>
      </div>
    );
  }

  // Mandatory Authentication Redirect
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
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
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. CORE RENDERING ENGINE */}
      <main className="flex-1">
        {currentUser.role === 'client' ? (
          <>
            {activeTab === 'catalog' && (
              <Catalog
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
              />
            )}

            {activeTab === 'diagnostic' && (
              <BeautyQuestionnaire
                currentProfile={currentUser.skinProfile}
                products={products}
                onSaveProfile={handleSaveBeautyProfile}
              />
            )}

            {activeTab === 'chat' && (
              <PharmacistChat
                currentUser={currentUser}
                products={products}
                currentProfile={currentUser.skinProfile}
                chats={chats}
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendPharmacistPrescription={handleSendPharmacistPrescription}
                onAddToCart={handleAddToCart}
              />
            )}
          </>
        ) : (
          <AdminPanel
            products={products}
            orders={orders}
            users={users}
            categories={categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
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
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
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
      />

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-zinc-900 text-zinc-400 py-8 border-t border-zinc-800 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-zinc-200 font-sans">Akwaba Beauté Côte d'Ivoire — Boutique en Ligne</p>
            <p className="text-[10px] text-zinc-500 mt-1">Votre destination privilégiée pour les produits de beauté et de soins cosmétiques de qualité en Côte d'Ivoire.</p>
          </div>
          <div className="font-mono text-[10px] text-zinc-500 text-center sm:text-right">
            <p>Devise: Franc CFA (XOF)</p>
            <p className="mt-0.5">© 2026 Abidjan, Côte d'Ivoire. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
