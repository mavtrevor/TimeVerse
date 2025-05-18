
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset, useSidebar
} from '@/components/ui/sidebar';
import AppHeader from '@/components/AppHeader';
import { Logo } from '@/components/icons/Logo';
import { navItemsList, settingsItem } from '@/lib/navConfig';
import type { FeatureKey } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { Moon, Sun } from 'lucide-react';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useSettings();
  const [mounted, setMounted] = React.useState(false);
  // For mobile sidebar state, ensure SidebarProvider is at the root or useSidebar here.
  // SidebarProvider is used, so useSidebar() hook can be used to control mobile menu if needed from here.
  // However, AppHeader usually handles its own mobile menu trigger via useSidebar().

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

    const mainSegment = segments[0] as FeatureKey;
    
    if (mainSegment === 'world-clock' && segments.length > 0) return 'worldclock'; // Handles /world-clock and /world-clock/city
    if (navItemsList.some(item => item.id === mainSegment)) return mainSegment;
    if (mainSegment === 'settings') return 'settings';
    
    return null;
  };
  const activeKey = getActiveFeatureKey();

  let currentFeatureLabel = "ChronoZen"; // Default
  if (activeKey) {
    const activeItem = [...navItemsList, settingsItem].find(item => item.id === activeKey);
    if (activeItem) {
      currentFeatureLabel = activeItem.label;
    }
  }


  return (
    <SidebarProvider> {/* Moved SidebarProvider here to wrap Sidebar and SidebarInset */}
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Logo />
            <span className="group-data-[collapsible=icon]:hidden">ChronoZen</span>
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
            <SidebarMenuItem>
              <Link href={settingsItem.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={activeKey === settingsItem.id}
                  tooltip={settingsItem.label}
                  className="justify-start"
                  as="a"
                >
                  <settingsItem.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{settingsItem.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {mounted ? (
                  <SidebarMenuButton
                      onClick={toggleThemeInLayout}
                      tooltip={displayTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      className="justify-start"
                  >
                      {displayTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      <span className="group-data-[collapsible=icon]:hidden">
                      {displayTheme === 'dark' ? "Light Mode" : "Dark Mode"}
                      </span>
                  </SidebarMenuButton>
              ) : ( 
                <SidebarMenuButton tooltip="Toggle theme" className="justify-start" disabled> 
                  <Moon className="h-5 w-5" /> 
                  <span className="group-data-[collapsible=icon]:hidden">Dark Mode</span> 
                </SidebarMenuButton> 
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        {/* AppHeader's onNavigate is now for specific actions within header, not main feature nav */}
        <AppHeader currentFeatureName={currentFeatureLabel} onNavigate={(featureKey) => {
            // If 'settings' is clicked in AppHeader, it should navigate.
            // This is now handled by Link in AppHeader itself.
        }} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
