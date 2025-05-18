
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Sun, Moon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/components/ui/sidebar'; 

interface AppHeaderProps {
  currentFeatureName: string;
  onNavigate: (featureKey: string) => void; // Kept for potential future use or specific header actions
}

export default function AppHeader({ currentFeatureName, onNavigate }: AppHeaderProps) {
  const { theme, setTheme } = useSettings();
  const { toggleSidebar, isMobile } = useSidebar(); 
  const [mounted, setMounted] = useState(false);

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
  if (mounted && theme === 'system') {
    displayTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (!mounted && theme === 'system') {
    displayTheme = 'light'; 
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isMobile && (
        <Button size="icon" variant="outline" className="sm:hidden" onClick={toggleSidebar}> {/* Reverted to sm:hidden */}
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
      </div>
    </header>
  );
}
