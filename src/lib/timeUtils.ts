
import type { AppSettings, CityDetail } from '@/types';
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

export const getTimeInTimezone = (timezone: string, settings: AppSettings, baseDateInput?: Date | null) => {
  const baseDate = baseDateInput instanceof Date && !isNaN(baseDateInput.getTime()) ? baseDateInput : new Date();
  try {
    const formatter = new Intl.DateTimeFormat(settings.language, { // Use settings.language
      timeZone: timezone,
      hour: settings.timeFormat === '12h' ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: settings.timeFormat === '12h',
    });
    return formatter.format(baseDate);
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    return formatTime(baseDate, settings.timeFormat) + (timezone === 'UTC' ? ' UTC' : ' (Error)');
  }
};

export const getTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date();
    // Get the date formatted in the target timezone to determine its offset from UTC
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false, // Use 24-hour for calculation to avoid AM/PM issues
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') -1; // month is 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

    // Create a date object representing the local time in the target timezone
    const tzDate = new Date(Date.UTC(year, month, day, hour, minute));

    // Create a date object representing the same instant in UTC
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes()));
    
    const offsetInMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    
    const sign = offsetInMinutes >= 0 ? '+' : '-';
    const absOffsetHours = Math.floor(Math.abs(offsetInMinutes) / 60);
    const absOffsetMinutes = Math.abs(offsetInMinutes) % 60;
    
    return `UTC${sign}${absOffsetHours.toString().padStart(2, '0')}:${absOffsetMinutes.toString().padStart(2, '0')}`;

  } catch (error) {
    console.error(`Error getting offset for ${timezone}:`, error);
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

// Extended list for the "Add City" dropdown, can be much larger in a real app or use Intl.supportedValuesOf('timeZone')
export const commonTimezones = [
  // Keep existing small list, or replace with a more comprehensive one if needed.
  // For now, keep it small, assuming popular cities cover most needs.
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
  { name: "Denver", timezone: "America/Denver" },
  { name: "Phoenix", timezone: "America/Phoenix" },
  { name: "Anchorage", timezone: "America/Anchorage" },
  { name: "Honolulu", timezone: "Pacific/Honolulu" },
  { name: "Toronto", timezone: "America/Toronto" },
  { name: "Manila", timezone: "Asia/Manila" },
  { name: "Singapore", timezone: "Asia/Singapore" },
  { name: "Berlin", timezone: "Europe/Berlin" },
  { name: "Mexico City", timezone: "America/Mexico_City" },
  { name: "Buenos Aires", timezone: "America/Argentina/Buenos_Aires" },
  { name: "New Delhi", timezone: "Asia/Kolkata"},
  { name: "Sao Paulo", timezone: "America/Sao_Paulo"},
  { name: "Johannesburg", timezone: "Africa/Johannesburg"},
  { name: "Cairo", timezone: "Africa/Cairo"}
];

export function getSeason(date: Date, hemisphere: CityDetail['hemisphere']): string {
  if (hemisphere === 'Equatorial') {
    return 'a tropical climate'; // Simplified
  }
  const month = date.getMonth(); // 0-11 (Jan-Dec)

  if (hemisphere === 'Northern') {
    if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'Autumn'; // Sep, Oct, Nov
    return 'Winter'; // Dec, Jan, Feb
  } else { // Southern
    if (month >= 8 && month <= 10) return 'Spring'; // Sep, Oct, Nov
    if (month === 11 || month === 0 || month === 1) return 'Summer'; // Dec, Jan, Feb
    if (month >= 2 && month <= 4) return 'Autumn'; // Mar, Apr, May
    return 'Winter'; // Jun, Jul, Aug
  }
}

export function getTimeOfDayInfo(date: Date, cityName: string, season: string, language: string = 'en'): { paragraph1: string; paragraph2: string } {
  const hour = date.getHours();
  let timeOfDayGreeting = '';
  let activitySuggestion = '';

  // This part could be internationalized further if needed
  if (hour >= 5 && hour < 12) {
    timeOfDayGreeting = `Good morning from ${cityName}! The day is just beginning.`;
    activitySuggestion = `It's a common time for people to start their day, perhaps with breakfast or commuting to work or school.`;
  } else if (hour >= 12 && hour < 17) {
    timeOfDayGreeting = `It's afternoon in ${cityName}. The day is in full swing.`;
    activitySuggestion = `Many are likely engaged in work, studies, or daily errands. Lunch breaks are common during this period.`;
  } else if (hour >= 17 && hour < 21) {
    timeOfDayGreeting = `Good evening from ${cityName}. The day is winding down for many.`;
    activitySuggestion = `People might be returning home, preparing dinner, or enjoying leisure time as dusk approaches or night falls.`;
  } else {
    timeOfDayGreeting = `It's nighttime in ${cityName}. The city transitions to a quieter pace or vibrant nightlife.`;
    activitySuggestion = `While many are resting, some parts of the city might still be active with evening entertainment or late-night services.`;
  }
  
  const currentSeasonDescription = hemisphere => {
    switch(season) {
      case 'Spring': return "flowers bloom and nature awakens";
      case 'Summer': return "days are long and often warm";
      case 'Autumn': return "leaves change color and the air cools";
      case 'Winter': return "it's often colder, with shorter days";
      default: return "the weather is characteristic of its region";
    }
  };


  const paragraph1 = `${timeOfDayGreeting} Currently, ${cityName} is experiencing ${season}, where ${currentSeasonDescription(season)}. This time of year influences the local environment and daily life.`;
  const paragraph2 = activitySuggestion + ` The specific activities can vary greatly depending on local customs and the day of the week.`;

  return { paragraph1, paragraph2 };
}

export function getShortTimezoneName(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzName = parts.find(part => part.type === 'timeZoneName');
    return tzName ? tzName.value : timezone; // Fallback to IANA name if short name not found
  } catch (e) {
    return timezone; // Fallback on error
  }
}
