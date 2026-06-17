import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Catalog from './components/Catalog';
import BeautyQuestionnaire from './components/BeautyQuestionnaire';
import PharmacistChat from './components/PharmacistChat';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import { Product, Category, User, CartItem, Order, ChatSession, ChatMessage, BeautyProfile } from './types';
import { HeartPulse, Plus, Check, Star, X, Shield, Info, ShoppingBag } from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('catalog');

  // Backend Synchronized States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([
    {
      id: 'usr-client-sim',
      name: 'Awa Diop',
      phone: '0701020304',
      email: 'awa.diop@gmail.com',
      city: 'Abidjan',
      address: 'Riviera Bonoumin, Boulevard Latrille',
      role: 'client'
    }
  ]);
  
  // Shopping Cart & Overlays
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Authentication state simulation
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-client-sim',
    name: 'Awa Diop',
    phone: '0701020304',
    email: 'awa.diop@gmail.com',
    city: 'Abidjan',
    address: 'Riviera Bonoumin, Boulevard Latrille',
    role: 'client'
  });

  // Fetch initial collections
  const loadData = async () => {
    try {
      const [resProd, resCat, resOrders, resChats, resMessages] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/chats').then((r) => r.json()),
        fetch(`/api/chats/usr-client-sim/messages`).then((r) => r.json().catch(() => []))
      ]);

      if (Array.isArray(resProd)) setProducts(resProd);
      if (Array.isArray(resCat)) setCategories(resCat);
      if (Array.isArray(resOrders)) setOrders(resOrders);
      if (Array.isArray(resChats)) setChats(resChats);
      if (Array.isArray(resMessages)) setMessages(resMessages);
    } catch (err) {
      console.error('Failure to load full-stack collections, using static fallback routines', err);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh stats and databases on user role shifts to ensure consistency
  }, [currentUser.role]);

  // Handle Dynamic Simulated user role switcher
  const handleRoleChange = (role: 'client' | 'admin') => {
    let name = 'Awa Diop';
    let phone = '0701020304';
    let email = 'awa.diop@gmail.com';
    let id = 'usr-client-sim';

    if (role === 'admin') {
      name = 'Responsable Boutique';
      phone = '0140203040';
      email = 'admin@cosmetiques.ci';
      id = 'usr-admin-sim';
    }

    const updatedUser: User = {
      id,
      name,
      phone,
      email,
      city: 'Abidjan',
      address: 'Cocody Ambassades',
      role,
      skinProfile: currentUser.skinProfile
    };

    setCurrentUser(updatedUser);
    
    // Auto-migrate tab to fit role context
    if (role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('catalog');
    }
  };

  // E-commerce Shopping Cart Reducers
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Callback on simulated Mobile Money success checkout
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    // refresh logs
    loadData();
  };

  // Questionnaire diagnostic profile save callback
  const handleSaveBeautyProfile = (profile: BeautyProfile, diagnosticResult: any) => {
    setCurrentUser((prev) => ({
      ...prev,
      skinProfile: profile
    }));
    // save beauty profile to db on server
    fetch(`/api/users/${currentUser.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...currentUser,
        skinProfile: profile
      })
    }).then(() => loadData());
  };

  // Communication message dispatcher
  const handleSendMessage = async (chatId: string, text: string) => {
    const senderRole = currentUser.role === 'client' ? 'client' : 'admin';
    const senderName = currentUser.role === 'client' ? currentUser.name : 'Responsable Boutique';

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderRole,
          senderName,
          message: text
        })
      });
      
      if (!response.ok) throw new Error();
      const updatedMessages = await response.json();
      setMessages(updatedMessages);
      
      // reload chat session counts
      const resChats = await fetch('/api/chats').then((r) => r.json());
      setChats(resChats);
    } catch (err) {
      console.error(err);
      // fallback message update locally
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        chatId,
        sender: senderRole,
        senderName,
        message: text,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Administration recommendation injected directly to chat
  const handleSendPharmacistPrescription = async (chatId: string, productId: string) => {
    const response = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'admin',
        senderName: 'Responsable Boutique',
        message: "Je vous recommande vivement d'intégrer ce produit cosmétique dans votre routine beauté quotidienne.",
        suggestedProductIds: [productId]
      })
    });
    if (response.ok) {
      const updatedMessages = await response.json();
      setMessages(updatedMessages);
    }
  };

  // Administration interactions callbacks to database
  const handleAddProduct = async (prodPayload: Omit<Product, 'id' | 'dateAdded'>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodPayload)
    });
    if (res.ok) loadData();
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    const res = await fetch(`/api/products/${updatedProd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProd)
    });
    if (res.ok) loadData();
  };

  const handleDeleteProduct = async (prodId: string) => {
    const res = await fetch(`/api/products/${prodId}`, {
      method: 'DELETE'
    });
    if (res.ok) loadData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) loadData();
  };

  const cartTotalCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <Header
        currentUser={currentUser}
        cart={cart}
        cartCount={cartTotalCount}
        onRoleChange={handleRoleChange}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. CORE ROUTE VIEWS */}
      <main className="flex-1">
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

        {activeTab === 'admin' && currentUser.role === 'admin' && (
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
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-left border border-rose-50 flex flex-col">
              
              {/* Product Header image cover */}
              <div className="relative h-64 bg-zinc-100 shrink-0">
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name} 
                  className="h-full w-full object-cover"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 p-2 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-full text-white transition-opacity"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Product Card Details bio */}
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
      />

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-zinc-900 text-zinc-400 py-8 border-t border-zinc-800 text-xs">
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
