
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { format, addMonths, subMonths, isValid, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Holiday } from '@/types';

const supportedCountries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ZA', name: 'South Africa' },
];

const availableYears = Array.from({ length: 2030 - 2023 + 1 }, (_, i) => 2023 + i);

// Placeholder for holiday data and fetch function
// In a real app, this data would come from Firebase.
const allSampleHolidays: Holiday[] = [
  // US Holidays 2025 (Example Data)
  { date: '2025-01-01', name: "New Year's Day", type: 'public', countryCode: 'US', description: "Celebrates the first day of the Gregorian calendar year." },
  { date: '2025-01-20', name: "Martin Luther King Jr. Day", type: 'public', countryCode: 'US', description: "Honors civil rights leader Martin Luther King Jr." },
  { date: '2025-02-14', name: "Valentine's Day", type: 'observance', countryCode: 'US', description: "A day to celebrate love and affection." },
  { date: '2025-02-17', name: "Washington's Birthday (Presidents' Day)", type: 'public', countryCode: 'US', description: "Honors U.S. presidents." },
  { date: '2025-05-26', name: "Memorial Day", type: 'public', countryCode: 'US', description: "Honors military personnel who died in service." },
  { date: '2025-06-19', name: "Juneteenth National Independence Day", type: 'public', countryCode: 'US', description: "Commemorates the end of slavery in the U.S." },
  { date: '2025-07-04', name: "Independence Day", type: 'public', countryCode: 'US', description: "Celebrates the Declaration of Independence." },
  { date: '2025-09-01', name: "Labor Day", type: 'public', countryCode: 'US', description: "Celebrates the American labor movement." },
  { date: '2025-10-13', name: "Columbus Day", type: 'observance', countryCode: 'US', description: "Commemorates Christopher Columbus's arrival in the Americas. (Observance)" },
  { date: '2025-11-11', name: "Veterans Day", type: 'public', countryCode: 'US', description: "Honors military veterans." },
  { date: '2025-11-27', name: "Thanksgiving Day", type: 'public', countryCode: 'US', description: "A day of giving thanks for the harvest and preceding year." },
  { date: '2025-12-25', name: "Christmas Day", type: 'public', countryCode: 'US', description: "Celebrates the birth of Jesus Christ." },
  // UK Holidays 2025 (Example Data)
  { date: '2025-01-01', name: "New Year's Day", type: 'public', countryCode: 'GB', description: "Celebrates the first day of the year." },
  { date: '2025-04-18', name: "Good Friday", type: 'public', countryCode: 'GB', description: "Christian holiday observing the crucifixion of Jesus." },
  { date: '2025-04-21', name: "Easter Monday", type: 'public', countryCode: 'GB', description: "Christian holiday, the day after Easter Sunday." },
  { date: '2025-05-05', name: "Early May bank holiday", type: 'public', countryCode: 'GB' },
  { date: '2025-05-26', name: "Spring bank holiday", type: 'public', countryCode: 'GB' },
  { date: '2025-08-25', name: "Summer bank holiday", type: 'public', countryCode: 'GB' },
  { date: '2025-12-25', name: "Christmas Day", type: 'public', countryCode: 'GB' },
  { date: '2025-12-26', name: "Boxing Day", type: 'public', countryCode: 'GB' },
  { date: '2025-11-05', name: "Guy Fawkes Night", type: 'observance', countryCode: 'GB', description: "Commemorates the failure of the Gunpowder Plot." },
  // Add more for other countries and types for testing
];

const fetchHolidays = async (year: number, month: number, countryCode: string): Promise<Holiday[]> => {
  console.log(`Simulating fetch for: ${year}-${String(month + 1).padStart(2, '0')}, Country: ${countryCode}`);
  // In a real app, this would query Firebase.
  return new Promise(resolve => {
    setTimeout(() => {
      const filtered = allSampleHolidays.filter(h => {
        // Parse date string "YYYY-MM-DD" into a Date object.
        // Ensure consistent parsing; here assuming YYYY-MM-DD refers to local date.
        const holidayDateParts = h.date.split('-').map(Number);
        const holidayDate = new Date(holidayDateParts[0], holidayDateParts[1] - 1, holidayDateParts[2]);
        
        return h.countryCode === countryCode &&
               holidayDate.getFullYear() === year &&
               holidayDate.getMonth() === month; // month is 0-indexed
      });
      resolve(filtered);
    }, 500); // Simulate network delay
  });
};

// Helper to parse YYYY-MM-DD string to Date object, robustly.
const parseHolidayDate = (dateStr: string): Date | undefined => {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
};


