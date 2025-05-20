
export interface Alarm {
  id: string;
  time: string; // HH:mm
  label: string;
  sound: string; // Identifier for the sound
  snoozeEnabled: boolean;
  snoozeDuration: number; // in minutes
  isActive: boolean;
  days?: number[]; // 0 for Sunday, 1 for Monday, etc. Optional for recurring alarms
  type: 'personal' | 'team';
  teamId?: string; 
  creatorName?: string; 
}

export interface Timer {
  id: string;
  name: string;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  createdAt: number; // timestamp
}

export interface WorldClockCity {
  id: string; // User-defined ID or 'local'
  name: string; // User-defined name or auto-detected for local
  timezone: string; // e.g., "America/New_York"
}

export interface CityDetail {
  iana: string;
  name: string;
  displayName?: string; 
  description: string;
  hemisphere: 'Northern' | 'Southern' | 'Equatorial';
}

export type TimeFormat = "12h" | "24h";
export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "en" | "ar" | "fr"; // Add more as needed

export interface AppSettings {
  timeFormat: TimeFormat;
  theme: AppTheme;
  language: AppLanguage;
}

export type FeatureKey = "alarms" | "timers" | "stopwatch" | "worldclock" | "utilities" | "calendar" | "settings" | "countdown" | "teams" | "schedule";

export interface NavItem {
  id: FeatureKey;
  label: string;
  icon: React.ElementType;
  component: React.ElementType;
  href: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'public' | 'observance' | 'other';
  countryCode: string;
  description?: string;
}

export interface EventCountdown {
  id: string;
  name: string;
  date: string; // ISO string for date and time
  emoji?: string;
}

export interface ShortcutCountdownEvent {
  id: string; // URL-friendly slug
  name: string; // Display name
  category: string;
  defaultEmoji?: string;
  targetDateLogic: () => Date; 
  description?: string; 
}

export interface ScheduleItem {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD format
}
