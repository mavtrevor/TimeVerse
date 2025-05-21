
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { EventCountdown } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit3, CalendarClock, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { shortcutEvents } from '@/lib/countdownData'; 
import { Separator } from '@/components/ui/separator';
// useAuth, Firestore imports removed

const INITIAL_COUNTDOWNS: EventCountdown[] = [];

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

function calculateTimeRemaining(targetDate: string): TimeRemaining {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  const totalSeconds = Math.floor(difference / 1000);

  return { days, hours, minutes, seconds, totalSeconds };
}

export default function CountdownFeature() {
  const [countdowns, setCountdowns] = useLocalStorage<EventCountdown[]>('timeverse-countdowns', INITIAL_COUNTDOWNS); // Key updated
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<EventCountdown | null>(null);
  const { toast } = useToast();
  const [now, setNow] = useState(new Date()); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

 // Removed effect to load from Firestore, only local storage is used now.

 const handleSaveCountdown = async (countdownData: Omit<EventCountdown, 'id'>) => {
    if (editingCountdown) {
      setCountdowns(countdowns.map(c => c.id === editingCountdown.id ? { ...editingCountdown, ...countdownData } : c));
      toast({ title: "Countdown Updated", description: `Countdown "${countdownData.name}" has been updated.` });
    } else {
      const newCountdown: EventCountdown = { ...countdownData, id: Date.now().toString() };
      setCountdowns([...countdowns, newCountdown]);
      toast({ title: "Countdown Added", description: `Countdown "${countdownData.name}" has been set.` });
    }
    setEditingCountdown(null);
    setIsFormOpen(false);
  };

  const handleDeleteCountdown = (id: string) => {
    const countdownToDelete = countdowns.find(c => c.id === id);
    if (countdownToDelete) {
      toast({ title: "Countdown Deleted", description: `Countdown "${countdownToDelete.name}" deleted.`, variant: "destructive" });
    }
    setCountdowns(countdowns.filter(c => c.id !== id));
  };
  
  const openEditForm = (countdown: EventCountdown) => {
    setEditingCountdown(countdown);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingCountdown(null);
    setIsFormOpen(true);
  };
  
  const renderCountdownList = () => {
    const sortedCountdowns = [...countdowns].sort((a, b) => {
        const aRemaining = calculateTimeRemaining(a.date).totalSeconds;
        const bRemaining = calculateTimeRemaining(b.date).totalSeconds;
        if (aRemaining === 0 && bRemaining > 0) return 1; 
        if (bRemaining === 0 && aRemaining > 0) return -1;
        if (aRemaining === 0 && bRemaining === 0) return new Date(a.date).getTime() - new Date(b.date).getTime(); 
        return aRemaining - bRemaining; 
    });

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedCountdowns.map(countdown => {
          const remaining = calculateTimeRemaining(countdown.date);
          const isFinished = remaining.totalSeconds <= 0;
          const targetDate = new Date(countdown.date);

          return (
            <Card key={countdown.id} className={`shadow-xl flex flex-col ${isFinished ? 'opacity-70 bg-muted/50' : 'ring-1 ring-primary/30'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
                    {countdown.emoji && <span className="text-xl sm:text-2xl mr-2 sm:mr-3">{countdown.emoji}</span>}
                    <span className="truncate" title={countdown.name}>{countdown.name}</span>
                  </CardTitle>
                   {!isFinished && (
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(countdown)} className="text-muted-foreground hover:text-primary -mr-2 -mt-1">
                        <Edit3 className="h-4 w-4" />
                    </Button>
                   )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground pt-1">
                  {format(targetDate, "PPPPp")}
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center text-center py-3 sm:py-4">
                {isFinished ? (
                  <div className="text-destructive text-lg sm:text-xl md:text-2xl font-bold">EVENT REACHED!</div>
                ) : (
                  <div className="grid grid-cols-4 gap-x-1 sm:gap-x-2 text-center w-full max-w-xs mx-auto">
                    <div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{String(remaining.days).padStart(2, '0')}</div>
                      <div className="text-xs text-muted-foreground">DAYS</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{String(remaining.hours).padStart(2, '0')}</div>
                      <div className="text-xs text-muted-foreground">HOURS</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{String(remaining.minutes).padStart(2, '0')}</div>
                      <div className="text-xs text-muted-foreground">MINS</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{String(remaining.seconds).padStart(2, '0')}</div>
                      <div className="text-xs text-muted-foreground">SECS</div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-3 sm:p-4 border-t">
                <Button variant="outline" size="sm" onClick={() => handleDeleteCountdown(countdown.id)} className="w-full text-destructive hover:border-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Countdown
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCustomCountdownsContainer = () => {
    if (!mounted) {
        return <p className="text-muted-foreground py-10 text-center">Loading countdowns...</p>;
    }
    if (countdowns.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          You have no custom countdowns set. Click "Add Custom Countdown" to create one.
        </p>
      );
    }
    return renderCountdownList();
  };

  if (!mounted) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-muted-foreground py-10">Loading Countdowns...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Your Custom Countdowns</h2>
        <Button onClick={openAddForm} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Countdown
        </Button>
      </div>
      
      <CountdownFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCountdown(null);
        }}
        onSave={handleSaveCountdown}
        countdown={editingCountdown}
      />
      
      <Card className="shadow-lg mt-0">
        <CardContent className="pt-6">
          {renderCustomCountdownsContainer()}
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Event Shortcuts</CardTitle>
          <CardDescription>Quickly navigate to a countdown for these common events.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {shortcutEvents.map(event => (
            <Button key={event.id} variant="outline" asChild className={`h-auto py-3 flex-col items-center justify-center text-center ${
              event.color === 'blue' ? 'border-blue-500' :
              event.color === 'green' ? 'border-green-500' :
              event.color === 'purple' ? 'border-purple-500' : 'border-gray-200'
            }`}>
              <Link href={`/countdown/${event.id}`}>
                {event.defaultEmoji && <span className="text-2xl mb-1">{event.defaultEmoji}</span>}
                <span className="text-xs sm:text-sm">{event.name}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">TimeVerse Countdown Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            TimeVerse Countdown Timer helps you stay on top of life’s biggest moments—whether it's a birthday, wedding, vacation, or due date. Create customized countdowns for any event and track the days, hours, and seconds leading up to it on any device.
          </p>
          <p>
            Add unlimited countdowns with personalized names, icons, and colors. Get reminders, share events with friends, and access everything from our fast, mobile-friendly PWA app. With TimeVerse, every milestone is just a tap away.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface CountdownFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (countdownData: Omit<EventCountdown, 'id'>) => void;
  countdown: EventCountdown | null;
}

function CountdownFormDialog({ isOpen, onOpenChange, onSave, countdown }: CountdownFormDialogProps) {
  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [emoji, setEmoji] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (countdown) {
        setName(countdown.name);
        const localDate = new Date(countdown.date);
        const tzOffset = localDate.getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(localDate.getTime() - tzOffset)).toISOString().slice(0,16);
        setDateTime(localISOTime);
        setEmoji(countdown.emoji || '');
      } else {
        setName('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9,0,0,0);
        const tzOffset = tomorrow.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(tomorrow.getTime() - tzOffset)).toISOString().slice(0,16);
        setDateTime(localISOTime);
        setEmoji('');
      }
    }
  }, [countdown, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        toast({ title: "Name Required", description: "Please enter a name for the countdown.", variant: "destructive"});
        return;
    }
    if (!dateTime) {
        toast({ title: "Date Required", description: "Please select a date and time for the countdown.", variant: "destructive"});
        return;
    }
    
    const targetDate = new Date(dateTime); 
    if (targetDate.getTime() <= new Date().getTime()) {
        toast({ title: "Invalid Date", description: "Countdown date must be in the future.", variant: "destructive"});
        return;
    }

    onSave({ name, date: targetDate.toISOString(), emoji }); // userId removed
    onOpenChange(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{countdown ? 'Edit Countdown' : 'Add Custom Countdown'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="countdownName">Event Name</Label>
            <Input id="countdownName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Birthday Party" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="countdownDateTime">Date and Time</Label>
            <Input id="countdownDateTime" type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="countdownEmoji">Emoji (Optional)</Label>
            <Input id="countdownEmoji" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="e.g., 🎉" maxLength={2} className="mt-1" />
             <p className="text-xs text-muted-foreground mt-1">Enter a single emoji character.</p>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{countdown ? 'Save Changes' : 'Add Countdown'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
