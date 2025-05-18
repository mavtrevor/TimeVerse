
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentISOWeekNumber } from '@/lib/timeUtils';

export default function WeekNumber() {
  const [weekNumber, setWeekNumber] = useState<number | null>(null);

  useEffect(() => {
    setWeekNumber(getCurrentISOWeekNumber());
    // Optionally, update if the day changes while the component is mounted, though unlikely to be needed
    // const interval = setInterval(() => {
    //   setWeekNumber(getCurrentISOWeekNumber());
    // }, 1000 * 60 * 60); // Update every hour
    // return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-md w-full">
      <CardHeader>
        <CardTitle>Current Week Number</CardTitle>
        <CardDescription>Displays the current ISO 8601 week number of the year.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {weekNumber !== null ? (
          <p className="text-4xl font-bold text-primary">{weekNumber}</p>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </CardContent>
    </Card>
  );
}
