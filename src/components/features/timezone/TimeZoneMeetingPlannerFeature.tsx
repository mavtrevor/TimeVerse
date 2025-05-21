"use client";

import React, { useState } from 'react';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

interface TimeZoneInfo {
  id: string;
  name: string;
}

const sampleTimeZones: TimeZoneInfo[] = [
 { id: 'America/New_York', name: 'Eastern Time (ET)' },
 { id: 'America/Chicago', name: 'Central Time (CT)' },
  { id: 'America/Denver', name: 'Mountain Time (MT)' },
  { id: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
  { id: 'Europe/London', name: 'London (GMT/BST)' },
  { id: 'Europe/Paris', name: 'Paris (CET/CEST)' },
  { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
  { id: 'Australia/Sydney', name: 'Sydney (AEST/AEDT)' },
];

export default function TimeZoneMeetingPlannerFeature() {
  const [sourceTimezone, setSourceTimezone] = useState<string>('UTC'); // Default to UTC
  const [targetTimezones, setTargetTimezones] = useState<string[]>([]); // Default to empty array
  const [inputTime, setInputTime] = useState<string>(''); // Store datetime-local value

  // Placeholder for calculated times
  const [convertedTimes, setConvertedTimes] = useState<Record<string, string>>({});

  const handleTargetTimezoneChange = (index: number, timeZone: string) => {
    const newTargetTimezones = [...targetTimezones];
    newTargetTimezones[index] = timeZone;
    setTargetTimezones(newTargetTimezones);
  };
  const handleConvertTime = () => {
    // Conversion logic will go here
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Time Zone Meeting Planner</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="sourceTimezone" className="block text-sm font-medium text-muted-foreground">
            Source Time Zone
          </label>
          <input
            type="text"
            id="sourceTimezone"
            value={sourceTimezone}
            onChange={e => setSourceTimezone(e.target.value)}
            placeholder="Source Timezone (e.g., UTC, America/New_York)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
          />
        </div>

        <div>
 <label htmlFor="inputDateTime" className="block text-sm font-medium text-muted-foreground">
 Input Meeting Date and Time ({sourceTimezone})
 </label>
 <input
 type="datetime-local"
 id="inputDateTime"
                value={inputTime}
                onChange={e => setInputTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Target Time Zones
          </label>
          <div className="space-y-3">
            {targetTimezones.map((tz, index) => (
              <div key={index} className="flex gap-4 items-center">
                 {/* Placeholder for Target Time Zone Select or Input */}
 <select
 value={tz}
 onChange={(e) => handleTargetTimezoneChange(index, e.target.value)}
 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
 >
 <option value="">Select a target time zone</option>
 {/* You might want a more comprehensive list of time zones */}
 {sampleTimeZones.map(sampleTz => (
 <option key={sampleTz.id} value={sampleTz.id}>{sampleTz.name}</option>
 ))}
                </select>

 </div>
        <div>
                <button
                  onClick={() => setTargetTimezones(targetTimezones.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
            </div>
            ))}
          </div>
          <button
            onClick={() => setTargetTimezones([...targetTimezones, ''])}
            className="mt-3 text-blue-500 hover:text-blue-700 text-sm"
 >
 + Add Target Time Zone
          </button>
        </div>

        <button
          onClick={handleConvertTime}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
 >
          Calculate Times
        </button>
      </div>

      {Object.keys(convertedTimes).length > 0 && (
          <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Calculated Times:</h3>
              <ul className="space-y-2">
                  {calculatedTimes.map((ct, index) => (
                      <li key={index} className="bg-muted/50 p-3 rounded-md border">
                          <span className="font-medium">{ct.timeZone}:</span> {ct.time}
                      </li>
                  ))}
              </ul>
          </div>
      )}

    </div>
  );
}