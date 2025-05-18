
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger, 
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, AlarmClock, TimerIcon, Watch, Globe, SlidersHorizontal, CalendarDays, Moon, Sun } from 'lucide-react';
import AlarmsFeature from '@/components/features/alarms/AlarmsFeature';
import TimersFeature from '@/components/features/timers/TimersFeature';
import StopwatchFeature from '@/components/features/stopwatch/StopwatchFeature';
import WorldClockFeature from '@/components/features/world-clock/WorldClockFeature';
import UtilitiesFeature from '@/components/features/utilities/UtilitiesFeature';
import CalendarFeature from '@/components/features/calendar/CalendarFeature';
import SettingsFeature from '@/components/features/settings/SettingsFeature';
import AppHeader from '@/components/AppHeader'; 
import type { NavItem, FeatureKey } from '@/types';
import { useSettings } from '@/hooks/useSettings';


const navItemsList: NavItem[] = [
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, component: AlarmsFeature },
  { id: 'timers', label: 'Timers', icon: TimerIcon, component: TimersFeature },
  { id: 'stopwatch', label: 'Stopwatch', icon: Watch, component: StopwatchFeature },
  { id: 'worldclock', label: 'World Clock', icon: Globe, component: WorldClockFeature },
  { id: 'utilities', label: 'Utilities', icon: SlidersHorizontal, component: UtilitiesFeature },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, component: CalendarFeature },
];

const settingsItem: NavItem = { id: 'settings', label: 'Settings', icon: Settings, component: SettingsFeature };


export default function AppLayout() {
  const [activeFeatureKey, setActiveFeatureKey] = useState<FeatureKey>('alarms');
  const { theme, setTheme } = useSettings();
  const { isMobile, setOpenMobile } = useSidebar(); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ActiveComponent = navItemsList.find(item => item.id === activeFeatureKey)?.component || 
                          (activeFeatureKey === 'settings' ? settingsItem.component : navItemsList[0].component);
  
  const currentFeature = navItemsList.find(item => item.id === activeFeatureKey) || 
                         (activeFeatureKey === 'settings' ? settingsItem : navItemsList[0]);

  const handleNavigation = (featureKey: FeatureKey) => {
    setActiveFeatureKey(featureKey);
    if (isMobile) {
      setOpenMobile(false); 
    }
  };
  
  let displayTheme = theme;
  if (mounted && theme === 'system') {
    displayTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else if (!mounted && theme === 'system') {
    displayTheme = 'light'; // Consistent SSR default
  }
  
  const toggleThemeInLayout = () => {
    // Determine the theme that is *currently effectively active* to toggle from it
    let currentEffectiveTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') { // Check window for client-side media query
        currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (theme === 'system') { // Fallback for SSR or if window is not available
        currentEffectiveTheme = 'light'; 
    }
    // Now toggle: if currently effectively dark, set to light; otherwise, set to dark.
    // This logic directly sets theme to 'light' or 'dark', moving away from 'system' temporarily if user interacts.
    setTheme(currentEffectiveTheme === 'dark' ? 'light' : 'dark');
  };


  return (
    <>
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
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.id)}
                  isActive={activeFeatureKey === item.id}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation('settings')}
                  isActive={activeFeatureKey === 'settings'}
                  tooltip={settingsItem.label}
                  className="justify-start"
                >
                  <settingsItem.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{settingsItem.label}</span>
                </SidebarMenuButton>
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
                    <SidebarMenuButton
                        tooltip="Toggle theme"
                        className="justify-start"
                        disabled
                    >
                        <Moon className="h-5 w-5" /> {/* Default placeholder */}
                        <span className="group-data-[collapsible=icon]:hidden">
                            Dark Mode
                        </span>
                    </SidebarMenuButton>
                )}
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col"> 
        <AppHeader currentFeatureName={currentFeature.label} onNavigate={handleNavigation} />
        <main className="flex-1 overflow-auto">
          <ActiveComponent />
        </main>
      </SidebarInset>
    </>
  );
}

