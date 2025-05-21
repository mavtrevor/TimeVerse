
"use client";
import type { ReactNode } from "react";
import React, { createContext, useEffect, useState } from 'react';
import { type User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { app, db, auth as firebaseAuthInstance } from '@/lib/firebase'; // Use firebaseAuthInstance
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
            // console.log("User document created in Firestore for new user:", currentUser.uid);
          } catch (error) {
            console.error("Error creating user document in Firestore:", error);
          }
        } else {
           try {
            await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
          } catch (error) {
            console.error("Error updating lastLogin for user:", error);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuthInstance, provider);
      toast({ title: "Signed In", description: "Successfully signed in with Google."});
    } catch (error: any) {
      console.warn("Google Sign-In Error Details:", error);
      let message = "Could not sign in with Google. Please try again.";
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
      }
      toast({ title: "Sign In Failed", description: message, variant: "destructive"});
      setUser(null); 
    } finally {
      // setLoading(false); // onAuthStateChanged will handle this
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthInstance);
      setUser(null);
      toast({ title: "Signed Out", description: "You have been successfully signed out."});
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
