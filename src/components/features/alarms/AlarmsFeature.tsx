
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Alarm } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, BellRing, AlarmClock, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { formatTime, parseTimeString } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TimeFormat } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

const defaultAlarmSound = "default_alarm";
const alarmSounds = [
  { id: "default_alarm", name: "Default Alarm" },
  { id: "classic_bell", name: "Classic Bell" },
  { id: "digital_beep", name: "Digital Beep" },
  { id: "gentle_wake", name: "Gentle Wake" },
  { id: "birds_alarm", name: "Birds Alarm" },
];

const alarmShortcuts = [
  { time: '04:00', label: '4:00 AM' }, { time: '04:30', label: '4:30 AM' },
  { time: '05:00', label: '5:00 AM' }, { time: '05:15', label: '5:15 AM' }, { time: '05:30', label: '5:30 AM' }, { time: '05:45', label: '5:45 AM' },
  { time: '06:00', label: '6:00 AM' }, { time: '06:15', label: '6:15 AM' }, { time: '06:30', label: '6:30 AM' }, { time: '06:45', label: '6:45 AM' },
  { time: '07:00', label: '7:00 AM' }, { time: '07:15', label: '7:15 AM' }, { time: '07:30', label: '7:30 AM' }, { time: '07:45', label: '7:45 AM' },
  { time: '08:00', label: '8:00 AM' }, { time: '08:15', label: '8:15 AM' }, { time: '08:30', label: '8:30 AM' }, { time: '08:45', label: '8:45 AM' },
  { time: '09:00', label: '9:00 AM' }, { time: '10:00', label: '10:00 AM' }, { time: '11:00', label: '11:00 AM' }, { time: '12:00', label: '12:00 PM' },
  { time: '13:00', label: '1:00 PM' }, { time: '14:00', label: '2:00 PM' }
];


const playFallbackBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not available for fallback beep.");
      return;
    }
    const audioContext = new AudioContext();
    if (!audioContext) {
      console.warn("AudioContext could not be initialized for fallback beep.");
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
    console.warn("Fallback beep playback failed", e);
  }
};

const playAlarmSound = (soundId: string, audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
  if (typeof Audio !== "undefined") {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = `/sounds/${soundId}.mp3`;
      audioRef.current.loop = true;
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') {
          console.warn(`Play request for '${soundId}' was interrupted (AbortError). This might be normal if the sound was stopped quickly.`);
        } else {
          console.warn(`Error playing sound '${soundId}':`, error);
          playFallbackBeep();
        }
      });
    } catch (e) {
      console.warn("Audio object creation or playback failed:", e);
      playFallbackBeep();
    }
  } else {
    console.warn("Audio API not available. Falling back to beep.");
    playFallbackBeep();
  }
};

const stopAlarmSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
  if (audioRef.current) {
    if (!audioRef.current.paused) {
        audioRef.current.pause();
    }
    audioRef.current.currentTime = 0;
    audioRef.current.src = ""; 
    audioRef.current.loop = false;
  }
};

const isRecurringAlarm = (alarm: Alarm): boolean => {
  return !!(alarm.days && alarm.days.length > 0);
};

const triggerDesktopNotification = (alarm: Alarm) => {
  const notificationBody = alarm.label || "Your alarm is ringing!";
  const notificationOptions = {
    body: notificationBody,
    icon: "/logo.png", // Ensure you have a logo.png in your public folder
  };

  if (!("Notification" in window)) {
    console.warn("Desktop notification not supported by this browser.");
    return;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification("TimeVerse Alarm", notificationOptions);
    } catch (e: any) {
      console.warn(`Failed to create desktop notification (permission granted): ${e.message || e}`);
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission()
      .then((permission) => {
        if (permission === "granted") {
          try {
            new Notification("TimeVerse Alarm", notificationOptions);
          } catch (e: any) {
            console.warn(`Failed to create desktop notification (after permission grant): ${e.message || e}`);
          }
        }
      })
      .catch((err: any) => {
        console.warn(`Error requesting notification permission: ${err.message || err}`);
      });
  }
};


const INITIAL_ALARMS: Alarm[] = [];

