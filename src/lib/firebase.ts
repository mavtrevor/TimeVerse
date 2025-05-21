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
    console.warn('CRITICAL SERVER-SIDE WARNING: One or more required Firebase environment variables (API Key, Auth Domain, Project ID) are missing or empty. Firebase services will likely fail. Please check your .env.local file (ensure it is in the project root) and RESTART your Next.js development server.');
    // We are not throwing an error here to let Firebase SDK attempt initialization and provide its own error.
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
  if (!firebaseConfig.apiKey) {
    console.error("CLIENT-SIDE CHECK FAILED: NEXT_PUBLIC_FIREBASE_API_KEY is missing or empty in the client-side bundle. Ensure it's correctly defined in .env.local and the Next.js server was restarted.");
  }
  if (!firebaseConfig.authDomain) {
    console.error("CLIENT-SIDE CHECK FAILED: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing or empty in the client-side bundle.");
  }
  if (!firebaseConfig.projectId) {
    console.error("CLIENT-SIDE CHECK FAILED: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or empty in the client-side bundle.");
  }
}

// Initialize Firebase
let app: FirebaseApp;
// Check if all critical config values are present before initializing
if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} else {
  // If critical config is missing, create a dummy app object or handle error
  // This prevents the app from crashing if config is totally absent,
  // but Firebase services will not work.
  console.error("CRITICAL ERROR: Firebase cannot be initialized due to missing configuration. App functionality will be severely limited.");
  // Assign a non-functional placeholder to app to prevent further crashes down the line
  // This is a fallback, the root cause (missing env vars) must be fixed.
  app = {} as FirebaseApp; // Or throw an error here if preferred to halt execution
}

// Initialize Firestore - only if app was initialized
const db: Firestore = app && app.name ? getFirestore(app) : ({} as Firestore);

// Initialize Firebase Authentication - only if app was initialized
const auth: Auth = app && app.name ? getAuth(app) : ({} as Auth);

// Export the initialized app, Firestore instance, and Auth instance
export { app, db, auth };
