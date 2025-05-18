
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
import { navItemsList, settingsItem, getFeatureComponent, getFeatureLabel, getActiveFeatureKeyFromPathname } from '@/lib/navConfig';
import type { FeatureKey } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { Moon, Sun } from 'lucide-react';

export default function AppLayout({ children }: { children?: React.ReactNode }) { // children prop is optional now
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

  const activeKey = getActiveFeatureKeyFromPathname(pathname);
  const ActiveComponent = getFeatureComponent(activeKey);
  const currentFeatureLabel = getFeatureLabel(activeKey);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Logo />
            <span className="group-data-[collapsible=icon]:hidden">
              TimeVerse
              <span className="hidden sm:inline"> – The Ultimate Online Clock Suite</span>
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
        <AppHeader currentFeatureName={currentFeatureLabel} onNavigate={() => { /* Main nav handled by Links */ }} />
        <main className="flex-1 overflow-auto">
          <ActiveComponent />
        </main>
        <footer className="border-t p-4 text-center text-xs text-muted-foreground">
          <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/contact" className="hover:text-foreground">Contacts</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <span className="hidden sm:inline">|</span>
            <span>© 2025 TimeVerse – The Ultimate Online Clock Suite</span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

