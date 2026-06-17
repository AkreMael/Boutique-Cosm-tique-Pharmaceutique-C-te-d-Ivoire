import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Firebase Admin SDK using application credentials or local project configuration
let adminDb: Firestore;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let projectId = "filant225-base";
  let databaseId = "";
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    projectId = config.projectId || projectId;
    databaseId = config.firestoreDatabaseId || "";
  }
  
  if (getApps().length === 0) {
    initializeApp({
      projectId: projectId
    });
  }
  adminDb = databaseId ? getFirestore(databaseId) : getFirestore();
  console.log("Firebase admin SDK initialized with Cloud Project ID:", projectId, "Database ID:", databaseId || "(default)");
} catch (error) {
  console.error("Firebase admin initialization error:", error);
}

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
  {
    id: "prod-1",
    name: "Lait Hydratant Actif au Beurre de Karité",
    description: "Lait corporel réparateur enrichi en pur beurre de karité de Côte d'Ivoire. Idéal pour hydrater les peaux sèches et déshydratées sous le climat tropical.",
    price: 7500,
    promoPrice: 6000,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop"],
    category: "soins-corps",
    brand: "Glow Éburnie",
    dateAdded: "2026-05-10T12:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-2",
    name: "Gel Nettoyant Visage Anti-Imperfections",
    description: "Formule purifiante douce au zinc et extrait de neem africain. Élimine l'excès de sébum et traite l'acné tout en protégeant la barrière cutanée.",
    price: 5000,
    stock: 45,
    images: ["https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop"],
    category: "soins-visage",
    brand: "SoinPur CI",
    dateAdded: "2026-05-15T10:30:00Z",
    isAvailable: true
  },
  {
    id: "prod-3",
    name: "Sérum Concentré Éclat & Anti-Taches",
    description: "Traitement à base de 10% de niacinamide et vitamine C pour corriger les taches d'hyperpigmentation causées par le soleil ou les cicatrices d'imperfections.",
    price: 12000,
    promoPrice: 10500,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"],
    category: "soins-visage",
    brand: "DermIvoire Lab",
    dateAdded: "2026-05-20T08:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-4",
    name: "Mousse Capillaire Fortifiante Pousse Active",
    description: "Traitement sans rinçage formulé à l'huile de ricin et au gingembre sauvage. Fortifie les cheveux crépus, bouclés ou frisés et évite la casse.",
    price: 9500,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1527799881356-1177961ee291?q=80&w=600&auto=format&fit=crop"],
    category: "produits-capillaires",
    brand: "Sika Secrets",
    dateAdded: "2026-05-25T14:15:00Z",
    isAvailable: true
  },
  {
    id: "prod-5",
    name: "Savon Saponifié à Froid Coco & Karité",
    description: "Savon artisanal hypoallergénique fabriqué localement. Nettoie en profondeur le corps et le visage sans tirailler.",
    price: 2500,
    stock: 120,
    images: ["https://images.unsplash.com/photo-1607006342440-b7eb2065cc32?q=80&w=600&auto=format&fit=crop"],
    category: "hygiene",
    brand: "Glow Éburnie",
    dateAdded: "2026-05-01T09:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-6",
    name: "Crème Solaire Protectrice Anti-Brillance FPS 50+",
    description: "Très haute protection solaire pour le visage, formulée pour résister à la transpiration et sans laisser de traces blanches gênantes sur peaux noires ou métissées.",
    price: 11000,
    stock: 30,
    images: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop"],
    category: "soins-visage",
    brand: "SoinPur CI",
    dateAdded: "2026-06-02T16:45:00Z",
    isAvailable: true
  },
  {
    id: "prod-7",
    name: "Lait Doux de Toilette Mandarine",
    description: "Nettoie en douceur le visage et le corps de toute la famille. Calme et rafraîchit immédiatement la barrière cutanée.",
    price: 4500,
    promoPrice: 4000,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1519689680058-324335c77ebe?q=80&w=600&auto=format&fit=crop"],
    category: "soins-corps",
    brand: "DoucHé",
    dateAdded: "2026-06-05T11:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-8",
    name: "Fond de Teint Crème Mat Extrême Abidjan",
    description: "Maquillage régulateur de brillance à haute couvrance, spécialement conçu pour rester impeccable pendant 24h sous l'humidité ivoirienne.",
    price: 14000,
    stock: 22,
    images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop"],
    category: "maquillage",
    brand: "Eburnie Glam",
    dateAdded: "2026-06-10T15:20:00Z",
    isAvailable: true
  },
  {
    id: "prod-9",
    name: "Brume Parfumée Fleur d'Oranger",
    description: "Une fragrance envoûtante de fleur d'oranger et de jasmin blanc, parfaite pour une fraîcheur florale longue durée.",
    price: 12500,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop"],
    category: "parfums",
    brand: "Senteur d'Éburnie",
    dateAdded: "2026-06-11T12:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-10",
    name: "Huile de Coco Vierge de Jacqueville",
    description: "Huile de coco de Jacqueville extraite à froid, riche en antioxydants. Idéale pour nourrir profondément les cheveux et sublimer le teint.",
    price: 4500,
    promoPrice: 3500,
    stock: 35,
    images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop"],
    category: "beaute-naturelle",
    brand: "Nature & Éclat",
    dateAdded: "2026-06-12T10:00:00Z",
    isAvailable: true
  },
  {
    id: "prod-11",
    name: "Rouleau de Massage en Quartz Rose",
    description: "Outil de massage facial en pierre de quartz véritable pour stimuler la microcirculation, réduire les cernes et raffermir la peau.",
    price: 8000,
    stock: 40,
    images: ["https://images.unsplash.com/photo-1619451334792-150fd785ee74?q=80&w=600&auto=format&fit=crop"],
    category: "accessoires-beaute",
    brand: "Akwaba Beauté",
    dateAdded: "2026-06-13T14:00:00Z",
    isAvailable: true
  }
];

