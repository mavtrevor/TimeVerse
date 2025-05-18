
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Settings, Sun, Moon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useSidebar } from '@/components/ui/sidebar'; // If using the shadcn sidebar component

interface AppHeaderProps {
  currentFeatureName: string;
  onNavigate: (featureKey: string) => void; // For mobile settings navigation
}

export default function AppHeader({ currentFeatureName, onNavigate }: AppHeaderProps) {
  const { theme, setTheme } = useSettings();
  const { toggleSidebar, isMobile } = useSidebar(); // Assuming useSidebar hook is available from shadcn sidebar

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else { // System theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'light' : 'dark'); // Toggle opposite to current effective system theme
    }
  };
  
  // Determine current effective theme for icon display
  let effectiveTheme = theme;
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
       effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
        effectiveTheme = 'light'; // Default for SSR or before hydration
    }
  }


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
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {effectiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onNavigate('settings')} aria-label="Open settings">
           <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
