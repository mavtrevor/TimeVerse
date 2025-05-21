
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shortcutEvents } from '@/lib/countdownData';
import type { ShortcutCountdownEvent } from '@/types';
import { Home, ArrowLeft, Share2, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Removed Table imports as we are changing the holiday display
import { format, parse } from 'date-fns';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
}

// Holiday type for the local list
interface PublicHoliday {
  id: string; // Added for unique key
  name: string;
  date: string; // format "yyyy-MM-dd"
  description?: string; // Optional description
}


function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isFinished: false };
}

const usPublicHolidays2025: PublicHoliday[] = [
  { id: "nyd2025", name: "New Year's Day", date: "2025-01-01", description: "Celebrates the first day of the Gregorian calendar year." },
  { id: "mlk2025", name: "Martin Luther King Jr. Day", date: "2025-01-20", description: "Honors civil rights leader Martin Luther King Jr." },
  { id: "pres2025", name: "Washington's Birthday", date: "2025-02-17", description: "Honors U.S. presidents (also known as Presidents' Day)." },
  { id: "mem2025", name: "Memorial Day", date: "2025-05-26", description: "Honors military personnel who died in service." },
  { id: "june2025", name: "Juneteenth National Independence Day", date: "2025-06-19", description: "Commemorates the end of slavery in the U.S." },
  { id: "ind2025", name: "Independence Day", date: "2025-07-04", description: "Celebrates the Declaration of Independence." },
  { id: "lab2025", name: "Labor Day", date: "2025-09-01", description: "Celebrates the American labor movement." },
  { id: "col2025", name: "Columbus Day", date: "2025-10-13", description: "Commemorates Christopher Columbus's arrival in the Americas." },
  { id: "vet2025", name: "Veterans Day", date: "2025-11-11", description: "Honors military veterans." },
  { id: "thanks2025", name: "Thanksgiving", date: "2025-11-27", description: "A day of giving thanks for the harvest and preceding year." },
  { id: "xmas2025", name: "Christmas Day", date: "2025-12-25", description: "Celebrates the birth of Jesus Christ." },
];

