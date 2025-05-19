
"use client";

import React from 'react';
import DateCalculator from './DateCalculator';
import HourCalculator from './HourCalculator';
import WeekNumber from './WeekNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UtilitiesFeature() {
  return (
    <div className="space-y-8 p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6">Date & Time Utilities</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DateCalculator />
        <HourCalculator />
      </div>
      
      <div className="mt-8 max-w-md mx-auto">
        <WeekNumber />
      </div>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-xl">Explore Powerful Date & Time Utilities with TimeVerse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            TimeVerse offers a suite of free, easy-to-use tools designed to simplify your daily routines and scheduling. From world clocks and countdown timers to alarms, stopwatches, and calendar views, our utilities help you stay organized, punctual, and productive—whether you're planning an event, tracking a goal, or syncing across time zones.
          </p>
          <p>
            All tools are optimized for mobile and desktop, require no downloads, and work right in your browser. Customize each utility to fit your needs and enjoy real-time accuracy, sleek design, and offline support. With TimeVerse, managing your time has never been this effortless.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
