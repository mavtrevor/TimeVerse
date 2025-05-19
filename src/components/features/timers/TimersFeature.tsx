
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Timer } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Play, Pause, RotateCcw, Edit, Trash2, Maximize, Minimize, TimerIcon as TimerIconLucide } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDuration, secondsToHMS } from '@/lib/timeUtils';
import { useToast } from '@/hooks/use-toast';

const playTimerSound = () => {
  console.log("Playing timer completion sound");
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime); 
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

const timerShortcuts = [
  { label: "1 Min", duration: 60 },
  { label: "5 Mins", duration: 300 },
  { label: "10 Mins", duration: 600 },
  { label: "15 Mins", duration: 900 },
  { label: "30 Mins", duration: 1800 },
  { label: "1 Hour", duration: 3600 },
];

export default function TimersFeature() {
  const [timers, setTimers] = useLocalStorage<Timer[]>('timeverse-timers', INITIAL_TIMERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
  const [fullscreenTimerId, setFullscreenTimerId] = useState<string | null>(null);
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState<number | null>(null); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setElapsedTime(0); 
    const intervalId = setInterval(() => {
      setElapsedTime(prevTime => (prevTime !== null ? prevTime + 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    if (!mounted) return; 
    const interval = setInterval(() => {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          if (timer.isRunning && !timer.isPaused && timer.remainingTime > 0) {
            const newRemainingTime = timer.remainingTime - 1;
            if (newRemainingTime === 0) {
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
  }, [setTimers, toast, mounted]);

  const handleSaveTimer = (timerData: { name: string; duration: number }) => {
    if (editingTimer) {
      setTimers(timers.map(t => t.id === editingTimer.id ? { ...editingTimer, ...timerData, remainingTime: timerData.duration, isRunning: false, isPaused: false } : t));
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

  const handleAddTimerFromShortcut = (durationInSeconds: number, baseLabel: string) => {
    const timerName = `${baseLabel.replace(" Mins", " Minute").replace(" Min", " Minute")} Timer`;
    const newTimer: Timer = {
      id: Date.now().toString(),
      name: timerName,
      duration: durationInSeconds,
      remainingTime: durationInSeconds,
      isRunning: true, 
      isPaused: false,
      createdAt: Date.now(),
    };
    setTimers(prevTimers => [...prevTimers, newTimer]);
    toast({ title: "Timer Started", description: `${timerName} has started.` });
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(timers.filter(t => t.id !== id));
    toast({ title: "Timer Deleted", variant: "destructive" });
  };

  const toggleTimer = (id: string) => {
    setTimers(timers.map(t => {
      if (t.id === id) {
        if (t.remainingTime === 0) {
             return { ...t, isRunning: true, isPaused: false, remainingTime: t.duration };
        }
        if (t.isRunning && !t.isPaused) {
          return { ...t, isPaused: true };
        } else if (t.isRunning && t.isPaused) {
             return { ...t, isPaused: false };
        } else {
          return { ...t, isRunning: true, isPaused: false };
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
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary text-center">{timer.name}</h2>
      <p className="text-7xl sm:text-8xl font-mono mb-8">{formatDuration(timer.remainingTime)}</p>
      <Progress value={(timer.duration - timer.remainingTime) / timer.duration * 100} className="w-full max-w-md sm:w-3/4 h-4 sm:h-6 mb-8" />
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full max-w-xs sm:max-w-none">
        <Button onClick={() => toggleTimer(timer.id)} size="lg" className="flex-1">
          {timer.isRunning && !timer.isPaused ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
          {timer.isRunning && !timer.isPaused ? 'Pause' : (timer.isPaused || timer.remainingTime === 0 ? 'Resume' : 'Start')}
        </Button>
        <Button onClick={() => resetTimer(timer.id)} variant="outline" size="lg" className="flex-1">
          <RotateCcw className="mr-2"/> Reset
        </Button>
        <Button onClick={() => toggleFullscreen(timer.id)} variant="ghost" size="lg" className="flex-1">
          <Minimize className="mr-2"/> Exit
        </Button>
      </div>
    </div>
  );

  if (fullscreenTimerId) {
    const timer = timers.find(t => t.id === fullscreenTimerId);
    return timer ? <FullscreenTimerView timer={timer} /> : null;
  }
  
  const renderTimersList = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {timers.map(timer => (
        <Card key={timer.id} id={`timer-card-${timer.id}`} className="shadow-lg flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl flex justify-between items-center">
              <span className="truncate" title={timer.name}>{timer.name}</span>
              <Button variant="ghost" size="icon" onClick={() => toggleFullscreen(timer.id)} className="text-muted-foreground hover:text-primary -mr-2">
                <Maximize className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center py-3 sm:py-4">
            <p className="text-4xl sm:text-5xl font-mono font-bold text-primary">
              {formatDuration(timer.remainingTime)}
            </p>
            <Progress value={(timer.duration - timer.remainingTime) / timer.duration * 100} className="w-full h-2 sm:h-3 mt-2" />
          </CardContent>
          <CardFooter className="border-t p-3 sm:p-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={() => toggleTimer(timer.id)} size="sm" variant={timer.isRunning && !timer.isPaused ? "outline" : "default"}>
                {timer.isRunning && !timer.isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                 <span className="ml-1 sr-only sm:not-sr-only">
                    {timer.remainingTime === 0 ? 'Restart' : (timer.isRunning && !timer.isPaused ? 'Pause' : (timer.isPaused ? 'Resume' : 'Start'))}
                </span>
              </Button>
              <Button onClick={() => resetTimer(timer.id)} variant="outline" size="sm" disabled={timer.remainingTime === timer.duration && !timer.isRunning}>
                <RotateCcw className="h-4 w-4" />
                <span className="ml-1 sr-only sm:not-sr-only">Reset</span>
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEditForm(timer)} aria-label="Edit timer" disabled={timer.isRunning && !timer.isPaused}>
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
  );


  const renderTimersContainer = () => {
    if (!mounted) {
      return <p className="text-center text-muted-foreground py-10">Loading timers...</p>;
    }
    if (timers.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          You have no timers set. Click "Add Timer" or a shortcut to create one.
        </p>
      );
    }
    return renderTimersList();
  };


  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col items-center justify-center text-center py-4">
        <div className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-primary select-none">
          {mounted && elapsedTime !== null ? formatDuration(elapsedTime) : "00:00:00"}
        </div>
        <div className="text-md sm:text-lg md:text-xl text-muted-foreground select-none mt-2">
          Elapsed Time
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Countdown Timers</h2>
        <Button onClick={openAddForm} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Timer
        </Button>
      </div>
      
      <TimerFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingTimer(null);
        }}
        onSave={handleSaveTimer}
        timer={editingTimer}
      />
      
      <Card className="shadow-lg mt-0">
        <CardContent className="pt-6">
          {renderTimersContainer()}
        </CardContent>
      </Card>


      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Set the timer for the specified time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {timerShortcuts.map(shortcut => (
            <Button
              key={shortcut.label}
              variant="default" 
              size="sm"
              onClick={() => handleAddTimerFromShortcut(shortcut.duration, shortcut.label)}
            >
              <TimerIconLucide className="mr-2 h-4 w-4" />
              {shortcut.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-4">
        <CardHeader>
          <CardTitle className="text-xl">⏳ Online Timer</CardTitle>
          <CardDescription>Free Countdown Timer for Any Task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            TimeVerse Online Timer is a simple, free countdown tool perfect for tasks like cooking, studying, or staying focused—no downloads or sign-ups needed. Just set your desired time, add an optional label, and start the timer. When time’s up, you'll hear a sound and see a notification.
          </p>
          <p>
            The timer works seamlessly in background tabs, supports multiple timers via separate tabs, and is fully responsive across devices. Once loaded, it even functions offline, making it a reliable productivity companion wherever you are.
          </p>
        </CardContent>
      </Card>

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
  const { toast } = useToast(); 

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [timer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Timer duration must be greater than 0 seconds.",
        variant: "destructive",
      });
      return;
    }
    onSave({ name: name || "My Timer", duration: totalSeconds });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{timer ? 'Edit Timer' : 'Add Timer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="timerName">Name (Optional)</Label>
            <Input id="timerName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Pomodoro Break" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" type="number" value={hours} onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))} min="0" />
            </div>
            <div>
              <Label htmlFor="minutes">Minutes</Label>
              <Input id="minutes" type="number" value={minutes} onChange={e => setMinutes(Math.max(0, parseInt(e.target.value) || 0))} min="0" max="59" />
            </div>
            <div>
              <Label htmlFor="seconds">Seconds</Label>
              <Input id="seconds" type="number" value={seconds} onChange={e => setSeconds(Math.max(0, parseInt(e.target.value) || 0))} min="0" max="59" />
            </div>
          </div>
          <DialogFooter className="pt-2">
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


