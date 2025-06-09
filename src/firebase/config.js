import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from Flutter app
const firebaseConfig = {
  apiKey: "AIzaSyC_kGAJKLzrWG5S6FgEnmPJdNPq3WVAigg",
  authDomain: "click-a839b.firebaseapp.com",
  projectId: "click-a839b",
  storageBucket: "click-a839b.firebasestorage.app",
  messagingSenderId: "375817216927",
  appId: "1:375817216927:web:377409f172af9c00b653aa",
  measurementId: "G-0KW9MJV636"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app; 