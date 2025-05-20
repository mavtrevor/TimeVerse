
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Sun, Moon, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/components/ui/sidebar'; 
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut } from '@/lib/firebase'; // Import Firebase auth functions
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


interface AppHeaderProps {
  currentFeatureName: string;
  onNavigate: (featureKey: string) => void; 
}

export default function AppHeader({ currentFeatureName, onNavigate }: AppHeaderProps) {
  const { theme, setTheme } = useSettings();
  const { toggleSidebar, isMobile, clientReady: sidebarClientReady } = useSidebar(); 
  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Signed In", description: "Successfully signed in with Google."});
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Sign In Failed", description: "Could not sign in with Google. Please try again.", variant: "destructive"});
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out."});
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive"});
    }
  };

  const toggleTheme = () => {
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (theme === 'system') {
        currentEffectiveTheme = 'light'; 
    }

    if (currentEffectiveTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };
  
  let displayTheme = theme;
  if (mounted && theme === 'system') {
    displayTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (!mounted && theme === 'system') {
    displayTheme = 'light'; 
  }

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {sidebarClientReady && isMobile && (
        <Button size="icon" variant="outline" className="sm:hidden" onClick={toggleSidebar}> 
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <h1 className="text-xl font-semibold grow">{currentFeatureName}</h1>
      <div className="flex items-center gap-2">
        {mounted ? (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {displayTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
        ) : (
            <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
                <Moon className="h-5 w-5" />
            </Button>
        )}
        <Link href="/settings" passHref legacyBehavior>
          <Button variant="ghost" size="icon" aria-label="Open settings" as="a">
             <Settings className="h-5 w-5" />
          </Button>
        </Link>

        {authLoading ? (
          <Button variant="ghost" size="icon" disabled>
            <UserIcon className="h-5 w-5 animate-pulse" />
          </Button>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start !cursor-default">
                <span className="text-xs font-medium">{user.displayName || 'User'}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="!cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" onClick={handleSignInWithGoogle}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
