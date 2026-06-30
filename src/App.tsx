import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import ProductDetailSheet from './components/ProductDetailSheet';
import { Product, Category, User, CartItem, Order, ChatSession, ChatMessage, BeautyProfile } from './types';
import { HeartPulse, Plus, Check, Star, X, Shield, Info, ShoppingBag, MessageSquare, Send, Sparkles, Home as HomeIcon, Grid3X3, BadgePercent, ShoppingCart as BottomCartIcon, User as UserIcon } from 'lucide-react';
import { db, collection, doc, onSnapshot, setDoc, deleteDoc, query, where, authenticateAnonymous, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  // Navigation tabs - Default with home (Accueil) per full-UI overhaul guidelines
  const [activeTab, setActiveTab] = useState<string>('home');
  const [preselectedCategory, setPreselectedCategory] = useState<any>('tous');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'client'>('admin');

  // Authentication & Loading States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
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
        console.warn("Silent anonymous login fail, using public client-side Firestore access:", err);
        setIsFirebaseAuthed(true); // Enable real-time listeners under public rules fallback
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

  // Handle background data readiness splash screen dismissal
  useEffect(() => {
    // Dismiss when products and categories are loaded, ensuring minimum reading display of 1.5s
    if (products.length > 0 && categories.length > 0) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [products.length, categories.length]);

  // Safety/fallback timeout so the app never hangs indefinitely
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 4000);
    return () => clearTimeout(safetyTimer);
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
        console.warn("Realtime Messages Subscribe warning (using fallback polling):", err);
      });

      // 4) Subscribe to Users Collection (Admin only) or own user document (Client)
      if (currentUser.role === 'admin') {
        unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
          const list = snap.docs.map(doc => doc.data() as User);
          setUsers(list);
        }, (err) => {
          console.warn("Realtime Users Subscribe warning:", err);
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
          console.warn("Realtime own user doc Subscribe warning:", err);
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
        console.warn("Realtime Orders Subscribe warning:", err);
      });

      // 6) Subscribe to Chats Collection (Real-time updates)
      const chatsRef = collection(db, "chats");
      const chatsQuery = currentUser.role === 'admin'
        ? query(chatsRef)
        : query(chatsRef, where("id", "==", currentUser.id));

      unsubChats = onSnapshot(chatsQuery, (snap) => {
        const list = snap.docs.map(doc => doc.data() as ChatSession);
        // Sort conversations by their latest activity timestamp
        list.sort((a, b) => new Date(b.lastTimestamp || 0).getTime() - new Date(a.lastTimestamp || 0).getTime());
        setChats(list);
      }, (err) => {
        console.warn("Realtime Chats Subscribe warning:", err);
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
          // Only use REST polling as fallback if Firestore is not authenticated/available
          if (!isFirebaseAuthed) {
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
                chatList.sort((a, b) => new Date(b.lastTimestamp || 0).getTime() - new Date(a.lastTimestamp || 0).getTime());
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
  }, [currentUser, isFirebaseAuthed]);

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
    setSelectedProduct(null); // Return to standard view from ProductDetailSheet
    setActiveTab('profile');  // Automatically redirect to profile screen to view order and invoice
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // 1. Delete from Firestore SDK
      if (isFirebaseAuthed) {
        const orderRef = doc(db, "orders", orderId);
        await deleteDoc(orderRef);
      }

      // 2. Delete from server-side database as well
      await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      // 3. Update local state
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Error deleting order:", err);
    }
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
    const msgId = `msg-${Date.now()}`;

    const newChatMessage: ChatMessage = {
      id: msgId,
      chatId,
      sender: senderRole,
      senderName,
      message: text,
      timestamp: new Date().toISOString()
    };

    // 0. Optimistic UI updates for immediate feedback
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      const updated = [...prev, newChatMessage];
      updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return updated;
    });

    setChats((prev) => {
      const exists = prev.some((c) => c.id === chatId);
      if (!exists) {
        const newSession: ChatSession = {
          id: chatId,
          clientName: senderRole === 'client' ? senderName : 'Client',
          clientPhone: '',
          lastMessage: text,
          lastTimestamp: newChatMessage.timestamp,
          active: true,
          unreadCount: senderRole === 'client' ? 1 : 0
        };
        return [newSession, ...prev];
      }
      return prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: text,
            lastTimestamp: newChatMessage.timestamp,
            unreadCount: senderRole === 'client' ? (c.unreadCount || 0) + 1 : 0
          };
        }
        return c;
      });
    });

    // 1. Instant optimistic local write to Firestore (visible to snapshots instantly)
    try {
      await setDoc(doc(db, "messages", msgId), newChatMessage);
      // Synchronize latest message summary in chats session document
      await setDoc(doc(db, "chats", chatId), {
        id: chatId,
        lastMessage: text,
        lastTimestamp: newChatMessage.timestamp,
        active: true
      }, { merge: true });
    } catch (err) {
      console.error("Direct message write failed, using API sync only", err);
    }

    // 2. Async Express sync in the background
    fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: msgId,
        sender: senderRole,
        senderName,
        message: text
      })
    }).catch(err => {
      console.error("Express synchronization failed in background:", err);
    });
  };

  // Dispatch product recommendations in-chat
  const handleSendPharmacistPrescription = async (chatId: string, productId: string) => {
    if (!currentUser) return;
    const msgId = `msg-${Date.now()}`;
    const recommendationText = "Je vous recommande vivement d'intégrer ce produit cosmétique dans votre routine beauté quotidienne.";
    
    const newChatMessage: ChatMessage = {
      id: msgId,
      chatId,
      sender: "admin",
      senderName: currentUser.name,
      message: recommendationText,
      timestamp: new Date().toISOString(),
      suggestedProductIds: [productId]
    };

    // 0. Optimistic UI updates
    setMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      const updated = [...prev, newChatMessage];
      updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return updated;
    });

    setChats((prev) => {
      return prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: recommendationText,
            lastTimestamp: newChatMessage.timestamp,
            unreadCount: 0
          };
        }
        return c;
      });
    });

    // 1. Instant optimistic local write to Firestore (visible to snapshots instantly)
    try {
      await setDoc(doc(db, "messages", msgId), newChatMessage);
      // Synchronize latest message summary in chats session document
      await setDoc(doc(db, "chats", chatId), {
        id: chatId,
        lastMessage: recommendationText,
        lastTimestamp: newChatMessage.timestamp,
        active: true
      }, { merge: true });
    } catch (err) {
      console.error("Direct prescription write failed, using API sync only", err);
    }

    // 2. Async Express sync in the background
    fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: msgId,
        sender: "admin",
        senderName: currentUser.name,
        message: recommendationText,
        suggestedProductIds: [productId]
      })
    }).catch(err => {
      console.error("Express prescription synchronization failed in background:", err);
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, "messages", messageId));
    } catch (err) {
      console.error("Firestore message delete failed, syncing in background:", err);
    }
    fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      .catch(err => console.error("Express delete message failed:", err));
  };

  const handleDeleteChatSession = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, "chats", chatId));
    } catch (err) {
      console.error("Firestore chat session delete failed, syncing in background:", err);
    }
    fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
      .catch(err => console.error("Express delete chat session failed:", err));
  };

  // Admin operational actions
  const handleAddProduct = async (prodPayload: Omit<Product, 'id' | 'dateAdded'>) => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...prodPayload,
      id,
      dateAdded: new Date().toISOString()
    };

    // 1. Instantly write to Firestore client-side for instant sync across all users
    try {
      await setDoc(doc(db, "products", id), newProduct);
      console.log("Directly added product to Firestore:", id);
    } catch (err) {
      console.error("Direct Firestore product add failed:", err);
    }

    // 2. Parallel backup sync to backend database
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prodPayload, id })
      });
    } catch (err) {
      console.error("Express add product sync failed:", err);
    }
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    // 1. Instantly write to Firestore client-side for instant sync across all users
    try {
      const cleanProd = { ...updatedProd };

      // Clean up promotional fields if they are unset/removed
      if (cleanProd.promoPrice === undefined || cleanProd.promoPrice === null || cleanProd.promoPrice <= 0) {
        delete cleanProd.promoPrice;
        delete (cleanProd as any).discountRate;
        delete (cleanProd as any).isOnSale;
        delete (cleanProd as any).promoPercentage;
        delete (cleanProd as any).discount;
      }

      // Remove undefined properties to avoid Firestore errors
      Object.keys(cleanProd).forEach((key) => {
        if (cleanProd[key as keyof Product] === undefined) {
          delete cleanProd[key as keyof Product];
        }
      });

      await setDoc(doc(db, "products", cleanProd.id), cleanProd);
      console.log("Directly updated product in Firestore:", cleanProd.id);
    } catch (err) {
      console.error("Direct Firestore product update failed:", err);
    }

    // 2. Parallel backup sync to backend database
    try {
      const cleanPayload = { ...updatedProd };
      if (cleanPayload.promoPrice === undefined || cleanPayload.promoPrice === null || cleanPayload.promoPrice <= 0) {
        delete cleanPayload.promoPrice;
        delete (cleanPayload as any).discountRate;
        delete (cleanPayload as any).isOnSale;
        delete (cleanPayload as any).promoPercentage;
        delete (cleanPayload as any).discount;
      }
      Object.keys(cleanPayload).forEach((key) => {
        if (cleanPayload[key as keyof Product] === undefined) {
          delete cleanPayload[key as keyof Product];
        }
      });

      await fetch(`/api/products/${updatedProd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload)
      });
    } catch (err) {
      console.error("Express update product sync failed:", err);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    // 1. Instantly delete from Firestore client-side for instant sync across all users
    try {
      await deleteDoc(doc(db, "products", prodId));
      console.log("Directly deleted product from Firestore:", prodId);
    } catch (err) {
      console.error("Direct Firestore product delete failed:", err);
    }

    // 2. Parallel backup sync to backend database
    try {
      await fetch(`/api/products/${prodId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Express delete product sync failed:", err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    // 1. Instantly write to Firestore client-side so it is visible in real-time
    try {
      await setDoc(doc(db, "orders", orderId), { status }, { merge: true });
      console.log("Updated order status directly in Firestore:", orderId, status);
    } catch (err) {
      console.error("Direct status update failed:", err);
    }

    // 2. Fallback backend sync
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error("Express order status sync failed:", err);
    }

    // 3. Automated Chat Notification if validated or cancelled
    const orderObj = orders.find(o => o.id === orderId);
    if (orderObj) {
      const clientName = orderObj.customerName;
      const chatId = orderObj.userId; // client's userId is the chatId
      let autoMessageText = '';

      if (status === 'Confirmée') {
        autoMessageText = `félicitations 🎊 votre commande a été transmise ${clientName} nous sommes toujours disponibles pour nouvelle commande à bientôt 🥰`;
      } else if (status === 'Annulée') {
        const firstItemName = orderObj.items?.[0]?.name || "produit";
        const itemsCount = orderObj.items?.length || 0;
        const productsListText = itemsCount > 1 
          ? `les produits "${orderObj.items.map(i => i.name).join(' & ')}"` 
          : `le produit "${firstItemName}"`;
        autoMessageText = `produit ${productsListText} annulé vous pouvez passer une nouvelle demande si vous le souhaitez nous sommes toujours là à votre disposition pour une nouvelle demande merci 🫡`;
      }

      if (autoMessageText) {
        const msgId = `msg-${Date.now()}`;
        const autoMsg: ChatMessage = {
          id: msgId,
          chatId,
          sender: 'admin',
          senderName: 'Omi\'i Institut - Service Conseil',
          message: autoMessageText,
          timestamp: new Date().toISOString()
        };

        // Write directly to Firestore messages collection so it is seen instantly
        try {
          await setDoc(doc(db, "messages", msgId), autoMsg);
          console.log("Automated status message saved to Firestore:", msgId);
        } catch (err) {
          console.error("Direct status message write failed:", err);
        }

        // Sync with backend so the chat session gets updated (lastMessage, etc.)
        fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: msgId,
            sender: 'admin',
            senderName: 'Omi\'i Institut - Service Conseil',
            message: autoMessageText
          })
        }).catch(err => {
          console.error("Express automated message synchronization failed in background:", err);
        });
      }
    }
  };

  const showSplash = loading || isInitialLoading;
  const cartTotalCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fff0f2] flex flex-col font-sans relative selection:bg-rose-100">
      {/* 0. BRAND LUXURY SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-50/50 via-white to-pink-50/30 -z-10" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-md space-y-8"
            >
              <div className="relative h-40 w-40 mx-auto rounded-full bg-gradient-to-tr from-rose-100 to-pink-50 flex items-center justify-center shadow-lg shadow-rose-100/40">
                <motion.img
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  referrerPolicy="no-referrer"
                  src="https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/28232fd8-ce18-4f8a-bb58-4e684a6feb11.png"
                  alt="Omi'i Institut"
                  className="h-32 w-32 object-contain"
                />
                <div className="absolute inset-0 rounded-full border border-rose-200/50 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-3">
                <motion.h1 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-black tracking-tight text-rose-950 font-sans"
                >
                  Omi'i Institut
                </motion.h1>
                <motion.p 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs uppercase tracking-widest text-rose-600 font-extrabold font-mono"
                >
                  Boutique Cosmétique & Soins Premium
                </motion.p>
              </div>

              <div className="space-y-2 pt-4">
                <div className="h-1 w-48 bg-rose-100 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    animate={{ 
                      x: [-192, 192] 
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="h-full w-full bg-gradient-to-r from-rose-400 to-pink-600 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-mono font-medium tracking-wide">
                  Chargement de votre rituel de beauté ivoirien...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          selectedProduct ? (
            <ProductDetailSheet
              product={selectedProduct}
              allProducts={products}
              currentUser={currentUser}
              onAddToCart={handleAddToCart}
              onOrderCreated={handleOrderCreated}
              onClearCart={handleClearCart}
              onClose={() => setSelectedProduct(null)}
              onSelectProduct={setSelectedProduct}
              onRequireLogin={() => {
                setPendingAction(null);
                setShowLoginModal(true);
              }}
            />
          ) : (
            <>
              {activeTab === 'home' && (
              <Home
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cart={cart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
                onSwitchTab={(tab, arg) => {
                  if (tab === 'categories' && arg) {
                    setPreselectedCategory(arg);
                  }
                  setActiveTab(tab);
                }}
                currentSearchQuery={globalSearchQuery}
                setGlobalSearchQuery={setGlobalSearchQuery}
                currentUser={currentUser}
                onShowLogin={() => setShowLoginModal(true)}
                onSendMessage={async (text) => {
                  if (currentUser) {
                    await handleSendMessage(currentUser.id, text);
                  }
                }}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesGrid
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cart={cart}
                onSelectProductDetails={(product) => setSelectedProduct(product)}
                preselectedCategorySlug={preselectedCategory}
                setPreselectedCategorySlug={setPreselectedCategory}
              />
            )}

            {activeTab === 'offers' && (
              <OffersScreen
                products={products}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cart={cart}
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
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === 'catalog' && (
              <Catalog
                products={products}
                categories={categories}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cart={cart}
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
          )
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
              onDeleteMessage={handleDeleteMessage}
              onDeleteChatSession={handleDeleteChatSession}
            />
          )
        )}
      </main>



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
            <div className="fixed bottom-40 right-6 w-80 sm:w-85 h-[420px] bg-white border border-rose-100/70 rounded-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col justify-between animate-scale-up">
              
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
                        <span>Omi'i Institut - Service Conseil</span>
                      </p>
                      Bienvenue dans votre équipe conseil Omi'i Institut. Posez toutes vos questions à notre équipe pour obtenir des routines et articles adaptés !
                    </div>
 
                    {messages.filter(m => m.chatId === currentUser.id && (m.sender === 'client' || m.sender === 'admin')).length === 0 && (
                      <div className="text-center py-6 text-[10px] text-zinc-400">
                        Aucun message précédent. Lancez la discussion !
                      </div>
                    )}
 
                    {messages.filter(m => m.chatId === currentUser.id && (m.sender === 'client' || m.sender === 'admin')).map((msg) => {
                      const isMe = msg.sender === 'client';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
                          <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-xs ${
                            isMe ? 'bg-rose-950 text-white rounded-tr-none' : 'bg-white border border-zinc-150 text-zinc-800 rounded-tl-none'
                          }`}>
                            <p className="font-semibold text-[8px] opacity-75 mb-0.5 capitalize">{msg.senderName}</p>
                            <p className="whitespace-pre-line font-normal text-xs leading-relaxed">{msg.message}</p>

                            {/* Prescribed products suggestions inserted in chat */}
                            {msg.suggestedProductIds && msg.suggestedProductIds.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-zinc-150 space-y-2">
                                <p className="text-[9px] uppercase tracking-wide font-extrabold text-rose-600">Recommandations de soins :</p>
                                {msg.suggestedProductIds.map((pId) => {
                                  const pObj = products.find((p) => p.id === pId);
                                  if (!pObj) return null;
                                  return (
                                    <div 
                                      key={pId} 
                                      onClick={() => setSelectedProduct(pObj)}
                                      className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-xl flex flex-col gap-2 border border-zinc-200 shadow-xs transition cursor-pointer group text-left mt-2"
                                    >
                                      <div className="flex gap-2 items-center">
                                        <img 
                                          src={pObj.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=150&auto=format&fit=crop'} 
                                          alt={pObj.name} 
                                          className="h-10 w-10 object-cover rounded-lg shrink-0 border border-zinc-100" 
                                        />
                                        <div className="min-w-0 flex-1">
                                          <h4 className="font-bold text-[10px] text-rose-950 group-hover:text-rose-700 transition-colors line-clamp-1">{pObj.name}</h4>
                                          <p className="text-[8px] text-zinc-455 font-medium">{pObj.brand} • {pObj.category}</p>
                                        </div>
                                      </div>
                                      {pObj.description && (
                                        <p className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed">{pObj.description}</p>
                                      )}
                                      <div className="flex items-center justify-between mt-1 gap-1.5 pt-1.5 border-t border-zinc-150">
                                        <p className="text-[10px] font-black text-rose-800">
                                          {pObj.promoPrice ? (
                                            <span className="flex items-center gap-1">
                                              <span>{pObj.promoPrice} CFA</span>
                                              <span className="text-[8px] text-zinc-400 line-through font-normal">{pObj.price} CFA</span>
                                            </span>
                                          ) : (
                                            <span>{pObj.price} CFA</span>
                                          )}
                                        </p>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(pObj);
                                          }}
                                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] rounded-md flex items-center space-x-1 cursor-pointer transition"
                                        >
                                          <ShoppingBag className="h-2.5 w-2.5" />
                                          <span>Ajouter</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

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
