
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
    const formatter = new Intl.DateTimeFormat(settings.language, { 
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

export const getTimezoneOffset = (timezone: string, dateForOffset?: Date): string => {
  try {
    const now = dateForOffset instanceof Date && !isNaN(dateForOffset.getTime()) ? dateForOffset : new Date();
    
    const offsetFormatter = new Intl.DateTimeFormat('en', { timeZoneName: 'longOffset', timeZone: timezone });
    const formattedParts = offsetFormatter.formatToParts(now);
    const offsetStringPart = formattedParts.find(p => p.type === 'timeZoneName');
    
    if (offsetStringPart && offsetStringPart.value.startsWith('GMT')) { 
        return offsetStringPart.value.replace('GMT', 'UTC');
    }
    
    // Fallback calculation if direct Intl name isn't 'GMT...'
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false, 
    });
    const parts = targetFormatter.formatToParts(now);
    
    let year = 0, month = 0, day = 0, hour = 0, minute = 0;
    parts.forEach(part => {
        switch (part.type) {
            case 'year': year = parseInt(part.value); break;
            case 'month': month = parseInt(part.value) - 1; break;
            case 'day': day = parseInt(part.value); break;
            case 'hour': hour = parseInt(part.value) % 24; break;
            case 'minute': minute = parseInt(part.value); break;
        }
    });
    
    const dateInTargetTzAsUtc = Date.UTC(year, month, day, hour, minute, now.getUTCSeconds(), now.getUTCMilliseconds());
    const dateInStrictUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    
    const offsetInMilliseconds = dateInTargetTzAsUtc - dateInStrictUtc;
    const offsetInMinutesTotal = offsetInMilliseconds / (1000 * 60);
    
    const sign = offsetInMinutesTotal < 0 ? '-' : '+';
    const absOffsetHours = Math.floor(Math.abs(offsetInMinutesTotal) / 60);
    const absOffsetMinutes = Math.abs(offsetInMinutesTotal) % 60;
    
    return `UTC${sign}${String(absOffsetHours).padStart(2, '0')}:${String(absOffsetMinutes).padStart(2, '0')}`;

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
  timezone: string; 
  name: string; 
  countryCode: string; 
  city: string; 
}

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
  { timezone: "America/St_Johns", name: "St. John's (Newfoundland)", countryCode: "CA", city: "St. John's" },
  // United Kingdom
  { timezone: "Europe/London", name: "London (GMT/BST)", countryCode: "GB", city: "London" },
  // Australia
  { timezone: "Australia/Sydney", name: "Sydney (AEST/AEDT)", countryCode: "AU", city: "Sydney" },
  { timezone: "Australia/Melbourne", name: "Melbourne (AEST/AEDT)", countryCode: "AU", city: "Melbourne" },
  { timezone: "Australia/Brisbane", name: "Brisbane (AEST)", countryCode: "AU", city: "Brisbane" },
  { timezone: "Australia/Perth", name: "Perth (AWST)", countryCode: "AU", city: "Perth" },
  { timezone: "Australia/Adelaide", name: "Adelaide (ACST/ACDT)", countryCode: "AU", city: "Adelaide" },
  { timezone: "Australia/Darwin", name: "Darwin (ACST)", countryCode: "AU", city: "Darwin" },
  { timezone: "Australia/Hobart", name: "Hobart (AEST/AEDT)", countryCode: "AU", city: "Hobart" },
  // France
  { timezone: "Europe/Paris", name: "Paris (CET/CEST)", countryCode: "FR", city: "Paris" },
  // Germany
  { timezone: "Europe/Berlin", name: "Berlin (CET/CEST)", countryCode: "DE", city: "Berlin" },
  // Japan
  { timezone: "Asia/Tokyo", name: "Tokyo (JST)", countryCode: "JP", city: "Tokyo" },
  // China
  { timezone: "Asia/Shanghai", name: "Beijing / Shanghai (CST)", countryCode: "CN", city: "Beijing" },
  { timezone: "Asia/Hong_Kong", name: "Hong Kong (HKT)", countryCode: "CN", city: "Hong Kong" }, // HK is often listed separately or as part of CN
  // UAE
  { timezone: "Asia/Dubai", name: "Dubai (GST)", countryCode: "AE", city: "Dubai" },
  // India
  { timezone: "Asia/Kolkata", name: "India (IST)", countryCode: "IN", city: "New Delhi" },
  // Singapore
  { timezone: "Asia/Singapore", name: "Singapore (SGT)", countryCode: "SG", city: "Singapore" },
  // South Africa
  { timezone: "Africa/Johannesburg", name: "Johannesburg (SAST)", countryCode: "ZA", city: "Johannesburg" },
  // Mexico
  { timezone: "America/Mexico_City", name: "Mexico City (CST/CDT)", countryCode: "MX", city: "Mexico City" },
  { timezone: "America/Cancun", name: "Cancun (EST)", countryCode: "MX", city: "Cancun" },
  // Brazil
  { timezone: "America/Sao_Paulo", name: "Sao Paulo (BRT/BRST)", countryCode: "BR", city: "Sao Paulo" },
  { timezone: "America/Manaus", name: "Manaus (AMT)", countryCode: "BR", city: "Manaus" },
  // Argentina
  { timezone: "America/Argentina/Buenos_Aires", name: "Buenos Aires (ART)", countryCode: "AR", city: "Buenos Aires" },
  // Philippines
  { timezone: "Asia/Manila", name: "Manila (PHT)", countryCode: "PH", city: "Manila" },
  // Russia
  { timezone: "Europe/Moscow", name: "Moscow (MSK)", countryCode: "RU", city: "Moscow"},
  { timezone: "Asia/Yekaterinburg", name: "Yekaterinburg (YEKT)", countryCode: "RU", city: "Yekaterinburg" },
  { timezone: "Asia/Vladivostok", name: "Vladivostok (VLAT)", countryCode: "RU", city: "Vladivostok" },
  // Egypt
  { timezone: "Africa/Cairo", name: "Cairo (EET/EEST)", countryCode: "EG", city: "Cairo"},
  // Italy
  { timezone: "Europe/Rome", name: "Rome (CET/CEST)", countryCode: "IT", city: "Rome"},
  // Spain
  { timezone: "Europe/Madrid", name: "Madrid (CET/CEST)", countryCode: "ES", city: "Madrid"},
  // South Korea
  { timezone: "Asia/Seoul", name: "Seoul (KST)", countryCode: "KR", city: "Seoul"},
  // New Zealand
  { timezone: "Pacific/Auckland", name: "Auckland (NZST/NZDT)", countryCode: "NZ", city: "Auckland"},
  // Indonesia
  { timezone: "Asia/Jakarta", name: "Jakarta (WIB)", countryCode: "ID", city: "Jakarta"},
  { timezone: "Asia/Makassar", name: "Makassar (WITA)", countryCode: "ID", city: "Makassar"},
  { timezone: "Asia/Jayapura", name: "Jayapura (WIT)", countryCode: "ID", city: "Jayapura"},
  // Pakistan
  { timezone: "Asia/Karachi", name: "Karachi (PKT)", countryCode: "PK", city: "Karachi"},
  // Nigeria
  { timezone: "Africa/Lagos", name: "Lagos (WAT)", countryCode: "NG", city: "Lagos"},
  // Turkey
  { timezone: "Europe/Istanbul", name: "Istanbul (TRT)", countryCode: "TR", city: "Istanbul"},
  // Thailand
  { timezone: "Asia/Bangkok", name: "Bangkok (ICT)", countryCode: "TH", city: "Bangkok"},
  // Saudi Arabia
  { timezone: "Asia/Riyadh", name: "Riyadh (AST)", countryCode: "SA", city: "Riyadh"},
  // Iran
  { timezone: "Asia/Tehran", name: "Tehran (IRST/IRDT)", countryCode: "IR", city: "Tehran"},
  // Netherlands
  { timezone: "Europe/Amsterdam", name: "Amsterdam (CET/CEST)", countryCode: "NL", city: "Amsterdam"},
  // Switzerland
  { timezone: "Europe/Zurich", name: "Zurich (CET/CEST)", countryCode: "CH", city: "Zurich"},
  // Sweden
  { timezone: "Europe/Stockholm", name: "Stockholm (CET/CEST)", countryCode: "SE", city: "Stockholm"},
  // Norway
  { timezone: "Europe/Oslo", name: "Oslo (CET/CEST)", countryCode: "NO", city: "Oslo"},
  // Ireland
  { timezone: "Europe/Dublin", name: "Dublin (GMT/IST)", countryCode: "IE", city: "Dublin"},
  // Portugal
  { timezone: "Europe/Lisbon", name: "Lisbon (WET/WEST)", countryCode: "PT", city: "Lisbon"},
  // Chile
  { timezone: "America/Santiago", name: "Santiago (CLT/CLST)", countryCode: "CL", city: "Santiago"},
  // Colombia
  { timezone: "America/Bogota", name: "Bogota (COT)", countryCode: "CO", city: "Bogota"},
  // Peru
  { timezone: "America/Lima", name: "Lima (PET)", countryCode: "PE", city: "Lima"},
  // Kenya
  { timezone: "Africa/Nairobi", name: "Nairobi (EAT)", countryCode: "KE", city: "Nairobi"},
  // Vietnam
  { timezone: "Asia/Ho_Chi_Minh", name: "Ho Chi Minh City (ICT)", countryCode: "VN", city: "Ho Chi Minh City"},
  // Malaysia
  { timezone: "Asia/Kuala_Lumpur", name: "Kuala Lumpur (MYT)", countryCode: "MY", city: "Kuala Lumpur"},
  // UTC
  { timezone: "UTC", name: "UTC Coordinated Universal Time", countryCode: "UTC", city: "UTC" },
];

