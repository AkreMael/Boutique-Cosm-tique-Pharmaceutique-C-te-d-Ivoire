import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Firebase Web Client SDK wrapper to securely connect to filant225-base
const firebaseConfig = {
  apiKey: "AIzaSyDvsEfOOwGFrM6k8JaxH8wF_f1lUVjCHdY",
  authDomain: "filant225-base.firebaseapp.com",
  databaseURL: "https://filant225-base-default-rtdb.firebaseio.com",
  projectId: "filant225-base",
  storageBucket: "filant225-base.firebasestorage.app",
  messagingSenderId: "620102449526",
  appId: "1:620102449526:web:aa08be2ad15df821682257",
  measurementId: "G-PGQNBNME48"
};

const firebaseApp = initializeApp(firebaseConfig);
const clientDb = getFirestore(firebaseApp);
const clientAuth = getAuth(firebaseApp);

let authPromise: Promise<any> | null = null;

async function ensureAuth() {
  if (clientAuth.currentUser) {
    return clientAuth.currentUser;
  }
  if (!authPromise) {
    console.log("Ensuring Firestore auth is active on backend...");
    authPromise = signInAnonymously(clientAuth)
      .then((cred) => {
        console.log("Backend Firestore authenticated with UID:", cred.user.uid);
        return cred.user;
      })
      .catch((err) => {
        authPromise = null;
        console.error("Backend Firestore auth handshake fail:", err);
        throw err;
      });
  }
  return authPromise;
}

// Initial preemptive trigger so that startup seeding is quick
ensureAuth().catch((err) => console.log("Preemptive auth trigger warning:", err.message));

// High-fidelity compatibility wrapper for Admin SDK structure in server.ts
class DocRefCompat {
  constructor(private collName: string, private docId: string) {}

  async get() {
    await ensureAuth();
    const snap = await getDoc(doc(clientDb, this.collName, this.docId));
    return {
      exists: snap.exists(),
      id: snap.id,
      data: () => snap.data()
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    await ensureAuth();
    await setDoc(doc(clientDb, this.collName, this.docId), data, options);
  }

  async update(data: any) {
    await ensureAuth();
    await updateDoc(doc(clientDb, this.collName, this.docId), data);
  }

  async delete() {
    await ensureAuth();
    await deleteDoc(doc(clientDb, this.collName, this.docId));
  }
}

class QueryCompat {
  constructor(protected collName: string, protected constraints: QueryConstraint[] = []) {}

  where(field: string, op: any, value: any) {
    return new QueryCompat(this.collName, [...this.constraints, where(field, op, value)]);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryCompat(this.collName, [...this.constraints, orderBy(field, direction)]);
  }

  limit(num: number) {
    return new QueryCompat(this.collName, [...this.constraints, limit(num)]);
  }

  async get() {
    await ensureAuth();
    const q = query(collection(clientDb, this.collName), ...this.constraints);
    const snap = await getDocs(q);
    return {
      empty: snap.empty,
      size: snap.size,
      docs: snap.docs.map(d => ({
        id: d.id,
        data: () => d.data(),
        exists: d.exists()
      }))
    };
  }
}

class CollectionCompat extends QueryCompat {
  constructor(name: string) {
    super(name);
  }

  doc(id: string) {
    return new DocRefCompat(this.collName, id);
  }
}

const adminDb = {
  collection(name: string) {
    return new CollectionCompat(name);
  }
} as any;

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  console.log("Found GEMINI_API_KEY! Initializing Gemini client...");
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. Skincare diagnosis and conversational pharmacist replies will use high-quality, pre-defined expert templates.");
}

