
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { format, addMonths, subMonths, isValid, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Holiday } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  // South Africa Holidays 2025 for testing the new table
  { date: '2025-01-01', name: "New Year's Day", type: 'public', countryCode: 'ZA', description: "First day of the new year." },
  { date: '2025-03-21', name: "Human Rights Day", type: 'public', countryCode: 'ZA', description: "Commemorates the Sharpeville massacre." },
  { date: '2025-04-18', name: "Good Friday", type: 'public', countryCode: 'ZA', description: "Christian holiday." },
  { date: '2025-04-21', name: "Family Day", type: 'public', countryCode: 'ZA', description: "Public holiday following Easter Sunday." },
  { date: '2025-04-27', name: "Freedom Day", type: 'public', countryCode: 'ZA', description: "Celebrates first post-apartheid elections." },
  { date: '2025-04-28', name: "Freedom Day (observed)", type: 'public', countryCode: 'ZA', description: "Public holiday if Freedom Day falls on Sunday." },
  { date: '2025-05-01', name: "Workers' Day", type: 'public', countryCode: 'ZA', description: "International Workers' Day." },
  { date: '2025-06-16', name: "Youth Day", type: 'public', countryCode: 'ZA', description: "Commemorates the Soweto Uprising." },
  { date: '2025-08-09', name: "National Women's Day", type: 'public', countryCode: 'ZA', description: "Commemorates the 1956 women's march." },
  { date: '2025-09-24', name: "Heritage Day", type: 'public', countryCode: 'ZA', description: "Celebrates South Africa's diverse cultures." },
  { date: '2025-12-16', name: "Day of Reconciliation", type: 'public', countryCode: 'ZA', description: "Promotes national unity and reconciliation." },
  { date: '2025-12-25', name: "Christmas Day", type: 'public', countryCode: 'ZA', description: "Christian holiday." },
  { date: '2025-12-26', name: "Day of Goodwill", type: 'public', countryCode: 'ZA', description: "Public holiday after Christmas." },
];

// Simulated fetch for the interactive calendar (fetches for the specific month)
const fetchHolidaysForMonth = async (year: number, month: number, countryCode: string): Promise<Holiday[]> => {
  console.log(`Simulating fetch for interactive calendar: ${year}-${String(month + 1).padStart(2, '0')}, Country: ${countryCode}`);
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
    }, 300); // Shorter delay for month view
  });
};

