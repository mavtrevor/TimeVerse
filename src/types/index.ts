
export interface Alarm {
  id: string;
  time: string; // HH:mm
  label: string;
  sound: string; // Identifier for the sound
  snoozeEnabled: boolean;
  snoozeDuration: number; // in minutes
  isActive: boolean;
  days?: number[]; // 0 for Sunday, 1 for Monday, etc. Optional for recurring alarms
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
  timezone: string; // e.g., "America/New_York"
}

export type TimeFormat = "12h" | "24h";
export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "en" | "ar" | "fr";

export interface AppSettings {
  timeFormat: TimeFormat;
  theme: AppTheme;
  language: AppLanguage;
}

export type FeatureKey = "alarms" | "timers" | "stopwatch" | "worldclock" | "utilities" | "calendar" | "settings";

export interface NavItem {
  id: FeatureKey;
  label: string;
  icon: React.ElementType;
  component: React.ElementType;
}