// Authentic initial seed items for Côte d'Ivoire
const SEED_PRODUCTS = [
  // 1. Produits pharmaceutiques / soins de peau (soins-peau)
  {
    id: "prod-1",
    name: "Sérum Anti-Taches Intensif",
    description: "Sérum pharmaceutique concentré à 10% de niacinamide et 2% d'alpha arbutine. Estompe efficacement les taches brunes et l'hyperpigmentation causées par le soleil tropical.",
    price: 9500,
    promoPrice: 8500,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-01T10:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-2",
    name: "Gel Moussant Anti-Acné Purifiant",
    description: "Gel nettoyant enrichi en acide salicylique et extrait d'arbre à thé. Élimine l'excès de sébum et traite l'acné bactérienne sous le climat chaud et humide.",
    price: 6500,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "SoinPur Pharma",
    dateAdded: "2026-06-02T11:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-3",
    name: "Soin Correcteur Intense de Teint",
    description: "Gel Correcteur formulé pour stabiliser la mélanine et réduire les rougeurs cutanées. Idéal pour retrouver un teint clarifié sans décoloration agressive.",
    price: 11000,
    promoPrice: 9900,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1612244314422-6db2722b5120?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "Or Biologique",
    dateAdded: "2026-06-03T12:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-4",
    name: "Soin Éclaircissant Actif Douceur",
    description: "Crème dermatologique aux extraits naturels d'algues et de racine de réglisse. Clarifie, apporte éclat et unifie le teint en toute sécurité et douceur.",
    price: 12500,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-04T09:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-5",
    name: "Soin Hydratant Apaisant d'Abidjan",
    description: "Émulsion ultra-légère à l'acide hyaluronique pur et extraits d'aloe vera. Hydrate intensément pendant 24 heures sans boucher les pores ni faire briller la zone T.",
    price: 7500,
    promoPrice: 6500,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "SoinPur Pharma",
    dateAdded: "2026-06-05T14:15:00Z",
    isAvailable: true
  },
  {
    id: "prod-6",
    name: "Sérum Anti-Imperfections & Points noirs",
    description: "Sérum exfoliant doux dosé en AHA/BHA naturels. Favorise le renouvellement cellulaire de l'épiderme, resserre les pores dilatés et laisse un grain de peau net.",
    price: 8500,
    stock: 28,
    images: ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop"],
    category: "soins-peau",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-06T11:45:00Z",
    isAvailable: true
  },

  // 2. Crèmes et soins visage / corps (cremes-soins)
  {
    id: "prod-7",
    name: "Crème Visage Nourrissante Karité",
    description: "Soin onctueux quotidien pour restaurer le film hydrolipidique protecteur du visage. Enrichie au beurre de karité bio premium et vitamines E.",
    price: 5500,
    stock: 40,
    images: ["https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Ebène Secrets",
    dateAdded: "2026-06-07T12:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-8",
    name: "Lait Corporel Hydratation Profonde",
    description: "Lait corporel régénérant et adoucissant longue durée. Laisse la peau infiniment douce, satinée et délicatement parfumée aux essences de fleurs d'Afrique.",
    price: 8000,
    promoPrice: 7000,
    stock: 45,
    images: ["https://images.unsplash.com/photo-1519689680058-324335c77ebe?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Ebène Secrets",
    dateAdded: "2026-06-08T09:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-9",
    name: "Lait Éclaircissant Hydratant aux Fruits",
    description: "Une combinaison unique d'acides de fruits (AHA) et d'agents protecteurs pour une hydratation satinée tout en unifiant en douceur la couleur de la peau.",
    price: 13500,
    stock: 22,
    images: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Aura Cosmétiques",
    dateAdded: "2026-06-09T13:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-10",
    name: "Crème Anti-Taches & Rides Reconstituante",
    description: "Crème riche de nuit ciblant le renouvellement nocturne de la peau. Combat l'hyperpigmentation localisée et tonifie la texture cutanée du visage.",
    price: 11500,
    stock: 19,
    images: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Aura Cosmétiques",
    dateAdded: "2026-06-10T11:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-11",
    name: "Soin Réparateur Cutané SOS",
    description: "Crème barrière protectrice idéale pour apaiser instantanément les irritations mineures de toute la famille (frottements, coups de soleil, sécheresse sévère).",
    price: 6000,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Ebène Secrets",
    dateAdded: "2026-06-11T16:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-12",
    name: "Crème Corps Fondante Karité & Aloès",
    description: "Alliance parfaite entre la richesse réparatrice du beurre de karité et la fraîcheur régénérante de l'aloé vera de Côte d'Ivoire.",
    price: 8500,
    promoPrice: 7500,
    stock: 24,
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop"],
    category: "cremes-soins",
    brand: "Aura Cosmétiques",
    dateAdded: "2026-06-12T10:45:00Z",
    isAvailable: true
  },

  // 3. Pommades et traitements (pommades-traitements)
  {
    id: "prod-13",
    name: "Pommade Unifiante Teint Sublime",
    description: "Formule soyeuse concentrée qui nourrit la peau et apporte un éclat incomparable. Pour un teint caramélisé, satiné et exempt d'imperfections de couleur.",
    price: 7000,
    stock: 50,
    images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "Glow Éburnie",
    dateAdded: "2026-06-13T09:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-14",
    name: "Pommade Correctrice Anti-Cicatrices",
    description: "Traitement localisé super-actif formulé pour estomper les traces d'étirements cutanés, cicatrices d'acné anciennes et taches rebelles.",
    price: 8000,
    promoPrice: 7000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1619451334792-150fd785ee74?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-14T11:15:00Z",
    isAvailable: true
  },
  {
    id: "prod-15",
    name: "Pommade Harmonie Peau Claire",
    description: "Soin unifié nourrissant et correcteur doux pour peaux claires ou métissées. Formule protectrice qui prévient le ternissement et préserve la clarté naturelle.",
    price: 9000,
    stock: 40,
    images: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "Akwaba Beauté",
    dateAdded: "2026-06-15T10:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-16",
    name: "Pommade Harmonie Peau Noire",
    description: "Spécifiquement formulé pour sublimer, hydrater en profondeur et faire briller le teint ébène et noir sans altérer la peau. Protège contre la sècheresse.",
    price: 9000,
    stock: 42,
    images: ["https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "Akwaba Beauté",
    dateAdded: "2026-06-16T12:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-17",
    name: "Traitement Dermatologique d'Urgence",
    description: "Pommade cicatrisante et apaisante contre les crises d'eczéma, dermatite ou démangeaisons causées par l'eau dure ou la sudation.",
    price: 11000,
    promoPrice: 9500,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1607006342440-b7eb2065cc32?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-17T15:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-18",
    name: "Vaseline Purifiée Médicale Karité",
    description: "Pommade protectrice occlusive enrichie aux huiles naturelles pour réparer les pieds fissurés, les lèvres gercées et hydrater intensément les zones épaisses.",
    price: 3500,
    stock: 100,
    images: ["https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop"],
    category: "pommades-traitements",
    brand: "Glow Éburnie",
    dateAdded: "2026-06-18T10:15:00Z",
    isAvailable: true
  },

  // 4. Produits capillaires (produits-capillaires)
  {
    id: "prod-19",
    name: "Shampoing Nutri-Actif Antipelliculaire",
    description: "Shampoing doux sans sulfates formulé avec du pyrithione de zinc pour éliminer totalement les pellicules et apaiser les cuirs chevelus irrités.",
    price: 5000,
    stock: 60,
    images: ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Sika Secrets",
    dateAdded: "2026-06-19T08:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-20",
    name: "Après-Shampoing Démêlant Miracle",
    description: "Soin adoucissant instantané pour dompter et hydrater en profondeur les cheveux crépus ou frisés. Facilite le peignage sans casser la fibre capillaire.",
    price: 5500,
    promoPrice: 4800,
    stock: 45,
    images: ["https://images.unsplash.com/photo-1527799881356-1177961ee291?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Sika Secrets",
    dateAdded: "2026-06-20T09:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-21",
    name: "Huile de Pousse Intense au Ricin & Chebe",
    description: "Bain d'huile fortifiant conçu pour restructurer la racine des cheveux, stopper les chutes précoces et booster la pousse des tempes dégarnies.",
    price: 7500,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Sika Secrets",
    dateAdded: "2026-06-21T10:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-22",
    name: "Sérum Anti-Chute Capillaire Fortifié",
    description: "Soin sans rinçage ciblé agissant sur le cuir chevelu. Améliore l'ancrage du cheveu, freine la perte saisonnière ou après-accouchement.",
    price: 12000,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "DermIvoire Lab",
    dateAdded: "2026-06-22T04:15:00Z",
    isAvailable: true
  },
  {
    id: "prod-23",
    name: "Crème de Définition Boucles Coco",
    description: "Crème nourrissante sans rinçage riche en huile de coco de Jacqueville pour des boucles rebondies, douces et un volume capillaire maîtrisé.",
    price: 6500,
    promoPrice: 5800,
    stock: 28,
    images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Nature & Éclat",
    dateAdded: "2026-06-22T05:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-24",
    name: "Masque Réparateur Intense Coco-Karité",
    description: "Traitement revitalisant profond pour cheveux desséchés, abîmés par les tresses ou défrisages répétitifs. Redonne force et élasticité.",
    price: 8500,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Sika Secrets",
    dateAdded: "2026-06-22T06:00:00Z",
    isAvailable: true
  }
];

const SEED_CATEGORIES = [
  { slug: "soins-peau", name: "Produits pharmaceutiques / soins de peau", description: "Produits contre les taches, anti-acné, éclaircissants, hydratants et soins correcteurs de teint", iconName: "Shield" },
  { slug: "cremes-soins", name: "Crèmes et soins visage / corps", description: "Crèmes visage, crèmes corps, soins hydratants d'excellence et soins réparateurs", iconName: "Sparkles" },
  { slug: "pommades-traitements", name: "Pommades et traitements", description: "Pommades pour le teint, correctrices, soins harmonieux unifiés et dermatologie douce", iconName: "Droplet" },
  { slug: "produits-capillaires", name: "Produits capillaires", description: "Shampoings, après-shampoings, huiles et soins anti-chute ou croissance", iconName: "Wind" }
];

const SEED_USERS = [
  {
    id: "usr-admin-mael",
    name: "Maël",
    phone: "07 05 05 26 32",
    email: "mael@cosmetiques.ci",
    city: "Cocody",
    address: "Cocody, Abidjan",
    role: "admin"
  }
];

const SEED_CHATS = [
  {
    id: "chat-ewa-sample",
    clientName: "Awa Diop",
    clientPhone: "+225 0701020304",
    lastMessage: "Bonjour, j'ai des taches d'acné récurrentes sur le visage, que me conseillez-vous ?",
    lastTimestamp: "2026-06-16T18:30:00Z",
    active: true,
    unreadCount: 1
  }
];

const SEED_MESSAGES = [
  {
    id: "msg-1",
    chatId: "chat-ewa-sample",
    sender: "client",
    senderName: "Awa Diop",
    message: "Bonjour, j'ai des taches d'acné récurrentes sur le visage, que me conseillez-vous ?",
    timestamp: "2026-06-16T18:30:00Z"
  }
];

const SEED_ORDERS = [
  {
    id: "cmd-9012",
    userId: "chat-ewa-sample",
    customerName: "Awa Diop",
    customerPhone: "+225 0701020304",
    customerEmail: "awa@cosmetiques.ci",
    address: "Zone 4, Rue des Alizés, Abidjan",
    city: "Abidjan",
    items: [
      {
        productId: "prod-1",
        name: "Lait Hydratant Actif au Beurre de Karité",
        price: 6000,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"
      }
    ],
    total: 12000,
    status: "Confirmée",
    paymentMethod: "Orange Money",
    paymentStatus: "Payé",
    date: "2026-06-16T15:20:00Z"
  }
];

// Seed Firestore dynamically on startup
async function initDatabase() {
  if (!adminDb) return;
  try {
    const productsSnapshot = await adminDb.collection("products").get();
    if (productsSnapshot.empty) {
      console.log("Seeding Firestore products...");
      for (const prod of SEED_PRODUCTS) {
        await adminDb.collection("products").doc(prod.id).set(prod);
      }
    }

    const categoriesSnapshot = await adminDb.collection("categories").get();
    if (categoriesSnapshot.empty) {
      console.log("Seeding Firestore categories...");
      for (const cat of SEED_CATEGORIES) {
        await adminDb.collection("categories").doc(cat.slug).set(cat);
      }
    }

    const usersSnapshot = await adminDb.collection("users").get();
    if (usersSnapshot.empty) {
      console.log("Seeding Admin user...");
      for (const usr of SEED_USERS) {
        await adminDb.collection("users").doc(usr.id).set(usr);
      }
    }

    const chatsSnapshot = await adminDb.collection("chats").get();
    if (chatsSnapshot.empty) {
      console.log("Seeding initial chat logs...");
      for (const ch of SEED_CHATS) {
        await adminDb.collection("chats").doc(ch.id).set(ch);
      }
      for (const msg of SEED_MESSAGES) {
        await adminDb.collection("messages").doc(msg.id).set(msg);
      }
    }

    const ordersSnapshot = await adminDb.collection("orders").get();
    if (ordersSnapshot.empty) {
      console.log("Seeding sample orders...");
      for (const o of SEED_ORDERS) {
        await adminDb.collection("orders").doc(o.id).set(o);
      }
    }
    
    console.log("Firestore database fully seeded and synchronized.");
  } catch (err) {
    console.error("Firestore database seeding failed:", err);
  }
}

// Invoke seed verification
initDatabase();

// ----------------------
// API ROUTES ENTIRELY MAPPED TO CLOUD FIRESTORE
// ----------------------

// 1. Products API
app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("products").get();
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const id = `prod-${Date.now()}`;
    const newProduct = {
      ...req.body,
      id,
      dateAdded: new Date().toISOString()
    };
    await adminDb.collection("products").doc(id).set(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminDb.collection("products").doc(id).update(req.body);
    const snap = await adminDb.collection("products").doc(id).get();
    res.json({ id, ...snap.data() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await adminDb.collection("products").doc(id).delete();
    res.json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2. Categories API
app.get("/api/categories", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("categories").get();
    const list = snapshot.docs.map(doc => doc.data());
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { slug, name, description, icon, imageUrl, image } = req.body;
    if (!slug || !name) {
      return res.status(400).json({ error: "Slug and Name are required" });
    }
    const newCategory = { 
      slug, 
      name, 
      description: description || "", 
      icon: icon || "Sparkles",
      imageUrl: imageUrl || "",
      image: image || imageUrl || ""
    };
    await adminDb.collection("categories").doc(slug).set(newCategory);
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = { ...req.body };
    // make sure we keep consistency between image and imageUrl if either is passed
    if (updateData.imageUrl && !updateData.image) {
      updateData.image = updateData.imageUrl;
    } else if (updateData.image && !updateData.imageUrl) {
      updateData.imageUrl = updateData.image;
    }
    await adminDb.collection("categories").doc(slug).update(updateData);
    const snap = await adminDb.collection("categories").doc(slug).get();
    res.json({ slug, ...snap.data() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    await adminDb.collection("categories").doc(slug).delete();
    res.json({ message: "Catégorie supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 3. Authentication & Profile API
app.post("/api/users/login", async (req, res) => {
  const { name, phone, city, username, role } = req.body;
  try {
    // If Admin Maël
    if (role === "admin" && name.toLowerCase().trim() === "maël") {
      const adminUser = {
        id: "usr-admin-mael",
        name: "Maël",
        phone: "07 05 05 26 32",
        email: "mael@cosmetiques.ci",
        city: "Cocody",
        address: "Cocody, Abidjan",
        role: "admin"
      };
      await adminDb.collection("users").doc(adminUser.id).set(adminUser);
      return res.json(adminUser);
    }

    // Client Lookup / Auto registration in Firestore
    const usersSnap = await adminDb.collection("users").where("phone", "==", phone.trim()).get();
    if (!usersSnap.empty) {
      const existingUser = { id: usersSnap.docs[0].id, ...usersSnap.docs[0].data() };
      return res.json(existingUser);
    }

    const newClientId = `usr-client-${Date.now()}`;
    const newClient = {
      id: newClientId,
      name: name.trim(),
      username: username ? username.trim() : name.toLowerCase().replace(/\s+/g, ""),
      phone: phone.trim(),
      email: `${(username || name).trim().toLowerCase()}@cosmetiques.ci`,
      city: city || "Abidjan",
      address: `${city || "Abidjan"}, Côte d'Ivoire`,
      role: "client"
    };

    await adminDb.collection("users").doc(newClientId).set(newClient);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/users/:id/profile", async (req, res) => {
  const { id } = req.params;
  try {
    await adminDb.collection("users").doc(id).update(req.body);
    const snap = await adminDb.collection("users").doc(id).get();
    res.json({ id, ...snap.data() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("users").get();
    const list = snapshot.docs.map(doc => doc.data());
    res.json(list);
  } catch (err) {
    res.status(550).json({ error: (err as Error).message });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("messages").get();
    const list = snapshot.docs.map(doc => doc.data());
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 4. Pharmacy Advising Chat System (with Gemini intelligence + auto-replies)
app.get("/api/chats", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("chats").orderBy("lastTimestamp", "desc").get();
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/chats/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  try {
    const snapshot = await adminDb.collection("messages").where("chatId", "==", chatId).get();
    const list = snapshot.docs.map(doc => doc.data());
    // Sort in code to bypass manual indexing crash alerts
    list.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/chats/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  const { sender, senderName, message, imageUrl, suggestedProductIds } = req.body;
  
  try {
    // 1. Add User message
    const msgId = `msg-${Date.now()}`;
    const userMsg = {
      id: msgId,
      chatId,
      sender,
      senderName,
      message,
      timestamp: new Date().toISOString(),
      ...(imageUrl && { imageUrl }),
      ...(suggestedProductIds && { suggestedProductIds })
    };
    await adminDb.collection("messages").doc(msgId).set(userMsg);

    // 2. Refresh Chat Session
    const chatRef = adminDb.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();
    const hasUnread = sender === "client";
    const sessionDetails = {
      id: chatId,
      clientName: sender === "client" ? senderName : (chatDoc.exists ? chatDoc.data()?.clientName : "Client"),
      clientPhone: chatDoc.exists ? chatDoc.data()?.clientPhone : "",
      lastMessage: message,
      lastTimestamp: new Date().toISOString(),
      active: true,
      unreadCount: hasUnread ? ((chatDoc.exists ? (chatDoc.data()?.unreadCount || 0) : 0) + 1) : 0
    };
    await chatRef.set(sessionDetails, { merge: true });

    // 3. AI Pharmacist integration
    const settingsDoc = await adminDb.collection("settings").doc("config").get();
    const isAiPharmacistEnabled = settingsDoc.exists ? settingsDoc.data()?.ai_pharmacist_enabled !== false : true;

    if (sender === "client" && isAiPharmacistEnabled) {
      const prodSnapshot = await adminDb.collection("products").get();
      const productsList = prodSnapshot.docs.map(doc => doc.data() as any);
      
      const userRef = adminDb.collection("users").doc(chatId);
      const userDoc = await userRef.get();
      const userProfile = userDoc.exists ? userDoc.data()?.skinProfile : null;

      const productsString = productsList
        .map((p: any) => `- Name: "${p.name}", Category: "${p.category}", Brand: "${p.brand}", Price: "${p.price} FCFA", PromoPrice: "${p.promoPrice ? p.promoPrice + ' FCFA' : 'None'}", Description: "${p.description}"`)
        .join("\n");
        
      const beautyContext = userProfile 
        ? `Le client est un(e) ${userProfile.gender} de ${userProfile.age} ans. Type de peau : ${userProfile.skinType}, Cuir chevelu/cheveux : ${userProfile.hairType}. Préoccupations : ${userProfile.concerns.join(", ")}.`
        : "Le client n'a pas encore complété son questionnaire beauté.";

      const systemPrompt = `Tu es Inès, conseillère experte en beauté cosmétique pour notre boutique unique Akwaba Beauté en Côte d'Ivoire.
Ton objectif est d'écouter les préoccupations de beauté des clients, de poser un diagnostic de peau et capillaire complice avant de lui suggérer les produits du catalogue ci-dessous.
Réponds exclusivement en Français (ton chaleureux, complice et poli, propre aux ivoiriens, utilise des acronymes comme "Akwaba").
Toutes tes suggestions de prix doivent être exactes par rapport au catalogue ci-dessous.

INFORMATIONS DU CLIENT :
${beautyContext}

NOTRE CATALOGUE PRODUITS :
${productsString}

Consignes :
1. Reste extrêmement bienveillante et donne 1 ou 2 produits correspondants exactement.
2. Écris en moins de 180 mots.`;

      try {
        let aiText = "";
        let suggestedIds: string[] = [];

        if (ai) {
          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: message,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.8
            }
          });
          aiText = aiResponse.text || "Bonjour! J'étudie votre demande beauté immédiatement.";
          
          productsList.forEach((p: any) => {
            if (aiText.toLowerCase().includes(p.name.toLowerCase().substring(0, 15))) {
              suggestedIds.push(p.id);
            }
          });
        } else {
          // Offline Fallback
          aiText = "Akwaba! Pour corriger les taches et illuminer votre teint en douceur, notre Sérum Anti-Taches Intensif à 9500 FCFA est particulièrement conseillé. Notre équipe beauté reste à votre pleine écoute !";
          suggestedIds = ["prod-1"];
        }

        const aiMsgId = `msg-${Date.now() + 1}`;
        const aiMsg = {
          id: aiMsgId,
          chatId,
          sender: "admin",
          senderName: "Inès, Conseillère Beauté (AI)",
          message: aiText,
          timestamp: new Date().toISOString(),
          suggestedProductIds: suggestedIds
        };

        await adminDb.collection("messages").doc(aiMsgId).set(aiMsg);
        
        await chatRef.update({
          lastMessage: aiText,
          lastTimestamp: new Date().toISOString(),
          unreadCount: 0
        });

      } catch (aiErr) {
        console.error("AI chat generation fail:", aiErr);
      }
    }

    // Return the updated feed sorted
    const updatedDocs = await adminDb.collection("messages").where("chatId", "==", chatId).get();
    const finalMessages = updatedDocs.docs.map(doc => doc.data());
    finalMessages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    res.json(finalMessages);

  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Configure AI Pharmacist Mode switch
app.post("/api/settings/ai-pharmacist", async (req, res) => {
  const { enabled } = req.body;
  try {
    await adminDb.collection("settings").doc("config").set({ ai_pharmacist_enabled: enabled }, { merge: true });
    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 5. Beauty Diagnostic Recommendation API
app.post("/api/diagnostics/analyze", async (req, res) => {
  const { gender, age, skinType, hairType, concerns } = req.body;

  const prompt = `Génère un diagnostic de beauté cosmétique et conseils de soins sur-mesure pour un client en Côte d'Ivoire.
Profil :
- Genre : ${gender}
- Âge : ${age} ans
- Type de peau : ${skinType}
- Type de cheveux : ${hairType}
- Préoccupations majeures : ${concerns.join(", ")}

Tu dois renvoyer obligatoirement la réponse sous format JSON qui correspond exactement au schéma ci-dessous, en français chaleureux d'expert en Côte d'Ivoire.

Schémas attendu :
{
  "diagnostic": "Analyse douce et personnalisée expliquant pourquoi la peau/les cheveux réagissent ainsi sous le climat ivoirien d'Afrique de l'Ouest (chaleur, humidité d'Abidjan ou sécheresse de l'Harmattan d'hier)",
  "routineMatin": [
    { "step": "Nom de l'étape (ex: Nettoyage)", "instruction": "Explication sur comment appliquer et pourquoi sous le soleil" }
  ],
  "routineSoir": [
    { "step": "Nom de l'étape", "instruction": "Explication de l'importance durant la nuit" }
  ],
  "conseilsGeneraux": [
    "Conseil d'hygiène de vie ou alimentation"
  ]
}`;

  try {
    let diagnosisResult;

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnostic: { type: Type.STRING },
              routineMatin: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    instruction: { type: Type.STRING }
                  },
                  required: ["step", "instruction"]
                }
              },
              routineSoir: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    instruction: { type: Type.STRING }
                  },
                  required: ["step", "instruction"]
                }
              },
              conseilsGeneraux: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["diagnostic", "routineMatin", "routineSoir", "conseilsGeneraux"]
          },
          temperature: 0.7
        }
      });

      diagnosisResult = JSON.parse(response.text || "{}");
    } else {
      diagnosisResult = {
        diagnostic: `Votre peau de type ${skinType} et cheveux ${hairType} réclament une attention adaptée au climat humide d'Abidjan. L'hyperpigmentation due au soleil ivoirien aggrave les soucis liés aux préoccupations (${concerns.join(", ")}). Il faut purifier en douceur sans décaper.`,
        routineMatin: [
          { step: "Nettoyage doux", instruction: "Laver le visage avec votre gel nettoyant visage ou gel moussant à l'eau fraîche pour enlever l'excès de sébum nocturne sans dessécher." },
          { step: "Sérum Anti-Taches", instruction: "Appliquer le Sérum Anti-Taches Intensif pour estomper l'hyperpigmentation et illuminer le teint face aux UV." },
          { step: "Protection Écran Solaire FPS 50+", instruction: "Appliquer obligatoirement une crème hydratante protectrice pour éviter le rebond pigmentaire et freiner l'acné sous la sueur." }
        ],
        routineSoir: [
          { step: "Double Nettoyage", instruction: "Éliminer les poussières, le maquillage et la pollution d'Abidjan accumulés avec un nettoyant purifiant." },
          { step: "Hydratation active", instruction: "Hydrater profondément avec votre Lait Corporel Hydratation Profonde pour réparer et régénérer la peau durant votre sommeil." }
        ],
        conseilsGeneraux: [
          "Buvez au moins 2 litres d'eau par jour pour rivaliser avec la déshydratation due au climat tropical.",
          "Évitez de gommer votre peau de manière abrasive; préférez des soins exfoliants doux.",
          "Lavez vos bonnets et taies d'oreiller en soie régulièrement pour le bien des vos cheveux et de votre visage."
        ]
      };
    }

    res.json(diagnosisResult);

  } catch (err) {
    console.error("Gemini diagnosis generator error:", err);
    res.status(550).json({ error: "Calcul du diagnostic impossible" });
  }
});

// 6. Orders & Checkout API
app.get("/api/orders", async (req, res) => {
  try {
    const snapshot = await adminDb.collection("orders").orderBy("date", "desc").get();
    const list = snapshot.docs.map(doc => doc.data());
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/orders/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await adminDb.collection("orders").where("userId", "==", userId).get();
    const list = snapshot.docs.map(doc => doc.data());
    list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/orders", async (req, res) => {
  const { userId, customerName, customerPhone, customerEmail, address, city, items, total, paymentMethod } = req.body;
  try {
    // Deduct stock in Firestore
    for (const item of items) {
      const prodRef = adminDb.collection("products").doc(item.productId);
      const prodDoc = await prodRef.get();
      if (prodDoc.exists) {
        const prodData = prodDoc.data() as any;
        const currentStock = prodData.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await prodRef.update({
          stock: newStock,
          isAvailable: newStock > 0
        });
      }
    }

    const id = `cmd-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city: city || "Abidjan",
      items,
      total,
      status: "En attente",
      paymentMethod,
      paymentStatus: "Payé",
      date: new Date().toISOString()
    };

    await adminDb.collection("orders").doc(id).set(newOrder);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await adminDb.collection("orders").doc(id).update({ status });
    const snap = await adminDb.collection("orders").doc(id).get();
    res.json(snap.data());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 7. Admin Dashboard Statistics Calculation
app.get("/api/admin/statistics", async (req, res) => {
  try {
    const ordersSnap = await adminDb.collection("orders").get();
    const orders = ordersSnap.docs.map(doc => doc.data() as any);
    
    const usersSnap = await adminDb.collection("users").get();
    const usersCount = usersSnap.docs.filter(doc => doc.data()?.role === "client").length;

    const ordersCount = orders.length;
    const revenue = orders
      .filter((o: any) => o.paymentStatus === "Payé" && o.status !== "Annulée")
      .reduce((sum: number, o: any) => sum + o.total, 0);

    const conversionRate = Math.min(15, parseFloat((4.5 + (ordersCount * 0.4)).toFixed(1)));

    // Best selling products
    const salesMap: Record<string, { sales: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      if (o.status === "Annulée") return;
      o.items.forEach((item: any) => {
        if (!salesMap[item.name]) {
          salesMap[item.name] = { sales: 0, revenue: 0 };
        }
        salesMap[item.name].sales += item.quantity;
        salesMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const popularProducts = Object.entries(salesMap)
      .map(([name, stat]) => ({ name, sales: stat.sales, revenue: stat.revenue }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Growth daily tracking
    const salesByDay: Record<string, number> = {};
    orders.forEach((o: any) => {
      if (o.status === "Annulée") return;
      const dateObj = new Date(o.date);
      const dayLabel = `${dateObj.getDate()} Juin`;
      salesByDay[dayLabel] = (salesByDay[dayLabel] || 0) + o.total;
    });

    const formattedSales = Object.entries(salesByDay).map(([day, amount]) => ({
      day,
      amount
    })).reverse();

    res.json({
      ordersCount,
      revenue,
      conversionRate,
      newCustomers: usersCount,
      popularProducts,
      salesByDay: formattedSales.length > 0 ? formattedSales : [{ day: "Aujourd'hui", amount: revenue }]
    });

  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ----------------------
// VITE CLIENT INTEGRATION
// ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Inject Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Boutique Cosmétique Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
