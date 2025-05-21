
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Log environment variables on the server side for debugging
if (typeof window === 'undefined') {
  console.log('---------------------------------------------------------------------');
  console.log('SERVER-SIDE Firebase Environment Variable Check:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET (value hidden for security)' : 'MISSING or EMPTY');
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
    console.error('CRITICAL SERVER-SIDE ERROR: One or more required Firebase environment variables are missing or empty. Firebase services will fail. Please check your .env.local file (and ensure it is in the project root) and RESTART your Next.js development server.');
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
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('CRITICAL CLIENT-SIDE ERROR: Firebase configuration is incomplete. API Key, Auth Domain, or Project ID is missing. Check .env.local and ensure the Next.js server was restarted.');
    alert('CRITICAL CLIENT-SIDE ERROR: Firebase configuration is incomplete. API Key, Auth Domain, or Project ID is missing. Check console for details and verify .env.local. App functionality will be limited.');
  }
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // This check ensures all critical config values are present before initializing
  // This is important because Firebase initializeApp might not throw an immediate error for missing values
  // but subsequent service calls (like getAuth) will fail.
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    const message = "Firebase configuration is incomplete. Cannot initialize Firebase. Check server and client logs for missing environment variables. Ensure .env.local is correct and the server has been restarted.";
    // On the server, this error will likely stop the render process.
    // On the client, this will stop execution here.
    console.error("FATAL:", message);
    // To prevent the app from trying to proceed with broken Firebase, we could throw here.
    // However, the Firebase SDK itself will throw if it can't initialize services.
    // The `auth/invalid-api-key` is already a clear indicator from Firebase.
    // The logs above should help pinpoint if it's a missing var vs. an invalid var.
    // Throwing an error here ensures the app doesn't proceed with a broken config.
    throw new Error(message);
  }
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