export default function AlarmsFeature() {
  const [alarms, setAlarms] = useLocalStorage<Alarm[]>('timeverse-alarms', INITIAL_ALARMS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const { timeFormat, language } = useSettings();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [ringingAlarmModal, setRingingAlarmModal] = useState<Alarm | null>(null);
  const [shortcutInitialData, setShortcutInitialData] = useState<Partial<Omit<Alarm, 'id' | 'isActive'>> | null>(null);
  const [mounted, setMounted] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isMobile = useIsMobile();


  useEffect(() => {
    setMounted(true);
    // Initialize currentTime after mount to ensure client-side Date object
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
      stopAlarmSound(audioRef); 
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, []);

  useEffect(() => {
    const hasActiveAlarms = alarms.some(alarm => alarm.isActive);

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && hasActiveAlarms) {
        try {
          if (!wakeLockRef.current || wakeLockRef.current.released) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            wakeLockRef.current.addEventListener('release', () => {
              // This can happen if visibility changes, or OS revokes it.
              // No need to re-request immediately here; visibility change handles it.
              console.log('Screen Wake Lock was released (e.g., page visibility changed).');
            });
            console.log('Screen Wake Lock acquired.');
          }
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            console.warn(`Screen Wake Lock permission denied or not allowed by policy: ${err.message}. Ensure the 'screen-wake-lock' permissions policy is enabled for this origin if you expect it to work.`);
          } else {
            console.error(`Failed to acquire Screen Wake Lock: ${err.name}, ${err.message}`);
          }
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null; // Important to nullify after release
          console.log('Screen Wake Lock released.');
        } catch (err: any) {
           console.error(`Failed to release Screen Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    };

    if (mounted) { // Only run wake lock logic on client
      if (hasActiveAlarms && document.visibilityState === 'visible') {
        requestWakeLock();
      } else {
        releaseWakeLock(); // Release if no active alarms or page not visible
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && alarms.some(a => a.isActive)) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, [alarms, mounted]);


  useEffect(() => {
    if (!currentTime || !mounted) return;

    alarms.forEach(alarm => {
      if (alarm.isActive && ringingAlarmId !== alarm.id && !ringingAlarmModal) {
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
            duration: 10000, 
          });
          setRingingAlarmId(alarm.id);
          setRingingAlarmModal(alarm);
        }
      }
    });
  }, [currentTime, alarms, timeFormat, toast, ringingAlarmId, mounted, ringingAlarmModal]);


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
    setShortcutInitialData(null);
  };

  const handleDeleteAlarm = (id: string) => {
    const alarmToDelete = alarms.find(a => a.id === id);
    if (alarmToDelete) {
      if (ringingAlarmId === id || (ringingAlarmModal && ringingAlarmModal.id === id)) {
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
      if (!isActive && (ringingAlarmId === id || (ringingAlarmModal && ringingAlarmModal.id === alarmToToggle.id))) {
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
    setRingingAlarmModal(null);
    setRingingAlarmId(null); 

    if (!isRecurringAlarm(alarmToDismiss) && alarmToDismiss.isActive) {
      setAlarms(prevAlarms => prevAlarms.map(a =>
        a.id === alarmToDismiss.id ? { ...a, isActive: false } : a
      ));
      toast({ title: "Alarm Dismissed", description: `Alarm "${alarmToDismiss.label || 'Alarm'}" has been dismissed and deactivated.` });
    } else {
      toast({ title: "Alarm Dismissed", description: `Alarm "${alarmToDismiss.label || 'Alarm'}" has been dismissed.` });
    }
  };


  const openEditForm = (alarm: Alarm) => {
    setShortcutInitialData(null); 
    setEditingAlarm(alarm);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setShortcutInitialData(null); 
    setEditingAlarm(null);
    setIsFormOpen(true);
  };

  const handleShortcutClick = (time: string, label: string) => {
    setEditingAlarm(null); 
    setShortcutInitialData({
      time,
      label: '', 
      sound: defaultAlarmSound,
      snoozeEnabled: true,
      snoozeDuration: 5,
      days: [] 
    });
    setIsFormOpen(true);
  };

  const AlarmsContainer = () => {
    // This check can be simpler now if useLocalStorage initializes with INITIAL_ALARMS
    // and only updates from localStorage after mount.
    // However, for initial "no alarms" message before localStorage read, it's fine.
    if (!mounted && alarms.length === 0) { // Show loading/empty before client-side data load
        return <p className="text-center text-muted-foreground py-10">Loading alarms...</p>;
    }
    if (alarms.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          You have no alarms set. Click "Add Alarm" or a shortcut to create one.
        </p>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alarms.map(alarm => {
            const isRingingCardUI = ringingAlarmId === alarm.id && (!ringingAlarmModal || ringingAlarmModal.id !== alarm.id);
            const isEffectivelyInactive = !alarm.isActive && !(ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id));

            return (
            <Card key={alarm.id} className={`shadow-lg flex flex-col ${isEffectivelyInactive ? 'opacity-60' : ''} ${isRingingCardUI ? 'border-destructive ring-2 ring-destructive' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg sm:text-xl truncate" title={alarm.label || "Alarm"}>{alarm.label || "Alarm"}</CardTitle>
                {!isRingingCardUI && !(ringingAlarmModal && ringingAlarmModal.id === alarm.id) && (
                <Switch
                    checked={alarm.isActive}
                    onCheckedChange={(checked) => toggleAlarmActive(alarm.id, checked)}
                    aria-label={alarm.isActive ? "Deactivate alarm" : "Activate alarm"}
                    disabled={ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id)} 
                />
                )}
            </CardHeader>
            <CardContent className="flex-grow py-2 sm:py-4">
                {isRingingCardUI ? (
                <div className="text-center py-2 sm:py-4">
                    <BellRing className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto mb-2 animate-pulse" />
                    <p className="text-xl sm:text-2xl font-bold text-destructive">RINGING!</p>
                </div>
                ) : (
                <>
                    <p className="text-3xl sm:text-4xl font-bold text-primary">
                    {formatTime(parseTimeString(alarm.time), timeFormat)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                    Sound: {alarmSounds.find(s => s.id === alarm.sound)?.name || 'Default'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
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
            <CardFooter className="p-3 sm:p-4 border-t flex justify-end gap-2">
                {isRingingCardUI ? (
                <Button variant="destructive" onClick={() => handleDismissModalAndDeactivateIfNotRecurring(alarm)} className="w-full">
                    Dismiss
                </Button>
                ) : (
                <>
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(alarm)} aria-label="Edit alarm" disabled={ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id)}>
                    <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAlarm(alarm.id)} aria-label="Delete alarm" className="text-destructive hover:text-destructive" disabled={ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id)}>
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </>
                )}
            </CardFooter>
            </Card>
        )})}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-6">
      <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
         <div className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-primary select-none">
          {mounted && currentTime ? formatTime(currentTime, timeFormat) : "00:00:00"}
        </div>
        <div className="text-md sm:text-lg md:text-xl text-muted-foreground select-none mt-2">
          {mounted && currentTime ? currentTime.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Loading date..."}
        </div>
      </div>

      <div className="mt-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Alarms</h2>
          <Button onClick={openAddForm} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Alarm
          </Button>
        </div>

        <AlarmFormDialog
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) { 
                setEditingAlarm(null);
                setShortcutInitialData(null);
            }
          }}
          onSave={handleSaveAlarm}
          alarm={editingAlarm}
          initialData={shortcutInitialData} 
        />

        <RingingAlarmDialog
          alarm={ringingAlarmModal}
          onDismiss={handleDismissModalAndDeactivateIfNotRecurring}
          timeFormat={timeFormat}
        />
        
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <AlarmsContainer />
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Set the alarm for the specified time</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alarmShortcuts.map(shortcut => (
              <Button
                key={shortcut.label}
                variant="default"
                size="sm"
                onClick={() => handleShortcutClick(shortcut.time, shortcut.label)}
              >
                {shortcut.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {mounted && isMobile && (
          <Card className="shadow-md border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <CardTitle className="text-md text-amber-700 dark:text-amber-400">Important Note for Mobile Users</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <p>
                For alarms to ring reliably, especially when your phone screen is locked or the browser is in the background, please keep this TimeVerse page open and active in your browser.
              </p>
              <p>
                Mobile operating systems (iOS and Android) often restrict background activity and audio playback from web pages to save battery. While we try to keep the screen awake if an alarm is active and this page is visible, these OS-level restrictions can sometimes prevent alarms from sounding as expected.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">🔔 TimeVerse Online Alarm Clock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              TimeVerse Online Alarm Clock is a free, no-download-needed tool designed to help you wake up, stay on schedule, or set reminders from any device. Simply choose the time, pick an alarm sound, add a label if you like, and hit "Set Alarm." The alarm will ring even if you switch tabs, and your settings are saved for next time.
            </p>
            <p>
              With features like multiple alarm sounds, snooze options, test mode, and mobile responsiveness, TimeVerse makes time management simple and reliable. Just keep your browser open and volume on—your alarm will do the rest!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AlarmFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (alarmData: Omit<Alarm, 'id' | 'isActive'>) => void;
  alarm: Alarm | null;
  initialData?: Partial<Omit<Alarm, 'id' | 'isActive'>> | null; 
}

function AlarmFormDialog({ isOpen, onOpenChange, onSave, alarm, initialData }: AlarmFormDialogProps) {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [sound, setSound] = useState(defaultAlarmSound);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [days, setDays] = useState<number[]>([]); 

  useEffect(() => {
    if (isOpen) {
      if (alarm) { 
        setTime(alarm.time);
        setLabel(alarm.label);
        setSound(alarm.sound);
        setSnoozeEnabled(alarm.snoozeEnabled);
        setSnoozeDuration(alarm.snoozeDuration);
        setDays(alarm.days || []);
      } else if (initialData) { 
        setTime(initialData.time || '07:00');
        setLabel(initialData.label || '');
        setSound(initialData.sound || defaultAlarmSound);
        setSnoozeEnabled(initialData.snoozeEnabled !== undefined ? initialData.snoozeEnabled : true);
        setSnoozeDuration(initialData.snoozeDuration || 5);
        setDays(initialData.days || []);
      } else { 
        // Default for new alarm
        setTime('07:00');
        setLabel('');
        setSound(defaultAlarmSound);
        setSnoozeEnabled(true);
        setSnoozeDuration(5);
        setDays([]);
      }
    }
  }, [alarm, isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ time, label, sound, snoozeEnabled, snoozeDuration, days });
    onOpenChange(false); // Close dialog on save
  };

  const toggleDay = (dayIndex: number) => {
    setDays(prevDays =>
      prevDays.includes(dayIndex)
        ? prevDays.filter(d => d !== dayIndex)
        : [...prevDays, dayIndex].sort((a,b) => a-b) // Keep sorted
    );
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday to Saturday


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{alarm ? 'Edit Alarm' : (initialData ? 'Add Preset Alarm' : 'Add Alarm')}</DialogTitle>
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
                  type="button" // Important: prevent form submission
                  variant={days.includes(index) ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 rounded-full" // Smaller, rounder buttons
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
  };

  // Handle closing dialog via Esc or 'x' button
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && alarm) { // If dialog is closed and there was an alarm
      onDismiss(alarm);
    }
  };

  if (!alarm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing with Esc key initially
      >
        <DialogHeader className="bg-destructive text-destructive-foreground p-4 rounded-t-md flex flex-row justify-between items-center">
          <DialogTitle>
            Alarm {/* Could be dynamic if needed */}
          </DialogTitle>
          {/* No explicit close 'x' button here to force user interaction with 'OK' */}
        </DialogHeader>
        <div className="p-6 flex flex-col items-center space-y-4">
          <AlarmClock className="h-16 w-16 sm:h-20 sm:w-20 text-destructive animate-pulse" />
          <p className="text-xl sm:text-2xl font-semibold text-center">{alarm.label || "Alarm"}</p>
          <p className="text-4xl sm:text-5xl font-mono">{formatTime(parseTimeString(alarm.time), timeFormat)}</p>
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

    
