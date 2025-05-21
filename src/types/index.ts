
export interface Alarm {
  id: string;
  time: string; // HH:mm
  label: string;
  sound: string; // Identifier for the sound
  snoozeEnabled: boolean;
  snoozeDuration: number; // in minutes
  isActive: boolean;
  days?: number[]; // 0 for Sunday, 1 for Monday, etc. Optional for recurring alarms
  // type, teamId, creatorName removed
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
  id: string; 
  name: string;
  timezone: string; 
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
export type AppLanguage = "en" | "ar" | "fr"; 

export interface AppSettings {
  timeFormat: TimeFormat;
  theme: AppTheme;
  language: AppLanguage;
}

// "teams" and "dashboard" removed from FeatureKey
export type FeatureKey = "alarms" | "timers" | "stopwatch" | "worldclock" | "utilities" | "calendar" | "settings" | "countdown" | "schedule" | "pomodoro" | "timezone";


export interface NavItem {
  id: FeatureKey;
  label: string;
  icon: React.ElementType;
  component: React.ElementType; // Made mandatory again as AppLayout is back to rendering components
  href: string;
}

export interface Holiday {
  date: string; 
  name: string;
  type: 'public' | 'observance' | 'other';
  countryCode: string;
  description?: string;
}

export interface EventCountdown {
  id: string;
  name: string;
  date: string; 
  emoji?: string;
  // userId removed
}

export interface ShortcutCountdownEvent {
  id: string; 
  name: string; 
  category: string;
  defaultEmoji?: string;
  targetDateLogic: () => Date; 
  description?: string; 
  color?: string; // Added for shortcut button styling
}

export type RecurrenceType = 'none' | 'daily' | 'weekly';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export interface ScheduleItem {
  id: string;
  text: string;
  completed: boolean;
  date: string; 
  time?: string; 
  notes?: string; 
  recurrenceType?: RecurrenceType;
  recurrenceDays?: number[]; 
  recurrenceEndDate?: string; 
  difficulty?: TaskDifficulty; 
}
