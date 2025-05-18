
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Alarm } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, BellRing, AlarmClock } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { formatTime, parseTimeString } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TimeFormat } from '@/types';

const defaultAlarmSound = "default_alarm";
const alarmSounds = [
  { id: "default_alarm", name: "Default Alarm" },
  { id: "classic_bell", name: "Classic Bell" },
  { id: "digital_beep", name: "Digital Beep" },
  { id: "gentle_wake", name: "Gentle Wake" },
  { id: "birds_alarm", name: "Birds Alarm" },
];

const playFallbackBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error("AudioContext not available for fallback beep.");
      return;
    }
    const audioContext = new AudioContext();
    if (!audioContext) {
      console.error("AudioContext could not be initialized for fallback beep.");
      return;
    }
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error("Fallback beep playback failed", e);
  }
};

const playAlarmSound = (soundId: string, audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
  console.log(`Attempting to play sound: /sounds/${soundId}.mp3`);
  if (typeof Audio !== "undefined") {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = `/sounds/${soundId}.mp3`;
      audioRef.current.loop = true; // Loop the sound until dismissed
      audioRef.current.play().catch(error => {
        console.error(`Error playing sound ${soundId}.mp3:`, error);
        playFallbackBeep();
      });
    } catch (e) {
      console.error("Audio object creation or playback failed:", e);
      playFallbackBeep();
    }
  } else {
    console.warn("Audio API not available. Falling back to beep.");
    playFallbackBeep();
  }
};

const stopAlarmSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0; // Reset for next play
    audioRef.current.loop = false;
  }
};

const isRecurringAlarm = (alarm: Alarm): boolean => {
  return !!(alarm.days && alarm.days.length > 0);
};

// Helper function for desktop notifications
const triggerDesktopNotification = (alarm: Alarm) => {
  const notificationBody = alarm.label || "Your alarm is ringing!";
  const notificationOptions = {
    body: notificationBody,
    icon: "/logo.png",
  };

  if (!("Notification" in window)) {
    console.warn("Desktop notification not supported.");
  } else if (Notification.permission === "granted") {
    new Notification("ChronoZen Alarm", notificationOptions);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("ChronoZen Alarm", notificationOptions);
      }
    });
  }
};


const INITIAL_ALARMS: Alarm[] = [];

