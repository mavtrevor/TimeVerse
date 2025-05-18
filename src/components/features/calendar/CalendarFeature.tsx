
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function CalendarFeature() {
  const [date, setDate] = useState<Date | undefined>(new Date(2025, 0, 1)); // Default to Jan 1, 2025

  return (
    <div className="p-4 md:p-6">
      <Card className="shadow-lg max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">2025 Calendar</CardTitle>
          <CardDescription>
            Reference calendar for the year 2025.
            {date && <p className="mt-2">Selected: {format(date, "PPP")}</p>}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={new Date(2025, 0, 1)} // Start view in Jan 2025
            fromDate={new Date(2025, 0, 1)}
            toDate={new Date(2025, 11, 31)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
}