const SEED_CATEGORIES = [
  { slug: "soins-visage", name: "Soins du visage", description: "Sérums, nettoyants, crèmes protectrices de jour", iconName: "Smile" },
  { slug: "soins-corps", name: "Soins du corps", description: "Laits hydratants, huiles de gommage, baumes", iconName: "Sparkles" },
  { slug: "maquillage", name: "Maquillage", description: "Fonds de teint matifiants, rouges à lèvres longue tenue", iconName: "Palette" },
  { slug: "produits-capillaires", name: "Produits capillaires", description: "Masques, mousses de pousse, shampoings hydratants", iconName: "Wind" },
  { slug: "parfums", name: "Parfums", description: "Fragrances, brumes corporelles d'Afrique de l'Ouest", iconName: "Flame" },
  { slug: "hygiene", name: "Hygiène", description: "Savons locaux, gels de douche et déodorants", iconName: "ShowerHead" },
  { slug: "beaute-naturelle", name: "Beauté naturelle", description: "Huiles essentielles pures et beurres organiques", iconName: "Leaf" },
  { slug: "accessoires-beaute", name: "Accessoires beauté", description: "Rouleaux de massage, brosses exfoliantes", iconName: "Compass" },
  { slug: "promotions", name: "Promotions", description: "Offres temporaires à ne pas rater en Côte d'Ivoire", iconName: "Percent" }
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
    const { slug, name, description, icon } = req.body;
    if (!slug || !name) {
      return res.status(400).json({ error: "Slug and Name are required" });
    }
    const newCategory = { slug, name, description: description || "", icon: icon || "Sparkles" };
    await adminDb.collection("categories").doc(slug).set(newCategory);
    res.status(201).json(newCategory);
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
          aiText = "Akwaba! Pour corriger l'éclat de votre teint, notre Lait Hydratant Actif au Beurre de Karité à 6000 FCFA est extrêmement riche. Notre équipe beauté reste à votre pleine écoute !";
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
          { step: "Nettoyage doux", instruction: "Laver le visage avec votre savon saponifié à froid ou gel à l'eau fraîche pour enlever l'excès de sébum nocturne sans dessécher." },
          { step: "Sérum Anti-Taches", instruction: "Appliquer le Sérum Éclat Vitamine C pour illuminer le teint et équilibrer la réactivité face aux UV." },
          { step: "Protection Écran Solaire FPS 50+", instruction: "Appliquer obligatoirement l'écran solaire fluide pour éviter le rebond pigmentaire et freiner l'acné sous la sueur." }
        ],
        routineSoir: [
          { step: "Double Nettoyage", instruction: "Éliminer les poussières, le maquillage et la pollution d'Abidjan accumulés avec un gel lavant purifiant." },
          { step: "Hydratation active", instruction: "Hydrater avec quelques gouttes de Lait Hydratant Actif ou d'aloé vera pour régénérer la peau durant votre sommeil ventilé." }
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
