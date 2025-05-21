
"use client";
import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from 'react';
import { type User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { app, db, auth as firebaseAuthInstance } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Define a default, non-functional context value for when Firebase is not properly initialized
const defaultAuthContextValue: AuthContextType = {
  user: null,
  loading: false, // Start with loading false if auth is known to be unavailable
  signInWithGoogle: async () => {
    console.warn("signInWithGoogle called but Firebase Auth is not properly initialized.");
    // Potentially show a toast here if useToast could be reliably used without context issues itself
    // For now, just a console warning to keep it simple if this part is problematic.
    alert("Authentication service is not available due to a configuration issue. Please check Firebase setup.");
  },
  signOut: async () => {
    console.warn("signOut called but Firebase Auth is not properly initialized.");
    alert("Authentication service is not available due to a configuration issue. Please check Firebase setup.");
  },
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue); // Provide a default value

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start true, set to false once determined
  const { toast } = useToast();

  const isFirebaseAuthValid = firebaseAuthInstance && typeof firebaseAuthInstance.onAuthStateChanged === 'function';

  useEffect(() => {
    if (isFirebaseAuthValid) {
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            try {
              await setDoc(userDocRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
              });
            } catch (error) {
              console.error("Error creating user document in Firestore:", error);
            }
          } else {
            try {
              await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
            } catch (error)              {
              console.error("Error updating lastLogin for user:", error);
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      setUser(null);
      console.warn("AuthProvider: Firebase Auth instance not valid or not fully initialized. This often indicates an issue with Firebase configuration (e.g., API key). Authentication will not work.");
      // No toast here, as it might be too early or cause issues if useToast itself relies on a context that isn't ready.
    }
  }, [isFirebaseAuthValid]);

  const signInWithGoogleHandler = async () => {
    if (!isFirebaseAuthValid || typeof firebaseAuthInstance.signInWithPopup !== 'function') {
      console.error("signInWithGoogle: Firebase Auth instance is not properly initialized.");
      toast({ title: "Configuration Error", description: "Authentication service is not available. Please check Firebase configuration.", variant: "destructive"});
      setLoading(false);
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuthInstance, provider);
      // user state will be updated by onAuthStateChanged
      toast({ title: "Signed In", description: "Attempting to sign in with Google..."}); // More accurate message
    } catch (error: any) {
      console.warn("Google Sign-In Error Details:", error);
      let message = "Could not sign in with Google. Please try again.";
      // ... (error code specific messages remain the same)
      if (error.code === 'auth/popup-closed-by-user') {
        message = "Sign-in popup was closed before completion. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "Sign-in popup request was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        message = "Sign-in popup was blocked by the browser. Please disable your popup blocker and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
          message = "Google Sign-In is not enabled for this project. Please contact support.";
      } else if (error.code === 'auth/unauthorized-domain') {
          message = "This domain is not authorized for OAuth operations. Check Firebase console.";
      } else if (error.code === 'auth/invalid-api-key') {
          message = "Firebase API Key is invalid. Please check your application configuration in .env.local and restart the server.";
      }
      toast({ title: "Sign In Failed", description: message, variant: "destructive"});
      setUser(null); // Explicitly set user to null on direct error
      setLoading(false); // Set loading to false on error
    }
  };

  const signOutHandler = async () => {
    if (!isFirebaseAuthValid || typeof firebaseAuthInstance.signOut !== 'function') {
      console.error("signOut: Firebase Auth instance is not properly initialized.");
      toast({ title: "Configuration Error", description: "Authentication service is not available. Please check Firebase configuration.", variant: "destructive"});
      return;
    }
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthInstance);
      // user state will be updated by onAuthStateChanged
      toast({ title: "Signed Out", description: "You have been successfully signed out."});
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive"});
    } finally {
      setLoading(false); // Ensure loading is false after sign out attempt
    }
  };

  const contextValue: AuthContextType = isFirebaseAuthValid ? {
    user,
    loading,
    signInWithGoogle: signInWithGoogleHandler,
    signOut: signOutHandler,
  } : {
    ...defaultAuthContextValue, // Use the non-functional defaults if Firebase auth is not valid
    loading, // Still provide the current loading state
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
