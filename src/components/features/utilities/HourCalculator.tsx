
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateNewTime, formatTimeForInput, formatTime } from '@/lib/timeUtils';
import { useSettings } from '@/hooks/useSettings';

export default function HourCalculator() {
  const { timeFormat } = useSettings();
  const [initialTime, setInitialTime] = useState(''); // Initialize as empty for SSR
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [resultTime, setResultTime] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInitialTime(formatTimeForInput(new Date())); // Set after mount
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't calculate until mounted and initialTime is set

    try {
      if (!initialTime) { // Handle case where initialTime might still be empty if effect runs too fast
        setResultTime(null);
        return;
      }
      const [h, m] = initialTime.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) {
        setResultTime('Invalid initial time');
        return;
      }
      const baseDate = new Date();
      baseDate.setHours(h, m, 0, 0);

      const newDate = calculateNewTime(baseDate, hours, minutes, operation);
      setResultTime(formatTime(newDate, timeFormat));
    } catch (error) {
      setResultTime('Error in calculation');
      console.error("Error in hour calculation:", error);
    }
  }, [initialTime, hours, minutes, operation, timeFormat, mounted]);

  return (
    <Card className="shadow-md w-full">
      <CardHeader>
        <CardTitle>Hour & Minute Calculator</CardTitle>
        <CardDescription>Add or subtract hours and minutes from a given time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="initialTime">Initial Time</Label>
          <Input
            id="initialTime"
            type="time"
            value={initialTime}
            onChange={e => setInitialTime(e.target.value)}
            disabled={!mounted} // Disable input until mounted
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              value={hours}
              onChange={e => setHours(parseInt(e.target.value, 10) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              value={minutes}
              onChange={e => setMinutes(parseInt(e.target.value, 10) || 0)}
              min="0"
              max="59"
            />
          </div>
        </div>

        <div>
          <Label>Operation</Label>
          <RadioGroup
            defaultValue="add"
            value={operation}
            onValueChange={(value: 'add' | 'subtract') => setOperation(value)}
            className="flex space-x-4 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="addTime" />
              <Label htmlFor="addTime">Add</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="subtract" id="subtractTime" />
              <Label htmlFor="subtractTime">Subtract</Label>
            </div>
          </RadioGroup>
        </div>
        
        {mounted && resultTime && (
          <div className="pt-4 text-center">
            <p className="text-lg font-semibold">
              Result: <span className="text-primary">{resultTime}</span>
            </p>
          </div>
        )}
        {!mounted && (
            <div className="pt-4 text-center">
                <p className="text-lg text-muted-foreground">Calculating...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

