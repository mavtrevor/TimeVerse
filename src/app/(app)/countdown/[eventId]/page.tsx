
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shortcutEvents } from '@/lib/countdownData';
import type { ShortcutCountdownEvent } from '@/types';
import { Home, ArrowLeft, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
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

export default function ShortcutCountdownPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.eventId as string;

  const [eventDetails, setEventDetails] = useState<ShortcutCountdownEvent | null>(null);
  const [targetDateTime, setTargetDateTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const foundEvent = shortcutEvents.find(e => e.id === eventId);
    if (foundEvent) {
      setEventDetails(foundEvent);
      const calculatedTargetDate = foundEvent.targetDateLogic();
      setTargetDateTime(calculatedTargetDate);
    } else {
      // Handle not found event, perhaps redirect or show a specific UI
      // For now, it will fall through to the loading/not found check below
    }
  }, [eventId]);

  useEffect(() => {
    if (!targetDateTime || !mounted) return;

    const intervalId = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetDateTime));
    }, 1000);

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining(targetDateTime));

    return () => clearInterval(intervalId);
  }, [targetDateTime, mounted]);

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
    // For pre-defined shortcuts, "Stop" might mean navigate away or remove from a temporary "active" list.
    // For this version, let's navigate back to the main countdowns page.
    router.push('/countdown');
  };


  if (!mounted) {
    return <div className="p-4 md:p-6 text-center">Loading countdown...</div>;
  }

  if (!eventDetails || !targetDateTime) {
    // This state can be brief if eventId is invalid, then useEffect sets eventDetails to null
     // Or if targetDateLogic is slow (shouldn't be)
    if (mounted) { // Only call notFound on client after attempting to find event
        notFound();
    }
    return <div className="p-4 md:p-6 text-center">Countdown not found or loading...</div>;
  }
  
  if (!timeRemaining) {
    return <div className="p-4 md:p-6 text-center">Calculating time...</div>;
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 sm:p-6 bg-background text-foreground">
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
      </div>
    </div>
  );
}

// Note: The "Public Holidays" section from the example image is not included here
// as its relevance to a generic countdown page is unclear and would require
// additional data fetching logic for holidays based on the countdown's date/year.
// If specific holiday context is needed, it would be a further enhancement.
