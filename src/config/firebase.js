import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase with error handling
let app, db, auth;

try {
  // Check if all required config values are present
  const placeholder = (v) =>
    !v ||
    v === 'undefined' ||
    v === 'your_api_key' ||
    v === 'your_firebase_api_key' ||
    v === 'your_app_id';
  const hasAllConfig = Object.values(firebaseConfig).every((value) => !placeholder(value));
  
  if (hasAllConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('[Firebase] Successfully initialized');
  } else {
    console.warn(
      '[Firebase] Not initialized — set EXPO_PUBLIC_FIREBASE_* in .env or Vercel Project → Settings → Environment Variables.'
    );
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
}

/** True when Firestore can be used (set EXPO_PUBLIC_* in Vercel / .env). */
const isFirebaseConfigured = Boolean(db);

export { app, auth, db, isFirebaseConfigured };