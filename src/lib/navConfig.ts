
import type { NavItem, FeatureKey } from '@/types';
import { AlarmClock, TimerIcon, Watch, Globe, SlidersHorizontal, CalendarDays, Settings } from 'lucide-react';

// NavItem type from src/types will have component as optional
// For the purpose of navigation in the layout, we don't need the component prop here.

interface NavDefinition extends Omit<NavItem, 'component'> {
  id: FeatureKey; // Ensure id is strictly FeatureKey
  href: string;
}

export const navItemsList: NavDefinition[] = [
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, href: '/' }, // Alarms will be the root page
  { id: 'timers', label: 'Timers', icon: TimerIcon, href: '/timers' },
  { id: 'stopwatch', label: 'Stopwatch', icon: Watch, href: '/stopwatch' },
  { id: 'worldclock', label: 'World Clock', icon: Globe, href: '/world-clock' },
  { id: 'utilities', label: 'Utilities', icon: SlidersHorizontal, href: '/utilities' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar' },
];

export const settingsItem: NavDefinition = { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' };
