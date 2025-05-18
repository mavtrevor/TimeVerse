
"use client";

import React from 'react';
import DateCalculator from './DateCalculator';
import HourCalculator from './HourCalculator';
import WeekNumber from './WeekNumber';

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
    </div>
  );
}
