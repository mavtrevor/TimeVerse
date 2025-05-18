
import { AppSettings } from '@/types';
import { format, differenceInDays, addHours, subHours, addMinutes, subMinutes, getISOWeek, parseISO } from 'date-fns';

export const formatTime = (date: Date, timeFormat: AppSettings['timeFormat']): string => {
  if (timeFormat === '12h') {
    return format(date, 'h:mm:ss a');
  }
  return format(date, 'HH:mm:ss');
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMMM d, yyyy');
};

export const formatTimeForInput = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const getDaysBetweenDates = (date1: Date, date2: Date): number => {
  return Math.abs(differenceInDays(date1, date2));
};

export const calculateNewTime = (
  date: Date,
  hours: number,
  minutes: number,
  operation: 'add' | 'subtract'
): Date => {
  let newDate = date;
  if (operation === 'add') {
    newDate = addHours(newDate, hours);
    newDate = addMinutes(newDate, minutes);
  } else {
    newDate = subHours(newDate, hours);
    newDate = subMinutes(newDate, minutes);
  }
  return newDate;
};

export const getCurrentISOWeekNumber = (): number => {
  return getISOWeek(new Date());
};

export const parseTimeString = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const secondsToHMS = (secs: number): { h: number; m: number; s: number } => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return { h, m, s };
};

export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const { h, m, s } = secondsToHMS(totalSeconds);
  const hoursStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const minutesStr = `${m.toString().padStart(2, '0')}:`;
  const secondsStr = s.toString().padStart(2, '0');
  return `${hoursStr}${minutesStr}${secondsStr}`;
};

export const getTimeInTimezone = (timezone: string, settings: AppSettings) => {
  const date = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: settings.timeFormat === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: settings.timeFormat === '12h',
    });
    return formatter.format(date);
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    // Fallback to UTC or local if timezone is invalid
    return formatTime(date, settings.timeFormat) + (timezone === 'UTC' ? ' UTC' : ' (Local)');
  }
};

export const getTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetInHours = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    
    const sign = offsetInHours >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetInHours);
    const hours = Math.floor(absOffset);
    const minutes = (absOffset - hours) * 60;
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return 'N/A';
  }
};

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export function parseDateOrReturnCurrent(dateString?: string | Date): Date {
  if (dateString instanceof Date && isValidDate(dateString)) {
    return dateString;
  }
  if (typeof dateString === 'string') {
    const parsed = parseISO(dateString);
    if (isValidDate(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

// Basic list of timezones for world clock. 
// For a real app, use a comprehensive library or API.
export const commonTimezones = [
  { name: "Local Time", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { name: "UTC", timezone: "UTC" },
  { name: "New York", timezone: "America/New_York" },
  { name: "London", timezone: "Europe/London" },
  { name: "Paris", timezone: "Europe/Paris" },
  { name: "Tokyo", timezone: "Asia/Tokyo" },
  { name: "Sydney", timezone: "Australia/Sydney" },
  { name: "Los Angeles", timezone: "America/Los_Angeles" },
  { name: "Chicago", timezone: "America/Chicago" },
  { name: "Moscow", timezone: "Europe/Moscow" },
  { name: "Dubai", timezone: "Asia/Dubai" },
  { name: "Shanghai", timezone: "Asia/Shanghai" },
];
