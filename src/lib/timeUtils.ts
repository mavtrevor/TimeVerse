
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
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false, 
    });
    const parts = formatter.formatToParts(now);
    
    let year = 0, month = 0, day = 0, hour = 0, minute = 0;

    parts.forEach(part => {
        switch (part.type) {
            case 'year': year = parseInt(part.value); break;
            case 'month': month = parseInt(part.value) - 1; break; 
            case 'day': day = parseInt(part.value); break;
            case 'hour': hour = parseInt(part.value); break;
            case 'minute': minute = parseInt(part.value); break;
        }
    });
    
    const tzDate = new Date(Date.UTC(year, month, day, hour, minute));
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


export interface CommonTimezoneInfo {
  timezone: string; // IANA name
  name: string; // User-friendly name for the timezone itself, e.g., "New York (Eastern)"
  countryCode: string; // e.g., "US"
  city: string; // Default city name for the title field
}

// Expanded list of timezones grouped by country for the dialog
export const extendedCommonTimezones: CommonTimezoneInfo[] = [
  // United States
  { timezone: "America/New_York", name: "New York (Eastern)", countryCode: "US", city: "New York" },
  { timezone: "America/Chicago", name: "Chicago (Central)", countryCode: "US", city: "Chicago" },
  { timezone: "America/Denver", name: "Denver (Mountain)", countryCode: "US", city: "Denver" },
  { timezone: "America/Los_Angeles", name: "Los Angeles (Pacific)", countryCode: "US", city: "Los Angeles" },
  { timezone: "America/Phoenix", name: "Phoenix (MST)", countryCode: "US", city: "Phoenix" },
  { timezone: "America/Anchorage", name: "Anchorage (Alaska)", countryCode: "US", city: "Anchorage" },
  { timezone: "Pacific/Honolulu", name: "Honolulu (Hawaii)", countryCode: "US", city: "Honolulu" },
  // Canada
  { timezone: "America/Toronto", name: "Toronto (Eastern)", countryCode: "CA", city: "Toronto" },
  { timezone: "America/Vancouver", name: "Vancouver (Pacific)", countryCode: "CA", city: "Vancouver" },
  { timezone: "America/Edmonton", name: "Edmonton (Mountain)", countryCode: "CA", city: "Edmonton" },
  { timezone: "America/Winnipeg", name: "Winnipeg (Central)", countryCode: "CA", city: "Winnipeg" },
  { timezone: "America/Halifax", name: "Halifax (Atlantic)", countryCode: "CA", city: "Halifax" },
  // United Kingdom
  { timezone: "Europe/London", name: "London (GMT/BST)", countryCode: "GB", city: "London" },
  // Australia
  { timezone: "Australia/Sydney", name: "Sydney (AEST/AEDT)", countryCode: "AU", city: "Sydney" },
  { timezone: "Australia/Melbourne", name: "Melbourne (AEST/AEDT)", countryCode: "AU", city: "Melbourne" },
  { timezone: "Australia/Brisbane", name: "Brisbane (AEST)", countryCode: "AU", city: "Brisbane" },
  { timezone: "Australia/Perth", name: "Perth (AWST)", countryCode: "AU", city: "Perth" },
  // France
  { timezone: "Europe/Paris", name: "Paris (CET/CEST)", countryCode: "FR", city: "Paris" },
  // Germany
  { timezone: "Europe/Berlin", name: "Berlin (CET/CEST)", countryCode: "DE", city: "Berlin" },
  // Japan
  { timezone: "Asia/Tokyo", name: "Tokyo (JST)", countryCode: "JP", city: "Tokyo" },
  // China
  { timezone: "Asia/Shanghai", name: "Beijing / Shanghai (CST)", countryCode: "CN", city: "Beijing" }, // Commonly referred to as Beijing Time
  // UAE
  { timezone: "Asia/Dubai", name: "Dubai (GST)", countryCode: "AE", city: "Dubai" },
  // India
  { timezone: "Asia/Kolkata", name: "India (IST)", countryCode: "IN", city: "New Delhi" }, // IST for whole India
  // Singapore
  { timezone: "Asia/Singapore", name: "Singapore (SGT)", countryCode: "SG", city: "Singapore" },
  // South Africa
  { timezone: "Africa/Johannesburg", name: "Johannesburg (SAST)", countryCode: "ZA", city: "Johannesburg" },
  // Mexico
  { timezone: "America/Mexico_City", name: "Mexico City (CST/CDT)", countryCode: "MX", city: "Mexico City" },
  // Brazil
  { timezone: "America/Sao_Paulo", name: "Sao Paulo (BRT/BRST)", countryCode: "BR", city: "Sao Paulo" },
  // Argentina
  { timezone: "America/Argentina/Buenos_Aires", name: "Buenos Aires (ART)", countryCode: "AR", city: "Buenos Aires" },
  // Philippines
  { timezone: "Asia/Manila", name: "Manila (PHT)", countryCode: "PH", city: "Manila" },
  // Other examples
  { timezone: "Europe/Moscow", name: "Moscow (MSK)", countryCode: "RU", city: "Moscow"},
  { timezone: "Africa/Cairo", name: "Cairo (EET/EEST)", countryCode: "EG", city: "Cairo"},
  { timezone: "Europe/Rome", name: "Rome (CET/CEST)", countryCode: "IT", city: "Rome"},
  { timezone: "Europe/Madrid", name: "Madrid (CET/CEST)", countryCode: "ES", city: "Madrid"},
  { timezone: "Asia/Seoul", name: "Seoul (KST)", countryCode: "KR", city: "Seoul"},
  { timezone: "Pacific/Auckland", name: "Auckland (NZST/NZDT)", countryCode: "NZ", city: "Auckland"},
  { timezone: "UTC", name: "UTC Coordinated Universal Time", countryCode: "UTC", city: "UTC" },
];