export default function CalendarFeature() {
  const defaultInitialYear = 2025;
  const defaultInitialMonth = 0; // January

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date(defaultInitialYear, defaultInitialMonth, 1));
  const [selectedCountry, setSelectedCountry] = useState<string>(supportedCountries[0].code);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHolidayDetail, setSelectedHolidayDetail] = useState<Holiday | null>(null);

  const selectedYear = useMemo(() => currentDisplayMonth.getFullYear(), [currentDisplayMonth]);

  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoading(true);
      const year = currentDisplayMonth.getFullYear();
      const month = currentDisplayMonth.getMonth(); // 0-indexed for Date
      try {
        const fetchedHolidays = await fetchHolidays(year, month, selectedCountry);
        setHolidays(fetchedHolidays);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
        setHolidays([]); // Clear holidays on error
      } finally {
        setIsLoading(false);
      }
    };
    loadHolidays();
  }, [currentDisplayMonth, selectedCountry]);

  const handleYearChange = (yearValue: string) => {
    const year = parseInt(yearValue, 10);
    if (!isNaN(year) && availableYears.includes(year)) {
      setCurrentDisplayMonth(new Date(year, currentDisplayMonth.getMonth(), 1));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
  };

  const handlePrevMonth = () => {
    setCurrentDisplayMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    const clickedDateStr = format(day, 'yyyy-MM-dd');
    const holidayOnClickedDay = holidays.find(h => h.date === clickedDateStr);

    if (holidayOnClickedDay) {
      setSelectedHolidayDetail(holidayOnClickedDay);
    } else {
      setSelectedHolidayDetail(null); // Close dialog if a non-holiday date is clicked
    }
  };

  const publicHolidayDates = useMemo(() => 
    holidays.filter(h => h.type === 'public').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [holidays]);

  const observanceDates = useMemo(() =>
    holidays.filter(h => h.type === 'observance').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [holidays]);

  const modifiers = {
    isPublicHoliday: publicHolidayDates,
    isObservance: observanceDates,
    ...(selectedHolidayDetail && parseHolidayDate(selectedHolidayDetail.date) && { selected: parseHolidayDate(selectedHolidayDetail.date) as Date })
  };

  const modifiersClassNames = {
    isPublicHoliday: 'font-bold !text-red-600 dark:!text-red-400',
    isObservance: 'font-semibold !text-blue-600 dark:!text-blue-400',
    selected: '!bg-primary/30 !text-primary-foreground rounded-md',
  };
  
  const isPrevDisabled = currentDisplayMonth.getFullYear() === 2023 && currentDisplayMonth.getMonth() === 0;
  const isNextDisabled = currentDisplayMonth.getFullYear() === 2030 && currentDisplayMonth.getMonth() === 11;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Calendar Options</CardTitle>
          <CardDescription>Select year and country to view holidays.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-foreground mb-1">Year</label>
            <Select value={String(selectedYear)} onValueChange={handleYearChange}>
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="country-select" className="block text-sm font-medium text-foreground mb-1">Country</label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger id="country-select">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  {supportedCountries.map(country => (
                    <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        {/* Custom header for month navigation is now part of Calendar's Caption component */}
        <CardContent className="flex justify-center pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading holidays...</p>
            </div>
          ) : (
            <Calendar
              mode="single"
              month={currentDisplayMonth}
              onMonthChange={setCurrentDisplayMonth} // Let react-day-picker handle internal month changes and update our state
              selected={selectedHolidayDetail ? parseHolidayDate(selectedHolidayDetail.date) : undefined}
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border p-0" // p-0 as caption has padding
              components={{
                Caption: ({ displayMonth }) => (
                  <div className="flex justify-between items-center px-4 py-2 border-b">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isPrevDisabled} aria-label="Previous month">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {format(displayMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isNextDisabled} aria-label="Next month">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                ),
              }}
              fromDate={new Date(2023, 0, 1)}
              toDate={new Date(2030, 11, 31)}
              showOutsideDays
              
            />
          )}
        </CardContent>
         {holidays.length > 0 && !isLoading && (
          <CardContent className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Legend:</h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-red-500 mr-1.5"></span> Public Holiday
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-blue-500 mr-1.5"></span> Observance
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={!!selectedHolidayDetail} onOpenChange={(isOpen) => !isOpen && setSelectedHolidayDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedHolidayDetail?.name}</DialogTitle>
            {selectedHolidayDetail && (
              <DialogDescription>
                {format(parseHolidayDate(selectedHolidayDetail.date) as Date, "EEEE, MMMM d, yyyy")}
                 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedHolidayDetail.type === 'public' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedHolidayDetail.type.charAt(0).toUpperCase() + selectedHolidayDetail.type.slice(1)}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedHolidayDetail?.description || 'No additional details available.'}
            </p>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-2 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