// Simulated fetch for the holiday list table (fetches for the entire year)
const fetchHolidaysForYear = async (year: number, countryCode: string): Promise<Holiday[]> => {
  console.log(`Simulating fetch for holiday list table: Year ${year}, Country: ${countryCode}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const filtered = allSampleHolidays.filter(h => {
        const holidayDateParts = h.date.split('-').map(Number);
        return holidayDateParts[0] === year && h.countryCode === countryCode && h.type === 'public';
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      resolve(filtered);
    }, 500);
  });
};


const parseHolidayDate = (dateStr: string): Date | undefined => {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
};

const tableYears = [2025, 2026, 2027, 2028, 2029];

export default function CalendarFeature() {
  const defaultInitialYear = 2025;
  const defaultInitialMonth = 0; // January (0-indexed to match image)

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date(defaultInitialYear, defaultInitialMonth, 1));
  const [selectedCountry, setSelectedCountry] = useState<string>(supportedCountries[0].code);
  const [monthlyHolidays, setMonthlyHolidays] = useState<Holiday[]>([]); // For interactive calendar
  const [yearlyHolidays, setYearlyHolidays] = useState<Holiday[]>([]); // For the new table
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [selectedHolidayDetail, setSelectedHolidayDetail] = useState<Holiday | null>(null);
  const [selectedTableYear, setSelectedTableYear] = useState<number>(2025);


  const calendarViewYear = useMemo(() => currentDisplayMonth.getFullYear(), [currentDisplayMonth]);

  // Effect for fetching holidays for the interactive calendar (monthly)
  useEffect(() => {
    const loadMonthlyHolidays = async () => {
      setIsLoadingCalendar(true);
      const year = currentDisplayMonth.getFullYear();
      const month = currentDisplayMonth.getMonth();
      try {
        const fetchedHolidays = await fetchHolidaysForMonth(year, month, selectedCountry);
        setMonthlyHolidays(fetchedHolidays);
      } catch (error) {
        console.error("Failed to fetch monthly holidays:", error);
        setMonthlyHolidays([]);
      } finally {
        setIsLoadingCalendar(false);
      }
    };
    loadMonthlyHolidays();
  }, [currentDisplayMonth, selectedCountry]);

  // Effect for fetching holidays for the table (yearly)
  useEffect(() => {
    const loadYearlyHolidays = async () => {
      setIsLoadingTable(true);
      try {
        const fetchedHolidays = await fetchHolidaysForYear(selectedTableYear, selectedCountry);
        setYearlyHolidays(fetchedHolidays);
      } catch (error) {
        console.error("Failed to fetch yearly holidays:", error);
        setYearlyHolidays([]);
      } finally {
        setIsLoadingTable(false);
      }
    };
    loadYearlyHolidays();
  }, [selectedTableYear, selectedCountry]);


  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    // Reset currentDisplayMonth to January of the current calendarViewYear when country changes
    setCurrentDisplayMonth(new Date(calendarViewYear, 0, 1));
    // Optionally, reset selectedTableYear or let it persist
    // setSelectedTableYear(2025); // Example: reset table year
  };

  const handlePrevMonth = () => {
    setCurrentDisplayMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDisplayMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    const clickedDateStr = format(day, 'yyyy-MM-dd');
    // Check against all sample holidays, not just monthly ones, for consistent detail display
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
  
  const publicHolidayDatesForCalendar = useMemo(() =>
    allSampleHolidays.filter(h => h.countryCode === selectedCountry && h.type === 'public').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [selectedCountry]);

  const observanceDatesForCalendar = useMemo(() =>
    allSampleHolidays.filter(h => h.countryCode === selectedCountry && h.type === 'observance').map(h => parseHolidayDate(h.date)).filter(Boolean) as Date[],
  [selectedCountry]);


  const modifiers = {
    isPublicHoliday: publicHolidayDatesForCalendar,
    isObservance: observanceDatesForCalendar,
  };

  const modifiersClassNames = {
    isPublicHoliday: '!bg-pink-500 !text-pink-50 rounded-sm',
    isObservance: '!bg-sky-500 !text-sky-50 rounded-sm',
  };
  
  const isPrevDisabled = currentDisplayMonth.getFullYear() === 2023 && currentDisplayMonth.getMonth() === 0;
  const isNextDisabled = currentDisplayMonth.getFullYear() === 2030 && currentDisplayMonth.getMonth() === 11;
  
  const selectedDateObjectForCalendar = selectedHolidayDetail ? parseHolidayDate(selectedHolidayDetail.date) : undefined;


  return (
    <div className="p-4 md:p-6 space-y-8"> {/* Increased overall spacing */}
      <h1 className="text-3xl font-bold text-center md:text-left">
        Calendar {calendarViewYear}
      </h1>

      <Tabs value={selectedCountry} onValueChange={handleCountryChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1">
          {supportedCountries.map(country => (
            <TabsTrigger key={country.code} value={country.code}>{country.name === "United States" ? "USA" : country.name === "United Kingdom" ? "UK" : country.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {isLoadingCalendar ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ml-2 mt-3 text-lg">Loading calendar...</p>
            </div>
          ) : (
            <Calendar
              mode="single"
              month={currentDisplayMonth}
              onMonthChange={setCurrentDisplayMonth}
              selected={selectedDateObjectForCalendar}
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="p-0 w-full max-w-xl mx-auto"
              classNames={{
                caption_label: "text-xl font-semibold",
                nav_button: cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 w-9 bg-transparent p-0 opacity-75 hover:opacity-100"
                ),
                head_cell: "text-muted-foreground rounded-md w-16 font-semibold text-sm",
                cell: cn(
                  "h-16 w-16 text-center text-base p-0 relative",
                  "[&:has([aria-selected].day-outside)]:bg-accent/50 focus-within:relative focus-within:z-20",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-16 w-16 p-0 font-normal text-base aria-selected:opacity-100"
                ),
                day_selected: selectedHolidayDetail?.type !== 'public' && selectedHolidayDetail?.type !== 'observance' 
                              ? 'ring-2 ring-primary !bg-transparent text-foreground rounded-sm' 
                              : 'rounded-sm', // Holidays retain their bg when selected
                day_today: "bg-accent text-accent-foreground rounded-sm",
                day_outside: "text-muted-foreground opacity-50 aria-selected:text-muted-foreground aria-selected:bg-accent/30",
              }}
              components={{
                Caption: ({ displayMonth }) => (
                  <div className="flex justify-between items-center px-2 py-4 border-b mb-3">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} disabled={isPrevDisabled} aria-label="Previous month" className="h-9 w-9">
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h2 className="text-xl font-semibold">
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
         {(monthlyHolidays.length > 0 || publicHolidayDatesForCalendar.length > 0 || observanceDatesForCalendar.length > 0) && !isLoadingCalendar && (
          <CardContent className="border-t pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Legend:</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
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

      {/* Holiday List Table Section */}
      <div className="space-y-4 mt-8">
        <Tabs value={String(selectedTableYear)} onValueChange={(val) => setSelectedTableYear(Number(val))} className="w-full">
          <TabsList className="mb-4">
            {tableYears.map(year => (
              <TabsTrigger key={year} value={String(year)}>{year}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <h2 className="text-2xl font-semibold">Public Holidays - {selectedTableYear} ({supportedCountries.find(c => c.code === selectedCountry)?.name})</h2>

        {isLoadingTable ? (
           <div className="flex flex-col items-center justify-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-md">Loading holidays for {selectedTableYear}...</p>
          </div>
        ) : yearlyHolidays.length > 0 ? (
          <Card className="shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyHolidays.map((holiday, index) => {
                  const holidayDate = parseHolidayDate(holiday.date);
                  return (
                    <TableRow key={holiday.date + holiday.name}>
                      <TableCell>{index + 1}.</TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>{holidayDate ? format(holidayDate, "MMMM d, yyyy") : 'Invalid Date'}</TableCell>
                      <TableCell className="text-right">{holidayDate ? format(holidayDate, "EE") : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No public holidays found for {selectedTableYear} in {supportedCountries.find(c => c.code === selectedCountry)?.name}.
            </CardContent>
          </Card>
        )}
      </div>


      <Dialog open={!!selectedHolidayDetail} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedHolidayDetail(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedHolidayDetail?.name}</DialogTitle>
            {selectedHolidayDetail && selectedHolidayDetail.date && parseHolidayDate(selectedHolidayDetail.date) && (
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

