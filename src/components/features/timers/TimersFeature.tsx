
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Timer } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Play, Pause, RotateCcw, Edit, Trash2, Maximize, Minimize } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDuration, secondsToHMS } from '@/lib/timeUtils';
import { useToast } from '@/hooks/use-toast';

// Placeholder for actual audio playback for timers
const playTimerSound = () => {
  console.log("Playing timer completion sound");
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5 note
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.5);
  } catch (e) {
    console.error("Timer audio playback failed", e);
  }
};

const INITIAL_TIMERS: Timer[] = [];

export default function TimersFeature() {
  const [timers, setTimers] = useLocalStorage<Timer[]>('timeverse-timers', INITIAL_TIMERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
  const [fullscreenTimerId, setFullscreenTimerId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          if (timer.isRunning && !timer.isPaused && timer.remainingTime > 0) {
            const newRemainingTime = timer.remainingTime - 1;
            if (newRemainingTime === 0) {
              // Timer finished
              playTimerSound();
              toast({
                title: "Timer Finished!",
                description: `Timer "${timer.name}" has completed.`,
              });
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("TimeVerse Timer", {
                  body: `Timer "${timer.name}" has finished!`,
                  icon: "/logo.png",
                });
              }
              return { ...timer, remainingTime: 0, isRunning: false };
            }
            return { ...timer, remainingTime: newRemainingTime };
          }
          return timer;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [setTimers, toast]);

  const handleSaveTimer = (timerData: { name: string; duration: number }) => {
    if (editingTimer) {
      setTimers(timers.map(t => t.id === editingTimer.id ? { ...editingTimer, ...timerData, remainingTime: timerData.duration } : t));
      toast({ title: "Timer Updated", description: `Timer "${timerData.name}" updated.` });
    } else {
      const newTimer: Timer = {
        id: Date.now().toString(),
        name: timerData.name,
        duration: timerData.duration,
        remainingTime: timerData.duration,
        isRunning: false,
        isPaused: false,
        createdAt: Date.now(),
      };
      setTimers([...timers, newTimer]);
      toast({ title: "Timer Added", description: `Timer "${timerData.name}" added.` });
    }
    setEditingTimer(null);
    setIsFormOpen(false);
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(timers.filter(t => t.id !== id));
    toast({ title: "Timer Deleted", variant: "destructive" });
  };

  const toggleTimer = (id: string) => {
    setTimers(timers.map(t => {
      if (t.id === id) {
        if (t.isRunning) { // If running, pause it
          return { ...t, isPaused: !t.isPaused };
        } else { // If not running (either fresh or finished), start/restart it
          return { ...t, isRunning: true, isPaused: false, remainingTime: t.remainingTime === 0 ? t.duration : t.remainingTime };
        }
      }
      return t;
    }));
  };
  
  const resetTimer = (id: string) => {
    setTimers(timers.map(t => t.id === id ? { ...t, remainingTime: t.duration, isRunning: false, isPaused: false } : t));
  };

  const openEditForm = (timer: Timer) => {
    setEditingTimer(timer);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingTimer(null);
    setIsFormOpen(true);
  };

  const toggleFullscreen = (id: string) => {
    if (fullscreenTimerId === id) {
      setFullscreenTimerId(null);
      if (document.fullscreenElement) document.exitFullscreen();
    } else {
      setFullscreenTimerId(id);
      const elem = document.getElementById(`timer-card-${id}`);
      if (elem) elem.requestFullscreen().catch(err => console.error("Fullscreen request failed", err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenTimerId(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const FullscreenTimerView = ({ timer }: { timer: Timer }) => (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-4">
      <h2 className="text-4xl font-bold mb-4 text-primary">{timer.name}</h2>
      <p className="text-8xl font-mono mb-8">{formatDuration(timer.remainingTime)}</p>
      <Progress value={(timer.duration - timer.remainingTime) / timer.duration * 100} className="w-3/4 h-6 mb-8" />
      <div className="flex space-x-4">
        <Button onClick={() => toggleTimer(timer.id)} size="lg">
          {timer.isRunning && !timer.isPaused ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
          {timer.isRunning && !timer.isPaused ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={() => resetTimer(timer.id)} variant="outline" size="lg">
          <RotateCcw className="mr-2"/> Reset
        </Button>
        <Button onClick={() => toggleFullscreen(timer.id)} variant="ghost" size="lg">
          <Minimize className="mr-2"/> Exit Fullscreen
        </Button>
      </div>
    </div>
  );

  if (fullscreenTimerId) {
    const timer = timers.find(t => t.id === fullscreenTimerId);
    return timer ? <FullscreenTimerView timer={timer} /> : null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Countdown Timers</h2>
        <Button onClick={openAddForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Timer
        </Button>
      </div>

      <TimerFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTimer}
        timer={editingTimer}
      />

      {timers.length === 0 && (
        <Card className="shadow-lg mt-4">
          <CardContent className="pt-6 text-center text-muted-foreground">
            You have no timers set. Click "Add Timer" to create one.
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg mt-4">
        <CardHeader>
          <CardTitle className="text-xl">⏳ Online Timer</CardTitle>
          <CardDescription>Free Countdown Timer for Any Task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Need a countdown for studying, cooking, or productivity? Use our online timer with no login or download required.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-md">✅ How to Use the Online Timer</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Enter your countdown duration (in minutes and seconds).</li>
              <li>Add an optional label or title (e.g., “Egg Timer”).</li>
              <li>Click Start Timer.</li>
              <li>When the timer ends, a sound will play and a message will display.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-md">⏱ Features</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Clean, intuitive interface</li>
              <li>Optional countdown label</li>
              <li>Works in background tabs</li>
              <li>Built-in alarm sounds</li>
              <li>Responsive on all devices</li>
              <li>Timer auto-pauses if the tab is refreshed or closed</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-md">❓FAQs</h3>
            <div>
              <p className="font-medium">Can I run multiple timers?</p>
              <p className="pl-4">Yes—open multiple tabs and set a different timer in each.</p>
            </div>
            <div>
              <p className="font-medium">What happens when the time is up?</p>
              <p className="pl-4">A sound plays and a message shows on screen.</p>
            </div>
            <div>
              <p className="font-medium">Does the timer work offline?</p>
              <p className="pl-4">Yes, if the page is already loaded.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {timers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {timers.map(timer => (
            <Card key={timer.id} id={`timer-card-${timer.id}`} className="shadow-lg flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex justify-between items-center">
                  {timer.name}
                  <Button variant="ghost" size="icon" onClick={() => toggleFullscreen(timer.id)} className="text-muted-foreground hover:text-primary">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center">
                <p className="text-5xl font-mono font-bold text-primary">
                  {formatDuration(timer.remainingTime)}
                </p>
                <Progress value={(timer.duration - timer.remainingTime) / timer.duration * 100} className="w-full h-3 mt-2" />
              </CardContent>
              <CardFooter className="border-t p-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={() => toggleTimer(timer.id)} size="sm" variant={timer.isRunning && !timer.isPaused ? "outline" : "default"}>
                    {timer.isRunning && !timer.isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span className="ml-1 sr-only sm:not-sr-only">{timer.isRunning && !timer.isPaused ? 'Pause' : (timer.isPaused ? 'Resume' : 'Start')}</span>
                  </Button>
                  <Button onClick={() => resetTimer(timer.id)} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                    <span className="ml-1 sr-only sm:not-sr-only">Reset</span>
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditForm(timer)} aria-label="Edit timer">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTimer(timer.id)} aria-label="Delete timer" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface TimerFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (timerData: { name: string; duration: number }) => void;
  timer: Timer | null;
}

function TimerFormDialog({ isOpen, onOpenChange, onSave, timer }: TimerFormDialogProps) {
  const [name, setName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (timer) {
      setName(timer.name);
      const { h, m, s } = secondsToHMS(timer.duration);
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    } else {
      setName('');
      setHours(0);
      setMinutes(5);
      setSeconds(0);
    }
  }, [timer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      alert("Timer duration must be greater than 0 seconds.");
      return;
    }
    onSave({ name: name || "My Timer", duration: totalSeconds });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{timer ? 'Edit Timer' : 'Add Timer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="timerName">Name (Optional)</Label>
            <Input id="timerName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Pomodoro Break" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" type="number" value={hours} onChange={e => setHours(Math.max(0, parseInt(e.target.value)))} min="0" />
            </div>
            <div>
              <Label htmlFor="minutes">Minutes</Label>
              <Input id="minutes" type="number" value={minutes} onChange={e => setMinutes(Math.max(0, parseInt(e.target.value)))} min="0" max="59" />
            </div>
            <div>
              <Label htmlFor="seconds">Seconds</Label>
              <Input id="seconds" type="number" value={seconds} onChange={e => setSeconds(Math.max(0, parseInt(e.target.value)))} min="0" max="59" />
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{timer ? 'Save Changes' : 'Add Timer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

