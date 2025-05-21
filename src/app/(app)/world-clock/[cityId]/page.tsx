
// src/app/(app)/world-clock/[cityId]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { popularCityDetails } from '@/lib/cityData';
import type { CityDetail } from '@/types';
import { formatTime, getTimeInTimezone, getTimezoneOffset, getSeason, getTimeOfDayInfo, getShortTimezoneName } from '@/lib/timeUtils';
import { Home, ArrowLeft } from 'lucide-react';

export default function CityClockPage() {
  const params = useParams();
  const cityIdParam = params.cityId;
  
  const settings = useSettings();
  const { timeFormat, language } = settings;
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const cityDetails: CityDetail | undefined = useMemo(() => {
    if (!cityIdParam || typeof cityIdParam !== 'string') return undefined;
    const decodedCityIana = decodeURIComponent(cityIdParam);
    let detail = popularCityDetails.find(c => c.iana === decodedCityIana);
    
    // Check for local timezone only after mount to ensure window.Intl is available
    if (mounted && !detail && typeof window !== 'undefined' && decodedCityIana === Intl.DateTimeFormat().resolvedOptions().timeZone) {
        const localName = popularCityDetails.find(c => c.iana === decodedCityIana)?.name || 'Local Time';
        detail = {
            iana: decodedCityIana,
            name: localName,
            description: "This is your current local time zone.",
            hemisphere: 'Northern', 
        };
    }
    return detail;
  }, [cityIdParam, mounted]);

  useEffect(() => {
    setMounted(true);
    const timerId = setInterval(() => setClientNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Set initial clientNow after mount to ensure consistency
    if (mounted && !clientNow) {
        setClientNow(new Date());
    }
  }, [mounted, clientNow]);


  if (!mounted) {
    return <div className="p-4 md:p-6 text-center">Loading city details...</div>;
  }

  if (!cityDetails || !clientNow) {
    if (!cityDetails && cityIdParam && typeof cityIdParam === 'string') { // Check if cityIdParam is a string
        console.warn(`City details not found for IANA: ${decodeURIComponent(cityIdParam)}`)
        if (typeof window !== 'undefined' && !cityDetails) { // Already guarded by mounted, but good practice
             notFound(); 
        }
    }
    return <div className="p-4 md:p-6 text-center">Loading city details or city not found...</div>;
  }

  const cityName = cityDetails.displayName || cityDetails.name;
  const currentCityTime = getTimeInTimezone(cityDetails.iana, settings, clientNow);
  const cityDateString = clientNow.toLocaleDateString(language, {
    timeZone: cityDetails.iana,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const season = getSeason(clientNow, cityDetails.hemisphere);
  const timeOfDayMessages = getTimeOfDayInfo(clientNow, cityName, season, language);
  const shortTzName = getShortTimezoneName(cityDetails.iana, clientNow);
  const offsetDisplay = getTimezoneOffset(cityDetails.iana, clientNow);


  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/world-clock"> 
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to World Clocks
          </Link>
        </Button>
         <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Go Home
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl border-primary ring-1 ring-primary/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl">{cityName}</CardTitle>
          <CardDescription className="text-md sm:text-lg">
            {cityDateString}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4 sm:py-6">
          <div className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-primary select-none">
            {currentCityTime}
          </div>
           <div className="text-sm sm:text-md md:text-lg text-muted-foreground select-none mt-2">
            Timezone: {shortTzName} ({offsetDisplay})
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Current time in {cityName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm sm:text-base">
          <p className="text-muted-foreground">
            The current time in {cityName} is {currentCityTime} ({shortTzName}, {offsetDisplay}).
          </p>
          <p>{cityDetails.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">What time is it in {cityName} right now?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm sm:text-base">
          <p>{timeOfDayMessages.paragraph1}</p>
          <p>{timeOfDayMessages.paragraph2}</p>
        </CardContent>
      </Card>
    </div>
  );
}
