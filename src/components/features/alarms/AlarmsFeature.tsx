
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Alarm } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
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
    icon: "/logo.png", // Assuming you have a logo.png in your public folder
  };

  if (!("Notification" in window)) {
    console.warn("Desktop notification not supported by this browser.");
    return;
  }
  
  if (Notification.permission === "granted") {
    try {
      new Notification("TimeVerse Alarm", notificationOptions);
    } catch (error) {
      console.error("Error creating desktop notification (permission granted):", error);
      // Potentially log that direct constructor failed, and SW might be needed
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        try {
          new Notification("TimeVerse Alarm", notificationOptions);
        } catch (error) {
          console.error("Error creating desktop notification (after permission grant):", error);
        }
      }
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


  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
      stopAlarmSound(audioRef);
    };
  }, []);
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!isActive && (ringingAlarmId === id || (ringingAlarmModal && ringingAlarmModal.id === id))) { 
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

  const handleShortcutClick = (time: string, _label: string) => { // label from shortcut is only for display on button
    setEditingAlarm(null); // Ensure it's 'add' mode
    setShortcutInitialData({ 
      time, 
      label: '', // Pre-fill alarm form label as empty
      sound: defaultAlarmSound, 
      snoozeEnabled: true, 
      snoozeDuration: 5, 
      days: [] 
    });
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-8">
      {/* Digital Clock Display */}
      <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
        <div className="font-mono text-7xl md:text-8xl lg:text-9xl font-bold text-primary select-none">
          {currentTime ? formatTime(currentTime, timeFormat) : "00:00:00"}
        </div>
        <div className="text-lg md:text-xl lg:text-2xl text-muted-foreground select-none mt-2">
          {currentTime ? currentTime.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Loading date..."}
        </div>
      </div>

      {/* Alarm Management Section */}
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
        
        <Card className="shadow-lg mt-4">
          <CardContent className="pt-6">
            {(!mounted || alarms.length === 0) ? (
              <p className="text-center text-muted-foreground">
                { !mounted ? "Loading alarms..." : "You have no alarms set. Click \"Add Alarm\" to create one."}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {alarms.map(alarm => {
                    const isRingingCardUI = ringingAlarmId === alarm.id && !ringingAlarmModal; 
                    const isEffectivelyInactive = !alarm.isActive && !(ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id));

                    return (
                    <Card key={alarm.id} className={`shadow-lg flex flex-col ${isEffectivelyInactive ? 'opacity-60' : ''} ${isRingingCardUI ? 'border-destructive ring-2 ring-destructive' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl truncate" title={alarm.label || "Alarm"}>{alarm.label || "Alarm"}</CardTitle>
                        {!isRingingCardUI && !(ringingAlarmModal && ringingAlarmModal.id === alarm.id) && ( 
                        <Switch
                            checked={alarm.isActive}
                            onCheckedChange={(checked) => toggleAlarmActive(alarm.id, checked)}
                            aria-label={alarm.isActive ? "Deactivate alarm" : "Activate alarm"}
                            disabled={ringingAlarmId === alarm.id || (ringingAlarmModal && ringingAlarmModal.id === alarm.id)} 
                        />
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {isRingingCardUI ? ( 
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
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Set the alarm for the specified time</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alarmShortcuts.map(shortcut => (
              <Button
                key={shortcut.label}
                variant="default" 
                onClick={() => handleShortcutClick(shortcut.time, shortcut.label)}
              >
                {shortcut.label} 
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-4">
          <CardHeader>
            <CardTitle className="text-xl">🔔 Online Alarm Clock</CardTitle>
            <CardDescription>Free | Reliable | No Download Needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Need a simple and reliable online alarm clock? Our web-based alarm clock helps you wake up on time, stay focused, or set reminders—all without downloading anything.
            </p>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-md">✅ How to Set an Online Alarm</h3>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Select the hour and minute you want the alarm to go off.</li>
                <li>Choose from a variety of alarm sounds—loud, soft, or ambient.</li>
                <li>Optionally, add a label (e.g., “Meeting” or “Time to Stretch”).</li>
                <li>Set a snooze duration (optional).</li>
                <li>Click Set Alarm to activate it.</li>
              </ul>
              <p>When your alarm goes off, a message will appear and your selected sound will play.</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-md">🔊 Features</h3>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Multiple alarm sounds</li>
                <li>Optional alarm labels</li>
                <li>Snooze option</li>
                <li>Test alarm before setting</li>
                <li>Auto-save of previous settings</li>
                <li>Works in background tabs</li>
                <li>Responsive on mobile & desktop</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-md">⚠️ Important Notes</h3>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Alarm won’t ring if you close your browser or shut down your device.</li>
                <li>Make sure your volume is on.</li>
                <li>The alarm will work even if you switch tabs or apps.</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-md">❓FAQs</h3>
              <div>
                <p className="font-medium">Can I set multiple alarms?</p>
                <p className="pl-4">Yes—just open multiple tabs and set separate alarms on each.</p>
              </div>
              <div>
                <p className="font-medium">Does it work offline?</p>
                <p className="pl-4">Yes, once loaded, it works offline in most browsers.</p>
              </div>
              <div>
                <p className="font-medium">Will it work if the screen is off?</p>
                <p className="pl-4">Yes, but not in sleep mode or if the device is powered off.</p>
              </div>
            </div>
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
      if (alarm) { // Editing existing alarm
        setTime(alarm.time);
        setLabel(alarm.label);
        setSound(alarm.sound);
        setSnoozeEnabled(alarm.snoozeEnabled);
        setSnoozeDuration(alarm.snoozeDuration);
        setDays(alarm.days || []);
      } else if (initialData) { // New alarm from shortcut
        setTime(initialData.time || '07:00');
        setLabel(initialData.label || ''); // Use pre-filled empty label
        setSound(initialData.sound || defaultAlarmSound);
        setSnoozeEnabled(initialData.snoozeEnabled !== undefined ? initialData.snoozedEnabled : true);
        setSnoozeDuration(initialData.snoozeDuration || 5);
        setDays(initialData.days || []);
      } else { // New alarm from "Add Alarm" button
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
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && alarm) { 
      onDismiss(alarm); 
    }
  };

  if (!alarm) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0" 
        onInteractOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()} 
      >
        <DialogHeader className="bg-destructive text-destructive-foreground p-4 rounded-t-md flex flex-row justify-between items-center">
          <DialogTitle>
            Alarm
          </DialogTitle>
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

    

      