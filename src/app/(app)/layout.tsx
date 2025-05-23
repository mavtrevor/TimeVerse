
"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset, useSidebar
} from '@/components/ui/sidebar';
import AppHeader from '@/components/AppHeader';
import { Logo } from '@/components/icons/Logo';
import { navItemsList } from '@/lib/navConfig';
import type { FeatureKey } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { Moon, Sun } from 'lucide-react';
// AuthProvider import removed as authentication is no longer part of the app

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useSettings();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  let displayTheme = theme;
  if (mounted && theme === 'system') {
    displayTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (!mounted && theme === 'system') {
    displayTheme = 'light'; // Consistent SSR default
  }
  
  const toggleThemeInLayout = () => {
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (theme === 'system') {
        currentEffectiveTheme = 'light'; 
    }
    setTheme(currentEffectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const getActiveFeatureKey = (): FeatureKey | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (pathname === '/') return 'alarms'; // Root '/' is alarms

    // Handle nested (app) routes
    const appSegmentIndex = segments.indexOf('(app)');
    const relevantSegments = appSegmentIndex !== -1 ? segments.slice(appSegmentIndex + 1) : segments;
    
    if (relevantSegments.length === 0 && pathname.startsWith('/app')) return 'alarms'; // Default for /app or similar
    if (relevantSegments.length === 0 && pathname === '/') return 'alarms';


    const mainSegment = relevantSegments[0] as FeatureKey;
    
    if (mainSegment === 'world-clock' && relevantSegments.length > 0) return 'worldclock';
    if (navItemsList.some(item => item.id === mainSegment)) return mainSegment;
    if (mainSegment === 'settings') return 'settings'; // Assuming settings is a direct child of (app)
    
    // Fallback for top-level pages that might not be in (app) but are in navItemsList
    const topLevelSegment = segments[0] as FeatureKey;
    if (navItemsList.some(item => item.id === topLevelSegment)) return topLevelSegment;


    return null;
  };
  const activeKey = getActiveFeatureKey();

  let currentFeatureLabel = "TimeVerse"; // Default
  if (activeKey) {
    const activeItem = [...navItemsList].find(item => item.id === activeKey);
    if (activeItem) {
      currentFeatureLabel = activeItem.label;
    } else if (activeKey === 'settings'){
        currentFeatureLabel = "Settings";
    }
  }


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Logo />
            <span className="group-data-[collapsible=icon]:hidden">
              TimeVerse
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItemsList.map(item => (
              <SidebarMenuItem key={item.id}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={activeKey === item.id}
                    tooltip={item.label}
                    className="justify-start"
                    as="a" 
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t">
          <SidebarMenu>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader currentFeatureName={currentFeatureLabel} onNavigate={(featureKey) => {
        }} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <footer className="border-t p-4 text-center text-xs text-muted-foreground">
           <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/contact" className="hover:text-foreground">Contacts</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <span className="hidden sm:inline">|</span>
            <span>© 2025 TimeVerse</span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
