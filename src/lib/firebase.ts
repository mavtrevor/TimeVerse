
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Log environment variables on the server side for debugging
if (typeof window === 'undefined') {
  console.log('---------------------------------------------------------------------');
  console.log('SERVER-SIDE Firebase Environment Variable Check:');
  
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (apiKey && apiKey.length > 8) {
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY: SET (starts with: "' + apiKey.substring(0, 5) + '...", ends with: "...' + apiKey.substring(apiKey.length - 5) + '", length: ' + apiKey.length + ')');
  } else if (apiKey) {
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY: SET (value is short, possibly incorrect: "' + apiKey + '")');
  } else {
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY: MISSING or EMPTY');
  }
  
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING or EMPTY');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING or EMPTY');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING or EMPTY');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING or EMPTY');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'MISSING or EMPTY');
  console.log('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'NOT SET (Optional)');
  console.log('---------------------------------------------------------------------');

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error('CRITICAL SERVER-SIDE WARNING: One or more required Firebase environment variables (API Key, Auth Domain, Project ID) are missing or empty. Firebase services will likely fail. Please check your .env.local file (ensure it is in the project root) and RESTART your Next.js development server.');
  }
}

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Log the config being used on the client side for debugging
if (typeof window !== 'undefined') {
  console.log('Firebase configuration being used on CLIENT:', firebaseConfig);
  // Removed explicit error/alert here, Firebase SDK will throw its own errors if config is bad
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Firebase Authentication
const auth: Auth = getAuth(app);

// Export the initialized app, Firestore instance, and Auth instance
export { app, db, auth };
