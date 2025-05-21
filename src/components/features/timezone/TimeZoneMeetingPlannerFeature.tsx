
"use client";

import React, { useState } from 'react';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { Button } from '@/components/ui/button'; // Added Button import
import { Input } from '@/components/ui/input'; // Added Input import
import { Label } from '@/components/ui/label'; // Added Label import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select imports
import { Trash2 } from 'lucide-react'; // Added Trash2 import for remove button

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
  { id: 'UTC', name: 'UTC Coordinated Universal Time' },
];

interface ConvertedTimeDisplay {
  timeZone: string;
  time: string;
}

export default function TimeZoneMeetingPlannerFeature() {
  const [sourceTimezone, setSourceTimezone] = useState<string>('UTC'); 
  const [targetTimezones, setTargetTimezones] = useState<string[]>(['America/New_York', 'Europe/London']); 
  const [inputTime, setInputTime] = useState<string>(''); 
  const [convertedTimes, setConvertedTimes] = useState<ConvertedTimeDisplay[]>([]);

  const handleTargetTimezoneChange = (index: number, timeZone: string) => {
    const newTargetTimezones = [...targetTimezones];
    newTargetTimezones[index] = timeZone;
    setTargetTimezones(newTargetTimezones);
    setConvertedTimes([]); // Clear previous results when target timezones change
  };

  const handleRemoveTargetTimezone = (indexToRemove: number) => {
    setTargetTimezones(targetTimezones.filter((_, index) => index !== indexToRemove));
    setConvertedTimes([]); // Clear previous results
  };

  const handleConvertTime = () => {
    if (!inputTime || !sourceTimezone || targetTimezones.some(tz => !tz)) {
      // Basic validation
      setConvertedTimes([{ timeZone: "Error", time: "Please select source time, source timezone, and all target timezones." }]);
      return;
    }

    try {
      const sourceDate = zonedTimeToUtc(inputTime, sourceTimezone);
      const newConvertedTimes = targetTimezones.map(targetTz => {
        if (!targetTz) return { timeZone: "Invalid Target", time: "Please select a timezone." };
        const targetDate = utcToZonedTime(sourceDate, targetTz);
        return {
          timeZone: targetTz,
          time: format(targetDate, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: targetTz })
        };
      });
      setConvertedTimes(newConvertedTimes);
    } catch (error) {
      console.error("Error converting time:", error);
      setConvertedTimes([{ timeZone: "Error", time: "Failed to convert time. Check console for details." }]);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Time Zone Meeting Planner</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="sourceTimezone" className="block text-sm font-medium text-muted-foreground">
            Source Time Zone
          </Label>
          <Select value={sourceTimezone} onValueChange={setSourceTimezone}>
            <SelectTrigger id="sourceTimezone" className="mt-1 block w-full">
              <SelectValue placeholder="Select source time zone" />
            </SelectTrigger>
            <SelectContent>
              {sampleTimeZones.map(sampleTz => (
                <SelectItem key={`source-${sampleTz.id}`} value={sampleTz.id}>{sampleTz.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="inputDateTime" className="block text-sm font-medium text-muted-foreground">
            Input Meeting Date and Time ({sampleTimeZones.find(tz => tz.id === sourceTimezone)?.name || sourceTimezone})
          </Label>
          <Input
            type="datetime-local"
            id="inputDateTime"
            value={inputTime}
            onChange={e => { setInputTime(e.target.value); setConvertedTimes([]); }}
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-muted-foreground mb-2">
            Target Time Zones
          </Label>
          <div className="space-y-3">
            {targetTimezones.map((tz, index) => (
              <div key={index} className="flex gap-2 sm:gap-4 items-center">
                <Select
                  value={tz}
                  onValueChange={(value) => handleTargetTimezoneChange(index, value)}
                  
                >
                  <SelectTrigger className="block w-full">
                    <SelectValue placeholder="Select a target time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleTimeZones.map(sampleTz => (
                      <SelectItem key={`target-${index}-${sampleTz.id}`} value={sampleTz.id}>{sampleTz.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTargetTimezone(index)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Remove target timezone"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={() => setTargetTimezones([...targetTimezones, ''])}
            variant="link"
            className="mt-3 text-primary hover:text-primary/90 px-0"
          >
            + Add Target Time Zone
          </Button>
        </div>

        <Button
          onClick={handleConvertTime}
          className="w-full sm:w-auto"
        >
          Calculate Times
        </Button>
      </div>

      {convertedTimes.length > 0 && (
          <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Calculated Times:</h3>
              <ul className="space-y-2">
                  {convertedTimes.map((ct, index) => (
                      <li key={index} className="bg-muted/50 p-3 rounded-md border">
                          <span className="font-medium">{sampleTimeZones.find(stz => stz.id === ct.timeZone)?.name || ct.timeZone}:</span> {ct.time}
                      </li>
                  ))}
              </ul>
          </div>
      )}
    </div>
  );
}
