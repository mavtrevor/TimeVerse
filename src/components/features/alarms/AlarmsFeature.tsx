
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Alarm } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { formatTime, parseTimeString } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const defaultAlarmSound = "default_alarm";
const alarmSounds = [
  { id: "default_alarm", name: "Default Alarm" },
  { id: "classic_bell", name: "Classic Bell" },
  { id: "digital_beep", name: "Digital Beep" },
  { id: "gentle_wake", name: "Gentle Wake" },
  { id: "birds_alarm", name: "Birds Alarm" },
];

// Fallback beep function if main audio fails or Audio API not present
const playFallbackBeep = () => {
  try {
    if (typeof window.AudioContext === "undefined" && typeof (window as any).webkitAudioContext === "undefined") {
      console.error("AudioContext not available for fallback beep.");
      return;
    }
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) {
      console.error("AudioContext could not be initialized for fallback beep.");
      return;
    }
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Lower volume for fallback
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5); // Shorter beep
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error("Fallback beep playback failed", e);
  }
};

const playAlarmSound = (soundId: string) => {
  console.log(`Attempting to play sound: /sounds/${soundId}.mp3`);
  if (typeof Audio !== "undefined") {
    try {
      const audio = new Audio(`/sounds/${soundId}.mp3`);
      audio.play().catch(error => {
        console.error(`Error playing sound ${soundId}.mp3:`, error);
        playFallbackBeep();
      });
    } catch (e) {
      console.error("Audio object creation failed or other error:", e);
      playFallbackBeep();
    }
  } else {
    console.warn("Audio API not available. Falling back to beep.");
    playFallbackBeep();
  }
};


const INITIAL_ALARMS: Alarm[] = [];

export default function AlarmsFeature() {
  const [alarms, setAlarms] = useLocalStorage<Alarm[]>('chronozen-alarms', INITIAL_ALARMS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const { timeFormat } = useSettings();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const showNotification = useCallback((alarm: Alarm) => {
    const notificationBody = alarm.label || "Your alarm is ringing!";
    const notificationOptions = {
      body: notificationBody,
      icon: "/logo.png", // Ensure logo.png is in public folder
    };

    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification. " + notificationBody);
      playAlarmSound(alarm.sound);
    } else if (Notification.permission === "granted") {
      new Notification("ChronoZen Alarm", notificationOptions);
      playAlarmSound(alarm.sound);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("ChronoZen Alarm", notificationOptions);
          playAlarmSound(alarm.sound);
        } else {
          alert("Notification permission denied. " + notificationBody);
          playAlarmSound(alarm.sound); // Play sound even if notification is denied by user
        }
      });
    } else { // Permission denied
        alert("Notification permission was denied. " + notificationBody);
        playAlarmSound(alarm.sound);
    }
  }, []);
  
  useEffect(() => {
    alarms.forEach(alarm => {
      if (alarm.isActive) {
        const alarmTime = parseTimeString(alarm.time);
        const now = currentTime;
        
        const alarmIsToday = (alarm.days && alarm.days.includes(now.getDay())) || (!alarm.days || alarm.days.length === 0);

        if (
          alarmIsToday &&
          alarmTime.getHours() === now.getHours() &&
          alarmTime.getMinutes() === now.getMinutes() &&
          now.getSeconds() === 0 // Trigger on the exact minute
        ) {
          showNotification(alarm);
          toast({
            title: "Alarm Ringing!",
            description: alarm.label || `Alarm set for ${formatTime(alarmTime, timeFormat)} is now ringing.`,
          });
        }
      }
    });
  }, [currentTime, alarms, showNotification, timeFormat, toast]);


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
    const alarmLabel = alarms.find(a => a.id === id)?.label || 'Alarm';
    setAlarms(alarms.filter(a => a.id !== id));
    toast({ title: "Alarm Deleted", description: `Alarm "${alarmLabel}" deleted.`, variant: "destructive" });
  };

  const toggleAlarmActive = (id: string, isActive: boolean) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, isActive } : a));
    const alarmLabel = alarms.find(a => a.id === id)?.label || 'Alarm';
    toast({ title: `Alarm ${isActive ? 'Activated' : 'Deactivated'}`, description: `Alarm "${alarmLabel}" is now ${isActive ? 'active' : 'inactive'}.` });
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
    <div className="space-y-6 p-4 md:p-6">
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
          if (!open) setEditingAlarm(null); // Reset editing alarm when dialog closes
        }}
        onSave={handleSaveAlarm}
        alarm={editingAlarm}
      />

      {alarms.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6 text-center text-muted-foreground">
            You have no alarms set. Click "Add Alarm" to create one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alarms.map(alarm => (
          <Card key={alarm.id} className={`shadow-lg flex flex-col ${!alarm.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl truncate" title={alarm.label || "Alarm"}>{alarm.label || "Alarm"}</CardTitle>
              <Switch
                checked={alarm.isActive}
                onCheckedChange={(checked) => toggleAlarmActive(alarm.id, checked)}
                aria-label={alarm.isActive ? "Deactivate alarm" : "Activate alarm"}
              />
            </CardHeader>
            <CardContent className="flex-grow">
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
            </CardContent>
            <CardFooter className="p-4 border-t flex justify-end gap-2">
               <Button variant="ghost" size="icon" onClick={() => openEditForm(alarm)} aria-label="Edit alarm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAlarm(alarm.id)} aria-label="Delete alarm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
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
      // Reset to defaults for new alarm when dialog opens
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
    onOpenChange(false); // Close dialog on save
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

