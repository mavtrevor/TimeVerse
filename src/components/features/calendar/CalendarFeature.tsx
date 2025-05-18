
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { format, addMonths, subMonths, isValid, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Holiday } from '@/types';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const supportedCountries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ZA', name: 'South Africa' },
];

// Placeholder for holiday data and fetch function
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
  { date: '2025-05-06', name: "Sample Observance 1", type: 'observance', countryCode: 'US', description: "A sample observance day." },
  { date: '2025-05-08', name: "Sample Observance 2", type: 'observance', countryCode: 'US', description: "Another sample observance day." },
  // UK Holidays 2025 (Example Data)
  { date: '2025-01-01', name: "New Year's Day", type: 'public', countryCode: 'GB', description: "Celebrates the first day of the year." },
  { date: '2025-04-18', name: "Good Friday", type: 'public', countryCode: 'GB', description: "Christian holiday observing the crucifixion of Jesus." },
];

const fetchHolidays = async (year: number, month: number, countryCode: string): Promise<Holiday[]> => {
  console.log(`Simulating fetch for: ${year}-${String(month + 1).padStart(2, '0')}, Country: ${countryCode}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const filtered = allSampleHolidays.filter(h => {
        const holidayDateParts = h.date.split('-').map(Number);
        const holidayDate = new Date(holidayDateParts[0], holidayDateParts[1] - 1, holidayDateParts[2]);
        return h.countryCode === countryCode &&
               holidayDate.getFullYear() === year &&
               holidayDate.getMonth() === month;
      });
      resolve(filtered);
    }, 500);
  });
};

const parseHolidayDate = (dateStr: string): Date | undefined => {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
};

export default function CalendarFeature() {
  const defaultInitialYear = 2025;
  const defaultInitialMonth = 4; // May (0-indexed)

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
      const month = currentDisplayMonth.getMonth();
      try {
        const fetchedHolidays = await fetchHolidays(year, month, selectedCountry);
        setHolidays(fetchedHolidays);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
        setHolidays([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadHolidays();
  }, [currentDisplayMonth, selectedCountry]);

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
    const holidayOnClickedDay = allSampleHolidays.find(h => h.date === clickedDateStr && h.countryCode === selectedCountry);

    if (holidayOnClickedDay) {
      setSelectedHolidayDetail(holidayOnClickedDay);
    } else {
      setSelectedHolidayDetail({
        date: clickedDateStr,
        name: "Selected Day",
        type: "other",
        countryCode: selectedCountry,
        description: format(day, "EEEE, MMMM d, yyyy")
      });
    }
  };
  
  const publicHolidayDates = useMemo(() =>
    allSampleHolidays.filter(h => h.countryCode === selectedCountry && h.type === 'public').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [selectedCountry]); // Removed allSampleHolidays from dep array as it's constant

  const observanceDates = useMemo(() =>
    allSampleHolidays.filter(h => h.countryCode === selectedCountry && h.type === 'observance').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [selectedCountry]); // Removed allSampleHolidays from dep array


  const modifiers = {
    isPublicHoliday: publicHolidayDates,
    isObservance: observanceDates,
  };

  const modifiersClassNames = {
    isPublicHoliday: '!bg-pink-500 !text-pink-50-foreground rounded-sm', // Ensuring high specificity
    isObservance: '!bg-sky-500 !text-sky-50-foreground rounded-sm',    // Ensuring high specificity
  };
  
  const isPrevDisabled = currentDisplayMonth.getFullYear() === 2023 && currentDisplayMonth.getMonth() === 0;
  const isNextDisabled = currentDisplayMonth.getFullYear() === 2030 && currentDisplayMonth.getMonth() === 11;
  
  const selectedDateObject = selectedHolidayDetail ? parseHolidayDate(selectedHolidayDetail.date) : undefined;


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center md:text-left">
        Calendar {selectedYear}
      </h1>

      <Tabs value={selectedCountry} onValueChange={handleCountryChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
          {supportedCountries.map(country => (
            <TabsTrigger key={country.code} value={country.code}>{country.name === "United States" ? "USA" : country.name === "United Kingdom" ? "UK" : country.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="shadow-lg">
        <CardContent className="pt-6"> {/* Removed flex justify-center */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96"> {/* Increased height for loading */}
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-2 mt-3 text-lg">Loading holidays...</p>
            </div>
          ) : (
            <Calendar
              mode="single"
              month={currentDisplayMonth}
              onMonthChange={setCurrentDisplayMonth}
              selected={selectedDateObject}
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="p-0 w-full max-w-xl mx-auto" // Added w-full, max-w-xl, mx-auto
              classNames={{
                caption_label: "text-xl font-semibold", // Increased size
                nav_button: cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 w-9 bg-transparent p-0 opacity-75 hover:opacity-100" // Increased size
                ),
                head_cell: "text-muted-foreground rounded-md w-16 font-semibold text-sm", // Increased width and font size
                cell: cn(
                  "h-16 w-16 text-center text-base p-0 relative", // Increased cell size and base text size
                  "[&:has([aria-selected].day-outside)]:bg-accent/50 focus-within:relative focus-within:z-20",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-16 w-16 p-0 font-normal text-base aria-selected:opacity-100" // Increased day button size and text size
                ),
                day_selected: selectedHolidayDetail?.type !== 'public' && selectedHolidayDetail?.type !== 'observance' 
                              ? 'ring-2 ring-primary !bg-transparent text-foreground rounded-sm' 
                              : 'rounded-sm',
                day_today: "bg-accent text-accent-foreground rounded-sm",
                day_outside: "text-muted-foreground opacity-50 aria-selected:text-muted-foreground aria-selected:bg-accent/30",
              }}
              components={{
                Caption: ({ displayMonth }) => (
                  <div className="flex justify-between items-center px-2 py-4 border-b mb-3"> {/* Adjusted padding/margin */}
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} disabled={isPrevDisabled} aria-label="Previous month" className="h-9 w-9">
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h2 className="text-xl font-semibold"> {/* Matches caption_label style */}
                      {format(displayMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isNextDisabled} aria-label="Next month" className="h-9 w-9">
                      <ChevronRight className="h-6 w-6" />
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
                <span className="h-3 w-3 rounded-sm bg-pink-500 mr-1.5"></span> Public Holiday
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-sm bg-sky-500 mr-1.5"></span> Observance
              </div>
               <div className="flex items-center">
                <span className="h-3 w-3 rounded-sm ring-2 ring-primary mr-1.5"></span> Selected Day
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={!!selectedHolidayDetail} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedHolidayDetail(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedHolidayDetail?.name}</DialogTitle>
            {selectedHolidayDetail && selectedHolidayDetail.date && (
              <DialogDescription>
                {format(parseHolidayDate(selectedHolidayDetail.date) as Date, "EEEE, MMMM d, yyyy")}
                {selectedHolidayDetail.type !== 'other' && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedHolidayDetail.type === 'public' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {selectedHolidayDetail.type.charAt(0).toUpperCase() + selectedHolidayDetail.type.slice(1)}
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedHolidayDetail?.description || (selectedHolidayDetail?.type === 'other' ? 'Standard day.' : 'No additional details available.')}
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

