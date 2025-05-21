
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// Auth is no longer imported or initialized here as per previous user request to remove auth

// Your web app's Firebase configuration - TO BE LOADED FROM ENVIRONMENT VARIABLES
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let firebaseInitialized = false;

// Server-side environment variable check
if (typeof window === 'undefined') {
  console.log("---------------------------------------------------------------------");
  console.log("SERVER-SIDE Firebase Environment Variable Check:");
  const criticalVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  let allServerVarsPresent = true;
  for (const [key, value] of Object.entries(criticalVars)) {
    if (!value) {
      console.error(`SERVER-SIDE ERROR: ${key} is MISSING or EMPTY.`);
      allServerVarsPresent = false;
    } else {
      // Mask API key for logging
      const displayValue = key === 'NEXT_PUBLIC_FIREBASE_API_KEY' 
        ? `${value.substring(0, 5)}...${value.substring(value.length - 5)} (Length: ${value.length})` 
        : value;
      console.log(`${key}: SET (Value: ${displayValue})`);
    }
  }
  if (!allServerVarsPresent) {
    const message = "CRITICAL SERVER-SIDE ERROR: One or more Firebase environment variables are missing. Firebase will not initialize correctly. Ensure .env.local is in the project root, correctly configured, and the Next.js server was restarted.";
    console.error(message);
    // We won't throw here on server to allow build to proceed, but Firebase will fail.
  }
  console.log("---------------------------------------------------------------------");
}


try {
  // Check if essential config values are present before initializing
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app && app.name) {
      db = getFirestore(app);
      firebaseInitialized = true;
      if (typeof window !== 'undefined') {
        console.log('Firebase initialized successfully on CLIENT.');
      } else {
        console.log('Firebase initialized successfully on SERVER.');
      }
    } else {
      throw new Error("Firebase app object is not valid after initialization attempt despite config values appearing present.");
    }
  } else {
    // This path will be taken if environment variables are not loaded.
    const message = "Firebase configuration is incomplete (API Key, Auth Domain, or Project ID missing). Cannot initialize Firebase. Check server and client logs for missing environment variables. Ensure .env.local is correct and the server has been restarted.";
    console.error("FATAL:", message);
    // Initialize with empty objects to prevent crashes in consuming components, but Firebase will be non-functional.
    app = {} as FirebaseApp; 
    db = {} as Firestore;
    // Do not throw here to allow the app to load and show client-side errors if needed.
  }
} catch (error: any) {
  console.error("FATAL: Firebase initialization failed:", error.message || error);
  app = {} as FirebaseApp;
  db = {} as Firestore;
}

// Client-side check (will run after server-side check during hydration if SSR)
if (typeof window !== 'undefined') {
  console.log('Firebase configuration being used on CLIENT:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0,5)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'NOT SET (Optional but recommended)',
    messagingSenderId: firebaseConfig.messagingSenderId || 'NOT SET (Optional but recommended)',
    appId: firebaseConfig.appId || 'NOT SET (Optional but recommended)',
  });
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    const clientErrorMessage = "CRITICAL CLIENT-SIDE ERROR: Firebase configuration is incomplete. API Key, Auth Domain, or Project ID is missing. App functionality will be severely limited. Ensure .env.local is correctly set up with NEXT_PUBLIC_ prefixes and the Next.js server was restarted.";
    console.error(clientErrorMessage);
    // Optionally, you could show an alert or a banner to the user.
    // alert(clientErrorMessage); 
  }
}

// Export the initialized app and Firestore instance
// Auth is no longer exported as per previous removal of authentication
export { app, db, firebaseInitialized };
