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

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  role: 'client' | 'admin';
  skinProfile?: BeautyProfile;
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
