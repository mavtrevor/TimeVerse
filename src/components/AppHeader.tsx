
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Sun, Moon, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/components/ui/sidebar'; 
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
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

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
  if (mounted && theme === 'system' && typeof window !== 'undefined') {
    displayTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (!mounted && theme === 'system') {
    displayTheme = 'light'; 
  }

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  // Determine if the component is ready on the client to avoid hydration issues with theme/auth rendering
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => {
    setClientReady(true);
  }, []);

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
        {clientReady ? (
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

      </div>
    </header>
  );
}