export default function ShortcutCountdownPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.eventId as string;

  const [eventDetails, setEventDetails] = useState<ShortcutCountdownEvent | null>(null);
  const [targetDateTime, setTargetDateTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [mounted, setMounted] = useState(false);

  const [selectedHoliday, setSelectedHoliday] = useState<PublicHoliday | null>(null);
  const [holidayTimeRemaining, setHolidayTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    setMounted(true);
    const foundEvent = shortcutEvents.find(e => e.id === eventId);
    if (foundEvent) {
      setEventDetails(foundEvent);
      const calculatedTargetDate = foundEvent.targetDateLogic();
      setTargetDateTime(calculatedTargetDate);
    } else {
      // Event not found in shortcuts
    }
  }, [eventId]);

  useEffect(() => {
    if (!targetDateTime || !mounted) return;

    const intervalId = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetDateTime));
    }, 1000);

    setTimeRemaining(calculateTimeRemaining(targetDateTime)); // Initial calculation

    return () => clearInterval(intervalId);
  }, [targetDateTime, mounted]);

  useEffect(() => {
    if (!selectedHoliday || !mounted) {
      setHolidayTimeRemaining(null); // Clear if no holiday selected or not mounted
      return;
    }
    // Parse the holiday date string correctly. Assumes date is yyyy-MM-dd and refers to start of day.
    const holidayTargetDate = parse(selectedHoliday.date, 'yyyy-MM-dd', new Date());
    
    const intervalId = setInterval(() => {
      setHolidayTimeRemaining(calculateTimeRemaining(holidayTargetDate));
    }, 1000);

    setHolidayTimeRemaining(calculateTimeRemaining(holidayTargetDate)); // Initial calculation

    return () => clearInterval(intervalId);
  }, [selectedHoliday, mounted]);


  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Countdown to ${eventDetails?.name}`,
          text: `Check out the countdown to ${eventDetails?.name}!`,
          url: shareUrl,
        });
        toast({ title: "Shared!", description: "Countdown link shared." });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Countdown link copied to clipboard." });
      } else {
        toast({ title: "Share Not Supported", description: "Could not automatically share or copy link.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({ title: "Error Sharing", description: "Something went wrong.", variant: "destructive" });
    }
  };
  
  const handleStop = () => {
    router.push('/countdown');
  };

  const handleHolidaySelect = (holiday: PublicHoliday) => {
    if (selectedHoliday && selectedHoliday.id === holiday.id) {
      setSelectedHoliday(null); // Deselect if clicking the same holiday
    } else {
      setSelectedHoliday(holiday);
    }
  };


  if (!mounted) {
    return <div className="p-4 md:p-6 text-center">Loading countdown...</div>;
  }

  if (!eventDetails || !targetDateTime) {
    if (mounted) {
        notFound();
    }
    return <div className="p-4 md:p-6 text-center">Countdown not found or loading...</div>;
  }
  
  if (!timeRemaining) {
    return <div className="p-4 md:p-6 text-center">Calculating time...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-10rem)] p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
            <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/countdown"> 
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Countdowns
            </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full sm:w-auto">
            <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Go Home
            </Link>
            </Button>
        </div>

        <Card className="w-full shadow-2xl bg-card text-card-foreground border-primary ring-1 ring-primary/30">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {eventDetails.defaultEmoji && <span className="mr-2 sm:mr-3">{eventDetails.defaultEmoji}</span>}
              {eventDetails.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {timeRemaining.isFinished ? (
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-destructive py-8 sm:py-12">
                The event has arrived!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 my-6 sm:my-8 select-none">
                <div className="bg-muted/30 p-3 sm:p-4 md:p-6 rounded-lg shadow">
                  <div className="text-4xl sm:text-5xl md:text-7xl font-mono font-extrabold text-primary">{String(timeRemaining.days).padStart(2, '0')}</div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">DAYS</div>
                </div>
                <div className="bg-muted/30 p-3 sm:p-4 md:p-6 rounded-lg shadow">
                  <div className="text-4xl sm:text-5xl md:text-7xl font-mono font-extrabold text-primary">{String(timeRemaining.hours).padStart(2, '0')}</div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">HOURS</div>
                </div>
                <div className="bg-muted/30 p-3 sm:p-4 md:p-6 rounded-lg shadow">
                  <div className="text-4xl sm:text-5xl md:text-7xl font-mono font-extrabold text-primary">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">MINUTES</div>
                </div>
                <div className="bg-muted/30 p-3 sm:p-4 md:p-6 rounded-lg shadow">
                  <div className="text-4xl sm:text-5xl md:text-7xl font-mono font-extrabold text-primary">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">SECONDS</div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10 justify-center">
              <Button 
                onClick={handleStop}
                variant="destructive" 
                size="lg" 
                className="w-full sm:w-auto sm:px-10 py-3 text-base"
                aria-label="Stop this countdown (goes to countdowns list)"
              >
                Stop
              </Button>
              <Button 
                onClick={handleShare}
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto sm:px-10 py-3 text-base"
                aria-label="Share this countdown"
              >
                <Share2 className="mr-2 h-5 w-5" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Public Holidays 2025 (US)
          </h2>
          <Card className="shadow-md bg-card text-card-foreground">
            <CardContent className="p-4 space-y-2">
              {usPublicHolidays2025.map((holiday) => (
                <div key={holiday.id}>
                  <Button
                    variant={selectedHoliday?.id === holiday.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left py-3 px-4"
                    onClick={() => handleHolidaySelect(holiday)}
                  >
                    <span className="font-medium flex-1">{holiday.name}</span>
                    <span className="text-muted-foreground text-sm">{format(parse(holiday.date, 'yyyy-MM-dd', new Date()), "MMMM d, yyyy")}</span>
                  </Button>
                  {selectedHoliday?.id === holiday.id && holidayTimeRemaining && (
                    <Card className="mt-2 mb-3 bg-muted/20 border-primary/30">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-md sm:text-lg font-semibold text-primary">Countdown to {selectedHoliday.name}</CardTitle>
                         {selectedHoliday.description && (
                           <p className="text-xs text-muted-foreground pt-1">{selectedHoliday.description}</p>
                         )}
                      </CardHeader>
                      <CardContent className="px-4 pb-3 pt-2">
                        {holidayTimeRemaining.isFinished ? (
                          <div className="text-xl sm:text-2xl font-bold text-destructive py-4">
                            This holiday has passed or arrived!
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 text-center select-none">
                            <div>
                              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary">{String(holidayTimeRemaining.days).padStart(2, '0')}</div>
                              <div className="text-xs text-muted-foreground">DAYS</div>
                            </div>
                            <div>
                              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary">{String(holidayTimeRemaining.hours).padStart(2, '0')}</div>
                              <div className="text-xs text-muted-foreground">HOURS</div>
                            </div>
                            <div>
                              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary">{String(holidayTimeRemaining.minutes).padStart(2, '0')}</div>
                              <div className="text-xs text-muted-foreground">MINS</div>
                            </div>
                            <div>
                              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary">{String(holidayTimeRemaining.seconds).padStart(2, '0')}</div>
                              <div className="text-xs text-muted-foreground">SECS</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    