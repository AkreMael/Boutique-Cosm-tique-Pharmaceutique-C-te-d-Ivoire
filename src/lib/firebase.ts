import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

// Dedicated Firebase configuration for this separate application
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services (using the default Firestore database for separate and secure client access)
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authenticate user anonymously to satisfy "auth != null" firestore security rules
export async function authenticateAnonymous() {
  try {
    const credential = await signInAnonymously(auth);
    return credential.user.uid;
  } catch (err) {
    console.error("Firebase Auth Anonymous login failed:", err);
    throw err;
  }
}

export { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
};