export const dialogCountries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "IN", name: "India" },
    { code: "SG", name: "Singapore" },
    { code: "ZA", name: "South Africa" },
    { code: "MX", name: "Mexico" },
    { code: "BR", name: "Brazil" },
    { code: "AR", name: "Argentina" },
    { code: "PH", name: "Philippines" },
    { code: "RU", name: "Russia"},
    { code: "EG", name: "Egypt"},
    { code: "IT", name: "Italy"},
    { code: "ES", name: "Spain"},
    { code: "KR", name: "South Korea"},
    { code: "NZ", name: "New Zealand"},
    { code: "UTC", name: "UTC (Universal Time)"},
].sort((a, b) => a.name.localeCompare(b.name));


export function getSeason(date: Date, hemisphere: CityDetail['hemisphere']): string {
  if (hemisphere === 'Equatorial') {
    return 'a tropical climate'; 
  }
  const month = date.getMonth(); 

  if (hemisphere === 'Northern') {
    if (month >= 2 && month <= 4) return 'Spring'; 
    if (month >= 5 && month <= 7) return 'Summer'; 
    if (month >= 8 && month <= 10) return 'Autumn'; 
    return 'Winter'; 
  } else { 
    if (month >= 8 && month <= 10) return 'Spring'; 
    if (month === 11 || month === 0 || month === 1) return 'Summer'; 
    if (month >= 2 && month <= 4) return 'Autumn'; 
    return 'Winter'; 
  }
}

export function getTimeOfDayInfo(date: Date, cityName: string, season: string, language: string = 'en'): { paragraph1: string; paragraph2: string } {
  const hour = date.getHours();
  let timeOfDayGreeting = '';
  let activitySuggestion = '';

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
  
  const currentSeasonDescription = (h: CityDetail['hemisphere']) => { // parameter renamed to avoid conflict
    switch(season) {
      case 'Spring': return "flowers bloom and nature awakens";
      case 'Summer': return "days are long and often warm";
      case 'Autumn': return "leaves change color and the air cools";
      case 'Winter': return "it's often colder, with shorter days";
      default: return "the weather is characteristic of its region";
    }
  };

  const paragraph1 = `${timeOfDayGreeting} Currently, ${cityName} is experiencing ${season}, where ${currentSeasonDescription(cityName.includes("Sydney") ? 'Southern' : 'Northern')}. This time of year influences the local environment and daily life.`; // Simplified hemisphere detection for example
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
    return tzName ? tzName.value : timezone; 
  } catch (e) {
    return timezone; 
  }
}
