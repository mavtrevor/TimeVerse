
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { getDaysBetweenDates, parseDateOrReturnCurrent } from '@/lib/timeUtils';


export default function DateCalculator() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });
  const [daysDifference, setDaysDifference] = useState<number | null>(null);

  useEffect(() => {
    if (startDate && endDate) {
      setDaysDifference(getDaysBetweenDates(startDate, endDate));
    } else {
      setDaysDifference(null);
    }
  }, [startDate, endDate]);

  return (
    <Card className="shadow-md w-full">
      <CardHeader>
        <CardTitle>Date Calculator</CardTitle>
        <CardDescription>Calculate the number of days between two dates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) =>
                    startDate ? date < startDate : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {daysDifference !== null && (
          <div className="pt-4 text-center">
            <p className="text-lg font-semibold">
              Difference: <span className="text-primary">{daysDifference}</span> day{daysDifference !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
