
import type { NavItem, FeatureKey } from '@/types';
import { AlarmClock, TimerIcon, Watch, Globe, SlidersHorizontal, CalendarDays, Settings as SettingsIcon, CalendarClock, Users, ListChecks } from 'lucide-react';

// Import feature components
import AlarmsFeature from '@/components/features/alarms/AlarmsFeature';
import TimersFeature from '@/components/features/timers/TimersFeature';
import StopwatchFeature from '@/components/features/stopwatch/StopwatchFeature';
import WorldClockFeature from '@/components/features/world-clock/WorldClockFeature';
import UtilitiesFeature from '@/components/features/utilities/UtilitiesFeature';
import CalendarFeature from '@/components/features/calendar/CalendarFeature';
import SettingsFeature from '@/components/features/settings/SettingsFeature';
import CountdownFeature from '@/components/features/countdown/CountdownFeature';
import TeamsFeature from '@/components/features/teams/TeamsFeature';
import ScheduleFeature from '@/components/features/schedule/ScheduleFeature';


export const navItemsList: NavItem[] = [
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, href: '/', component: AlarmsFeature },
  { id: 'timers', label: 'Timers', icon: TimerIcon, href: '/timers', component: TimersFeature },
  { id: 'stopwatch', label: 'Stopwatch', icon: Watch, href: '/stopwatch', component: StopwatchFeature },
  { id: 'worldclock', label: 'World Clock', icon: Globe, href: '/world-clock', component: WorldClockFeature },
  { id: 'countdown', label: 'Countdown', icon: CalendarClock, href: '/countdown', component: CountdownFeature },
  { id: "schedule", label: "Schedule", icon: ListChecks, href: "/schedule", component: ScheduleFeature },
  { id: "utilities", label: "Utilities", icon: SlidersHorizontal, href: "/utilities", component: UtilitiesFeature },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar', component: CalendarFeature },
  { id: 'teams', label: 'Teams', icon: Users, href: '/teams', component: TeamsFeature },
];

export const settingsItem: NavItem = { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/settings', component: SettingsFeature };

// Helper to get feature component based on key for AppLayout
export const getFeatureComponent = (key: FeatureKey | null): React.ElementType => {
  if (!key) return AlarmsFeature; // Default
  const allItems = [...navItemsList, settingsItem];
  const item = allItems.find(i => i.id === key);
  return item ? item.component : AlarmsFeature; 
};

export const getFeatureLabel = (key: FeatureKey | null): string => {
  if (!key) return "TimeVerse";
  const allItems = [...navItemsList, settingsItem];
  const item = allItems.find(i => i.id === key);
  return item ? item.label : "TimeVerse";
}

export const getActiveFeatureKeyFromPathname = (pathname: string): FeatureKey => {
  if (pathname === '/') return 'alarms';
  const mainSegment = pathname.split('/')[1] as FeatureKey;
  if (navItemsList.some(item => item.id === mainSegment)) return mainSegment;
  if (mainSegment === 'settings') return 'settings';
  return 'alarms'; 
};
