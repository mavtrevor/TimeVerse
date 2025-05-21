
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration - PROVIDED BY USER
const firebaseConfig = {
  apiKey: "AIzaSyBplfUzL2yGLMXOSxvyB3eivGj21mWtkC4",
  authDomain: "timeverse-msmki.firebaseapp.com",
  projectId: "timeverse-msmki",
  storageBucket: "timeverse-msmki.appspot.com", // Corrected common typo: .appspot.com usually for storageBucket
  messagingSenderId: "547504122337",
  appId: "1:547504122337:web:28aafd22bbd78a54dccaa0",
  // measurementId is optional, so it can be omitted if not provided or not needed
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Defensive initialization
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Ensure app is valid before getting other services
  if (app && app.name) {
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.error("Firebase app object is not valid after initialization attempt. Firebase services (Firestore, Auth) will not be available.");
    // Assign non-functional placeholders if app is not valid
    app = {} as FirebaseApp; // Avoids further errors if app is used before proper init
    db = {} as Firestore;
    auth = {} as Auth;
  }
} catch (error) {
  console.error("FATAL: Firebase initialization failed:", error);
  console.error("Ensure the provided firebaseConfig is correct and all Firebase services are enabled in your Firebase project console.");
  // Assign non-functional placeholders if initialization fails catastrophically
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
}

// Export the initialized app, Firestore instance, and Auth instance
export { app, db, auth };
