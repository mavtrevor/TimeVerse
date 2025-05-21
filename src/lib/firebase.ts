
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Auth is no longer imported or initialized here

// Your web app's Firebase configuration - FROM USER
// IMPORTANT: For production, use environment variables. For this session, using hardcoded values.
const firebaseConfig = {
  apiKey: "AIzaSyBplfUzL2yGLMXOSxvyB3eivGj21mWtkC4", // Replace with your actual API key
  authDomain: "timeverse-msmki.firebaseapp.com",   // Replace with your actual auth domain
  projectId: "timeverse-msmki",                   // Replace with your actual project ID
  storageBucket: "timeverse-msmki.appspot.com", // Corrected: usually .appspot.com for storageBucket
  messagingSenderId: "547504122337",            // Replace with your actual messaging sender ID
  appId: "1:547504122337:web:28aafd22bbd78a54dccaa0", // Replace with your actual app ID
  // measurementId is optional
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
// let auth: Auth; // Auth instance removed

// Log environment variables (server-side)
if (typeof window === 'undefined') {
  console.log("---------------------------------------------------------------------");
  console.log("SERVER-SIDE Firebase Environment Variable Check (Hardcoded for this session):");
  console.log(`NEXT_PUBLIC_FIREBASE_API_KEY: ${firebaseConfig.apiKey ? `SET (Ends with ${firebaseConfig.apiKey.slice(-5)})` : "MISSING or EMPTY"}`);
  console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${firebaseConfig.authDomain || "MISSING or EMPTY"}`);
  console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId || "MISSING or EMPTY"}`);
  console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${firebaseConfig.storageBucket || "MISSING or EMPTY"}`);
  console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${firebaseConfig.messagingSenderId || "MISSING or EMPTY"}`);
  console.log(`NEXT_PUBLIC_FIREBASE_APP_ID: ${firebaseConfig.appId || "MISSING or EMPTY"}`);
  console.log("---------------------------------------------------------------------");
}


let firebaseInitialized = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app && app.name) {
      db = getFirestore(app);
      // auth = getAuth(app); // Auth initialization removed
      firebaseInitialized = true;
      if (typeof window !== 'undefined') {
        console.log('Firebase initialized successfully on CLIENT with hardcoded config.');
      } else {
        console.log('Firebase initialized successfully on SERVER with hardcoded config.');
      }
    } else {
      throw new Error("Firebase app object is not valid after initialization attempt.");
    }
  } else {
    throw new Error("Firebase core configuration (apiKey, authDomain, projectId) is missing. Cannot initialize Firebase.");
  }
} catch (error: any) {
  console.error("FATAL: Firebase initialization failed:", error.message || error);
  console.error("Ensure the hardcoded firebaseConfig in src/lib/firebase.ts is correct and all Firebase services are enabled in your Firebase project console if needed (e.g., Firestore).");
  app = {} as FirebaseApp; // Avoids further errors if app is used before proper init
  db = {} as Firestore;
  // auth = {} as Auth; // Auth placeholder removed
}

// Log client-side config for debugging
if (typeof window !== 'undefined' && !firebaseInitialized) {
  console.warn('CLIENT-SIDE: Firebase was NOT initialized successfully. Check logs.');
}


// Export the initialized app and Firestore instance
// Auth is no longer exported
export { app, db };
