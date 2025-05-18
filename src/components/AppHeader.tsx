
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Sun, Moon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/components/ui/sidebar'; 

interface AppHeaderProps {
  currentFeatureName: string;
  onNavigate: (featureKey: string) => void; 
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
        currentEffectiveTheme = 'light'; // Fallback for SSR or pre-mount
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
    displayTheme = 'light'; // Consistent SSR default for system theme
  }
  // If theme is 'light' or 'dark', displayTheme is already correct.


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      {isMobile && (
        <Button size="icon" variant="outline" className="sm:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <h1 className="text-xl font-semibold grow">{currentFeatureName}</h1>
      <div className="flex items-center gap-2">
        {mounted ? ( // Only render theme toggle button once mounted to ensure correct icon
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {displayTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
        ) : (
            <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
                <Moon className="h-5 w-5" /> {/* Default placeholder icon */}
            </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onNavigate('settings')} aria-label="Open settings">
           <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

