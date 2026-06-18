export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in CFA (XOF)
  promoPrice?: number; // in CFA (XOF)
  stock: number;
  images: string[];
  category: string;
  brand: string;
  dateAdded: string;
  isAvailable: boolean;
}

export type CategorySlug =
  | 'soins-visage'
  | 'soins-corps'
  | 'maquillage'
  | 'produits-capillaires'
  | 'parfums'
  | 'hygiene'
  | 'beaute-naturelle'
  | 'accessoires-beaute'
  | 'promotions';

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  iconName: string;
}

export type UserRole = 'client' | 'admin' | 'pharmacist' | 'agent';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  role: UserRole;
  username?: string;
  profilePicture?: string;
  isPhoneVerified?: boolean;
  verificationCode?: string;
  skinProfile?: BeautyProfile;
  createdAt?: string;
}

export interface BeautyProfile {
  gender: 'Homme' | 'Femme';
  age: number;
  skinType: 'Sèche' | 'Grasse' | 'Mixte' | 'Normale' | 'Sensible';
  hairType: 'Crépu' | 'Frisé' | 'Bouclé' | 'Lisse' | 'Sec' | 'Gras';
  concerns: string[]; // e.g. Acné, Taches, Hydratation, etc.
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'En attente'
  | 'Confirmée'
  | 'Préparation'
  | 'En livraison'
  | 'Livrée'
  | 'Annulée';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: OrderStatus;
  paymentMethod: 'Orange Money' | 'MTN Money' | 'Moov Money';
  paymentStatus: 'En attente' | 'Payé' | 'Échoué';
  date: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'client' | 'admin' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
  imageUrl?: string;
  suggestedProductIds?: string[];
}

export interface ChatSession {
  id: string; // usually equal to user's id
  clientName: string;
  clientPhone: string;
  lastMessage: string;
  lastTimestamp: string;
  active: boolean;
  unreadCount?: number;
}

export interface AdminStats {
  ordersCount: number;
  revenue: number;
  conversionRate: number;
  newCustomers: number;
  popularProducts: { name: string; sales: number; revenue: number }[];
  salesByDay: { day: string; amount: number }[];
}

// ==========================================
// SQL CONNECT UNIFIED CORE SCHEMAS DETAILED
// ==========================================

export type ModuleType = 'RETAIL' | 'RENTAL' | 'SERVICE';

export interface Module {
  id: string; // matches document ID in 'modules'
  name: string; // e.g., "Immobilier", "Boutique E-commerce", "Prestations de Service"
  type: ModuleType;
  status: 'ACTIVE' | 'INACTIVE';
  configurationSettings?: string; // Serialized JSON string e.g. custom limits
}

export interface Item {
  id: string; // matches document ID in 'items'
  title: string;
  price: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'DRAFT';
  description: string;
  images: string[]; // URLs saved in DB, e.g. Unsplash placeholders or user text urls
  metadata: string; // Dynamic Attributes in format JSON
  moduleId: string; // linked module ID
  ownerId: string; // Author/Creator of the ad
  ownerName: string;
  ownerPhone?: string;
  dateAdded: string;
}

export interface UnifiedOrder {
  id: string; // matches document ID in 'orders'
  userId: string;
  userName: string;
  userPhone: string;
  itemId: string; // Linked item ID
  itemTitle: string;
  itemPrice: number;
  quantity?: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: string;
  startDate?: string; // Rental start date / Booking date
  endDate?: string; // Rental end date / Booking time slot
  createdAt: string;
}

export interface Message {
  id: string; // matches document ID in 'messages'
  senderId: string;
  senderName: string;
  receiverId: string; // Peer-to-peer / Admin routing
  content: string;
  senderEmail?: string;
  timestamp: string;
  orderId?: string; // Optional: linked to a specific transaction
}

export interface UserModuleAccess {
  id: string; // e.g. userId_moduleId
  userId: string;
  moduleId: string;
  accessLevel: 'GRANTED' | 'DENIED' | 'PENDING_SUBSCRIBED';
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