export const dialogCountries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AS", name: "American Samoa" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AI", name: "Anguilla" },
    { code: "AQ", name: "Antarctica" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AW", name: "Aruba" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BS", name: "Bahamas" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BB", name: "Barbados" },
    { code: "BY", name: "Belarus" },
    { code: "BE", name: "Belgium" },
    { code: "BZ", name: "Belize" },
    { code: "BJ", name: "Benin" },
    { code: "BM", name: "Bermuda" },
    { code: "BT", name: "Bhutan" },
    { code: "BO", name: "Bolivia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BR", name: "Brazil" },
    { code: "IO", name: "British Indian Ocean Territory" },
    { code: "VG", name: "British Virgin Islands" },
    { code: "BN", name: "Brunei" },
    { code: "BG", name: "Bulgaria" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BI", name: "Burundi" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CA", name: "Canada" },
    { code: "CV", name: "Cape Verde" },
    { code: "KY", name: "Cayman Islands" },
    { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CX", name: "Christmas Island" },
    { code: "CC", name: "Cocos Islands" },
    { code: "CO", name: "Colombia" },
    { code: "KM", name: "Comoros" },
    { code: "CG", name: "Republic of the Congo" },
    { code: "CD", name: "Democratic Republic of the Congo" },
    { code: "CK", name: "Cook Islands" },
    { code: "CR", name: "Costa Rica" },
    { code: "HR", name: "Croatia" },
    { code: "CU", name: "Cuba" },
    { code: "CW", name: "Curacao" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "DJ", name: "Djibouti" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "TL", name: "East Timor" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "ER", name: "Eritrea" },
    { code: "EE", name: "Estonia" },
    { code: "ET", name: "Ethiopia" },
    { code: "FK", name: "Falkland Islands" },
    { code: "FO", name: "Faroe Islands" },
    { code: "FJ", name: "Fiji" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GF", name: "French Guiana" },
    { code: "PF", name: "French Polynesia" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "DE", name: "Germany" },
    { code: "GH", name: "Ghana" },
    { code: "GI", name: "Gibraltar" },
    { code: "GR", name: "Greece" },
    { code: "GL", name: "Greenland" },
    { code: "GD", name: "Grenada" },
    { code: "GP", name: "Guadeloupe" },
    { code: "GU", name: "Guam" },
    { code: "GT", name: "Guatemala" },
    { code: "GG", name: "Guernsey" },
    { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "HN", name: "Honduras" },
    { code: "HK", name: "Hong Kong" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IE", name: "Ireland" },
    { code: "IM", name: "Isle of Man" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "CI", name: "Ivory Coast" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JE", name: "Jersey" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KI", name: "Kiribati" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" },
    { code: "LV", name: "Latvia" },
    { code: "LB", name: "Lebanon" },
    { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MO", name: "Macau" },
    { code: "MK", name: "Macedonia" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MT", name: "Malta" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MQ", name: "Martinique" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "YT", name: "Mayotte" },
    { code: "MX", name: "Mexico" },
    { code: "FM", name: "Micronesia" },
    { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MS", name: "Montserrat" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NR", name: "Nauru" },
    { code: "NP", name: "Nepal" },
    { code: "NL", name: "Netherlands" },
    { code: "NC", name: "New Caledonia" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "NU", name: "Niue" },
    { code: "NF", name: "Norfolk Island" },
    { code: "KP", name: "North Korea" },
    { code: "MP", name: "Northern Mariana Islands" },
    { code: "NO", name: "Norway" },
    { code: "OM", name: "Oman" },
    { code: "PK", name: "Pakistan" },
    { code: "PW", name: "Palau" },
    { code: "PS", name: "Palestine" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PN", name: "Pitcairn Islands" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "PR", name: "Puerto Rico" },
    { code: "QA", name: "Qatar" },
    { code: "RE", name: "Reunion" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "BL", name: "Saint Barthelemy" },
    { code: "SH", name: "Saint Helena" },
    { code: "KN", name: "Saint Kitts and Nevis" },
    { code: "LC", name: "Saint Lucia" },
    { code: "MF", name: "Saint Martin" },
    { code: "PM", name: "Saint Pierre and Miquelon" },
    { code: "VC", name: "Saint Vincent and the Grenadines" },
    { code: "WS", name: "Samoa" },
    { code: "SM", name: "San Marino" },
    { code: "ST", name: "Sao Tome and Principe" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SN", name: "Senegal" },
    { code: "RS", name: "Serbia" },
    { code: "SC", name: "Seychelles" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SG", name: "Singapore" },
    { code: "SX", name: "Sint Maarten" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" },
    { code: "GS", name: "South Georgia and the South Sandwich Islands" },
    { code: "KR", name: "South Korea" },
    { code: "SS", name: "South Sudan" },
    { code: "ES", name: "Spain" },
    { code: "LK", name: "Sri Lanka" },
    { code: "SD", name: "Sudan" },
    { code: "SR", name: "Suriname" },
    { code: "SJ", name: "Svalbard and Jan Mayen" },
    { code: "SZ", name: "Swaziland" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "SY", name: "Syria" },
    { code: "TW", name: "Taiwan" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TZ", name: "Tanzania" },
    { code: "TH", name: "Thailand" },
    { code: "TG", name: "Togo" },
    { code: "TK", name: "Tokelau" },
    { code: "TO", name: "Tonga" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TN", name: "Tunisia" },
    { code: "TR", name: "Turkey" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TC", name: "Turks and Caicos Islands" },
    { code: "TV", name: "Tuvalu" },
    { code: "UG", name: "Uganda" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VU", name: "Vanuatu" },
    { code: "VA", name: "Vatican City" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" },
    { code: "WF", name: "Wallis and Futuna" },
    { code: "EH", name: "Western Sahara" },
    { code: "YE", name: "Yemen" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
    { code: "UTC", name: "UTC (Universal Time)"}, // For UTC selection
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
  
  const currentSeasonDescription = (h: CityDetail['hemisphere']) => { 
    switch(season) {
      case 'Spring': return "flowers bloom and nature awakens";
      case 'Summer': return "days are long and often warm";
      case 'Autumn': return "leaves change color and the air cools";
      case 'Winter': return "it's often colder, with shorter days";
      default: return "the weather is characteristic of its region";
    }
  };

  const paragraph1 = `${timeOfDayGreeting} Currently, ${cityName} is experiencing ${season}, where ${currentSeasonDescription(cityName.includes("Sydney") ? 'Southern' : 'Northern')}. This time of year influences the local environment and daily life.`; 
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
    console.warn(`Could not get short timezone name for ${timezone}. Falling back to IANA name.`);
    return timezone; 
  }
}

    