export default function AlarmsFeature() {
  const [alarms, setAlarms] = useLocalStorage<Alarm[]>('chronozen-alarms', INITIAL_ALARMS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const { timeFormat, language } = useSettings();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [ringingAlarmModal, setRingingAlarmModal] = useState<Alarm | null>(null);


  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
      stopAlarmSound(audioRef); // Stop sound on component unmount
    };
  }, []);
  
  useEffect(() => {
    if (!currentTime) return;

    alarms.forEach(alarm => {
      if (alarm.isActive && ringingAlarmId !== alarm.id) { // Check if not already marked as ringing
        const alarmTime = parseTimeString(alarm.time);
        const now = currentTime;
        
        const alarmIsToday = (alarm.days && alarm.days.includes(now.getDay())) || (!alarm.days || alarm.days.length === 0);

        if (
          alarmIsToday &&
          alarmTime.getHours() === now.getHours() &&
          alarmTime.getMinutes() === now.getMinutes() &&
          now.getSeconds() === 0 
        ) {
          playAlarmSound(alarm.sound, audioRef);
          triggerDesktopNotification(alarm);
          toast({
            title: "Alarm Ringing!",
            description: alarm.label || `Alarm set for ${formatTime(alarmTime, timeFormat)} is now ringing.`,
            duration: 10000, // Keep toast longer
          });
          setRingingAlarmId(alarm.id);
          setRingingAlarmModal(alarm);
        }
      }
    });
  }, [currentTime, alarms, timeFormat, toast, ringingAlarmId]);


  const handleSaveAlarm = (alarmData: Omit<Alarm, 'id' | 'isActive'>) => {
    if (editingAlarm) {
      setAlarms(alarms.map(a => a.id === editingAlarm.id ? { ...editingAlarm, ...alarmData } : a));
      toast({ title: "Alarm Updated", description: `Alarm "${alarmData.label || 'Alarm'}" has been updated.` });
    } else {
      const newAlarm: Alarm = { ...alarmData, id: Date.now().toString(), isActive: true };
      setAlarms([...alarms, newAlarm]);
      toast({ title: "Alarm Added", description: `Alarm "${alarmData.label || 'Alarm'}" has been set.` });
    }
    setEditingAlarm(null);
    setIsFormOpen(false);
  };

  const handleDeleteAlarm = (id: string) => {
    const alarmToDelete = alarms.find(a => a.id === id);
    if (alarmToDelete) {
      if (ringingAlarmId === id) {
        stopAlarmSound(audioRef);
        setRingingAlarmId(null);
        setRingingAlarmModal(null);
      }
      toast({ title: "Alarm Deleted", description: `Alarm "${alarmToDelete.label || 'Alarm'}" deleted.`, variant: "destructive" });
    }
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const toggleAlarmActive = (id: string, isActive: boolean) => {
    const alarmToToggle = alarms.find(a => a.id === id);
    if (alarmToToggle) {
      if (!isActive && ringingAlarmId === id) { // If deactivating a ringing alarm
        stopAlarmSound(audioRef);
        setRingingAlarmId(null);
        setRingingAlarmModal(null);
      }
      setAlarms(alarms.map(a => a.id === id ? { ...a, isActive } : a));
      toast({ title: `Alarm ${isActive ? 'Activated' : 'Deactivated'}`, description: `Alarm "${alarmToToggle.label || 'Alarm'}" is now ${isActive ? 'active' : 'inactive'}.` });
    }
  };

  const handleDismissModalAndDeactivateIfNotRecurring = (alarmToDismiss: Alarm) => {
    stopAlarmSound(audioRef);
    setRingingAlarmModal(null); // Close modal first
    setRingingAlarmId(null);    // Reset card UI

    if (!isRecurringAlarm(alarmToDismiss) && alarmToDismiss.isActive) {
      // Deactivate non-recurring alarm
      setAlarms(prevAlarms => prevAlarms.map(a => 
        a.id === alarmToDismiss.id ? { ...a, isActive: false } : a
      ));
      toast({ title: "Alarm Dismissed", description: `Alarm "${alarmToDismiss.label || 'Alarm'}" has been dismissed and deactivated.` });
    } else {
      toast({ title: "Alarm Dismissed", description: `Alarm "${alarmToDismiss.label || 'Alarm'}" has been dismissed.` });
    }
  };


  const openEditForm = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setIsFormOpen(true);
  };
  
  const openAddForm = () => {
    setEditingAlarm(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-8">
      <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
        <div className="font-mono text-7xl md:text-8xl lg:text-9xl font-bold text-primary select-none">
          {currentTime ? formatTime(currentTime, timeFormat) : "00:00:00"}
        </div>
        <div className="text-lg md:text-xl lg:text-2xl text-muted-foreground select-none mt-2">
          {currentTime ? currentTime.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Loading date..."}
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Alarms</h2>
          <Button onClick={openAddForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Alarm
          </Button>
        </div>

        <AlarmFormDialog
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingAlarm(null); 
          }}
          onSave={handleSaveAlarm}
          alarm={editingAlarm}
        />

        <RingingAlarmDialog
          alarm={ringingAlarmModal}
          onDismiss={handleDismissModalAndDeactivateIfNotRecurring}
          timeFormat={timeFormat}
        />

        {alarms.length === 0 && (
          <Card className="shadow-lg mt-4">
            <CardContent className="pt-6 text-center text-muted-foreground">
              You have no alarms set. Click "Add Alarm" to create one.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {alarms.map(alarm => {
            const isRinging = ringingAlarmId === alarm.id;
            return (
            <Card key={alarm.id} className={`shadow-lg flex flex-col ${!alarm.isActive && !isRinging ? 'opacity-60' : ''} ${isRinging ? 'border-destructive ring-2 ring-destructive' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl truncate" title={alarm.label || "Alarm"}>{alarm.label || "Alarm"}</CardTitle>
                {!isRinging && (
                  <Switch
                    checked={alarm.isActive}
                    onCheckedChange={(checked) => toggleAlarmActive(alarm.id, checked)}
                    aria-label={alarm.isActive ? "Deactivate alarm" : "Activate alarm"}
                  />
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {isRinging ? (
                  <div className="text-center py-4">
                    <BellRing className="h-12 w-12 text-destructive mx-auto mb-2 animate-pulse" />
                    <p className="text-2xl font-bold text-destructive">RINGING!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-primary">
                      {formatTime(parseTimeString(alarm.time), timeFormat)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sound: {alarmSounds.find(s => s.id === alarm.sound)?.name || 'Default'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Snooze: {alarm.snoozeEnabled ? `${alarm.snoozeDuration} min` : 'Off'}
                    </p>
                    {alarm.days && alarm.days.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Repeats: {alarm.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-end gap-2">
                {isRinging ? (
                  <Button variant="destructive" onClick={() => handleDismissModalAndDeactivateIfNotRecurring(alarm)} className="w-full">
                    Dismiss
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(alarm)} aria-label="Edit alarm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAlarm(alarm.id)} aria-label="Delete alarm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          )})}
        </div>
      </div>
    </div>
  );
}

interface AlarmFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (alarmData: Omit<Alarm, 'id' | 'isActive'>) => void;
  alarm: Alarm | null;
}

function AlarmFormDialog({ isOpen, onOpenChange, onSave, alarm }: AlarmFormDialogProps) {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [sound, setSound] = useState(defaultAlarmSound);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [days, setDays] = useState<number[]>([]);


  useEffect(() => {
    if (isOpen && alarm) {
      setTime(alarm.time);
      setLabel(alarm.label);
      setSound(alarm.sound);
      setSnoozeEnabled(alarm.snoozeEnabled);
      setSnoozeDuration(alarm.snoozeDuration);
      setDays(alarm.days || []);
    } else if (isOpen && !alarm) {
      setTime('07:00');
      setLabel('');
      setSound(defaultAlarmSound);
      setSnoozeEnabled(true);
      setSnoozeDuration(5);
      setDays([]);
    }
  }, [alarm, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ time, label, sound, snoozeEnabled, snoozeDuration, days });
    onOpenChange(false); 
  };

  const toggleDay = (dayIndex: number) => {
    setDays(prevDays => 
      prevDays.includes(dayIndex) 
        ? prevDays.filter(d => d !== dayIndex) 
        : [...prevDays, dayIndex].sort((a,b) => a-b)
    );
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{alarm ? 'Edit Alarm' : 'Add Alarm'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="time">Time</Label>
            <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} required className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="label">Label (Optional)</Label>
            <Input id="label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g., Wake up" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="sound">Sound</Label>
            <Select value={sound} onValueChange={setSound}>
              <SelectTrigger id="sound" className="mt-1">
                <SelectValue placeholder="Select sound" />
              </SelectTrigger>
              <SelectContent>
                {alarmSounds.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Repeat (Optional)</Label>
            <div className="flex space-x-1 mt-1">
              {dayLabels.map((dayLabel, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={days.includes(index) ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => toggleDay(index)}
                >
                  {dayLabel}
                </Button>
              ))}
            </div>
             <p className="text-xs text-muted-foreground mt-1">
              {days.length === 0 ? "Once" : (days.length === 7 ? "Every day" : days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', '))}
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="snoozeEnabled" checked={snoozeEnabled} onCheckedChange={setSnoozeEnabled} />
            <Label htmlFor="snoozeEnabled" className="cursor-pointer">Enable Snooze</Label>
          </div>
          {snoozeEnabled && (
            <div>
              <Label htmlFor="snoozeDuration">Snooze Duration (minutes)</Label>
              <Input id="snoozeDuration" type="number" value={snoozeDuration} onChange={e => setSnoozeDuration(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="mt-1"/>
            </div>
          )}
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{alarm ? 'Save Changes' : 'Add Alarm'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RingingAlarmDialogProps {
  alarm: Alarm | null;
  onDismiss: (alarm: Alarm) => void;
  timeFormat: TimeFormat;
}

function RingingAlarmDialog({ alarm, onDismiss, timeFormat }: RingingAlarmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!alarm);
  }, [alarm]);

  const handleDismiss = () => {
    if (alarm) {
      onDismiss(alarm);
    }
    // The isOpen state will be updated by the useEffect when `alarm` becomes null
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && alarm) { // If dialog is closed by 'x' or 'Esc'
      onDismiss(alarm);
    }
  };

  if (!alarm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="bg-destructive text-destructive-foreground p-4 rounded-t-md flex flex-row justify-between items-center">
          <DialogTitle>
            Alarm
          </DialogTitle>
          {/* Default Radix close button is on DialogContent, no need to add another here unless specifically overriding style */}
        </DialogHeader>
        <div className="p-6 flex flex-col items-center space-y-4">
          <AlarmClock className="h-20 w-20 text-destructive animate-pulse" />
          <p className="text-2xl font-semibold text-center">{alarm.label || "Alarm"}</p>
          <p className="text-5xl font-mono">{formatTime(parseTimeString(alarm.time), timeFormat)}</p>
        </div>
        <DialogFooter className="p-4 border-t sm:justify-center">
          <Button onClick={handleDismiss} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto px-8 py-3 text-lg">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


