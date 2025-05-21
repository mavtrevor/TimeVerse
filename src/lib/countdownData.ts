
import type { ShortcutCountdownEvent } from '@/types';
import { getMonth, getDate, getYear, set, addYears, getDay, addDays, startOfDay, endOfDay } from 'date-fns';

// Helper to get next occurrence of a specific month and day
const getNextOccurrence = (month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date => {
  const now = new Date();
  let targetDate = set(now, { month: month - 1, date: day, hours: hour, minutes: minute, seconds: second, milliseconds: 0 });
  if (targetDate < now) {
    targetDate = addYears(targetDate, 1);
  }
  return targetDate;
};

// Helper for US Thanksgiving (4th Thursday of November)
const getNextThanksgivingUS = (): Date => {
  const now = new Date();
  let year = getYear(now);
  let thanksgiving = set(now, { year, month: 10, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }); // Nov 1st

  while (getDay(thanksgiving) !== 4) { // 4 is Thursday
    thanksgiving = addDays(thanksgiving, 1);
  }
  thanksgiving = addDays(thanksgiving, 21); // Add 3 weeks to get to the 4th Thursday

  if (thanksgiving < now) {
    year++;
    thanksgiving = set(now, { year, month: 10, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    while (getDay(thanksgiving) !== 4) {
      thanksgiving = addDays(thanksgiving, 1);
    }
    thanksgiving = addDays(thanksgiving, 21);
  }
  return startOfDay(thanksgiving);
};

// Helper for Easter Sunday (using a fixed date for 2025 for simplicity)
// A full Easter calculation is complex. For a real app, use a library or reliable algorithm.
const getNextEasterSunday = (targetYear?: number): Date => {
  const now = new Date();
  const currentYear = getYear(now);
  const yearToCalculate = targetYear || (getMonth(now) > 3 || (getMonth(now) === 3 && getDate(now) > 20) ? currentYear + 1 : currentYear);

  if (yearToCalculate === 2025) return set(new Date(2025, 3, 20), { hours:0, minutes:0, seconds:0, milliseconds:0 }); // April 20, 2025
  if (yearToCalculate === 2026) return set(new Date(2026, 3, 5), { hours:0, minutes:0, seconds:0, milliseconds:0 }); // April 5, 2026
  // Fallback for other years - this is not accurate for a real app
  return getNextOccurrence(3, 21); // Placeholder, not actual Easter
};


export const shortcutEvents: ShortcutCountdownEvent[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    category: 'Daily',
    defaultEmoji: '🌙',
    targetDateLogic: () => endOfDay(new Date()),
    description: "Countdown to the end of today."
 , color: 'blue'
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    category: 'Annual Holidays',
    defaultEmoji: '🦃',
    targetDateLogic: getNextThanksgivingUS,
    description: "Countdown to the next Thanksgiving (US)."
 , color: 'green'
  },
  {
    id: 'christmas',
    name: 'Christmas',
    category: 'Annual Holidays',
    defaultEmoji: '🎄',
    targetDateLogic: () => getNextOccurrence(12, 25),
    description: "Countdown to Christmas Day."
 , color: 'red'
  },
  {
    id: 'new-year',
    name: 'New Year\'s Day',
    category: 'Annual Holidays',
    defaultEmoji: '🎉',
    targetDateLogic: () => {
        const now = new Date();
        return set(now, { year: getYear(now) + 1, month: 0, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    },
    description: "Countdown to New Year's Day."
 , color: 'purple'
  },
  {
    id: 'valentines-day',
    name: 'Valentine\'s Day',
    category: 'Annual Holidays',
    defaultEmoji: '❤️',
    targetDateLogic: () => getNextOccurrence(2, 14),
    description: "Countdown to Valentine's Day."
 , color: 'pink'
  },
  {
    id: 'easter',
    name: 'Easter Sunday',
    category: 'Annual Holidays',
    defaultEmoji: '🐣',
    targetDateLogic: () => getNextEasterSunday(2025), // Fixed to 2025 for simplicity
    description: "Countdown to Easter Sunday (approximate for future years beyond 2025/26 without a proper algorithm)."
 , color: 'yellow'
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    category: 'Annual Holidays',
    defaultEmoji: '☪️',
    targetDateLogic: () => set(new Date(2025, 2, 30), { hours:0, minutes:0, seconds:0, milliseconds:0 }), // Approx. for 2025; actual date is lunar.
    description: "Approximate countdown to Eid al-Fitr (2025)."
  },
  {
    id: 'halloween',
    name: 'Halloween',
    category: 'Annual Holidays',
    defaultEmoji: '🎃',
    targetDateLogic: () => getNextOccurrence(10, 31),
    description: "Countdown to Halloween."
  },
  {
    id: 'chinese-new-year',
    name: 'Chinese New Year',
    category: 'Annual Holidays',
    defaultEmoji: '🧧',
    targetDateLogic: () => set(new Date(2025, 0, 29), { hours:0, minutes:0, seconds:0, milliseconds:0 }), // Approx. for 2025; actual date is lunar.
    description: "Approximate countdown to Chinese New Year (2025)."
  },
  {
    id: 'new-years-eve',
    name: 'New Year\'s Eve',
    category: 'Annual Holidays',
    defaultEmoji: '🥂',
    targetDateLogic: () => getNextOccurrence(12, 31),
    description: "Countdown to New Year's Eve."
  },
];
