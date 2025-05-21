
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase'; 
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
type TimerType = 'focus' | 'short-break' | 'long-break';

const POMODORO_DURATIONS: Record<TimerType, number> = {
  focus: 25 * 60, // 25 minutes in seconds
  'short-break': 5 * 60, // 5 minutes in seconds
  'long-break': 15 * 60, // 15 minutes in seconds
};

const PomodoroFeature: React.FC = () => {
  const [timerType, setTimerType] = useState<TimerType>('focus');
  const [remainingTime, setRemainingTime] = useState(POMODORO_DURATIONS['focus']);
  const [pomodoroCycles, setPomodoroCycles] = useState(0); // Track completed focus sessions before updating Firestore
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setRemainingTime(POMODORO_DURATIONS[timerType]);
    setProgress(100);
    setIsRunning(false); // Stop timer when type changes
  }, [timerType]);

  useEffect(() => {
    if (isRunning && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            
            if (timerType === 'focus') {
              setPomodoroCycles(prev => prev + 1);
              // Automatically switch to short break or long break
              if ((pomodoroCycles + 1) % 4 === 0) { // After 4 focus sessions
                setTimerType('long-break');
              } else {
                setTimerType('short-break');
              }
            } else { // Break ended
              setTimerType('focus'); // Switch back to focus
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, remainingTime, timerType, pomodoroCycles]); // Added pomodoroCycles
  
  useEffect(() => {
    if (user && pomodoroCycles > 0 && timerType === 'focus') { // Update Firestore when a focus cycle is completed and we are about to start a new one or break
      const userStatsRef = doc(db, 'userStats', user.id);
      // Using setDoc with merge to create if not exists, or update.
      setDoc(userStatsRef, { pomodorosCompleted: increment(pomodoroCycles) }, { merge: true })
        .then(() => {
          // console.log(`Pomodoro count updated in Firestore for user ${user.id}`);
        })
        .catch(error => {
          console.error("Error updating pomodoro count in Firestore:", error);
        });
      setPomodoroCycles(0); // Reset cycle count after updating Firestore
    }
  }, [pomodoroCycles, user, timerType]);

  useEffect(() => {
    const totalDuration = POMODORO_DURATIONS[timerType];
    const percentage = (remainingTime / totalDuration) * 100;
    setProgress(percentage);

    // Update document title
    if (isRunning) {
      document.title = `${formatTime(remainingTime)} - ${timerType.charAt(0).toUpperCase() + timerType.slice(1)} - TimeVerse`;
    } else {
      document.title = "Pomodoro Timer - TimeVerse";
    }
  }, [remainingTime, timerType, isRunning]);

  const startTimer = () => {
    if (remainingTime > 0) {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerType('focus');
    setRemainingTime(POMODORO_DURATIONS['focus']);
    setProgress(100);
    setPomodoroCycles(0); // Also reset pomodoro cycle count
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md mx-auto shadow-lg border-primary/30 ring-1 ring-primary/20 p-2 sm:p-4">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Pomodoro Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="flex flex-wrap justify-center gap-2 sm:space-x-2 mb-4">
          <Button
            variant={timerType === 'focus' ? 'default' : 'outline'}
            onClick={() => { setTimerType('focus'); setIsRunning(false); }}
          >
            Focus ({POMODORO_DURATIONS.focus / 60} min)
          </Button>
          <Button
            variant={timerType === 'short-break' ? 'default' : 'outline'}
            onClick={() => { setTimerType('short-break'); setIsRunning(false); }}
          >
            Short Break ({POMODORO_DURATIONS['short-break'] / 60} min)
          </Button>
          <Button
            variant={timerType === 'long-break' ? 'default' : 'outline'}
            onClick={() => { setTimerType('long-break'); setIsRunning(false); }}
          >
            Long Break ({POMODORO_DURATIONS['long-break'] / 60} min)
          </Button>
        </div>

        <div className="text-6xl font-bold text-primary mb-4">
          {formatTime(remainingTime)}
        </div>

        <div className="w-full">
           <Progress value={progress} className="w-full h-2" />
        </div>

        <div className="flex space-x-4">
          {!isRunning ? (
            <Button onClick={startTimer} size="lg" disabled={remainingTime === 0}>
              Start
            </Button>
          ) : (
            <Button onClick={pauseTimer} size="lg" variant="outline">
              Pause
            </Button>
          )}
          <Button onClick={resetTimer} size="lg" variant="destructive">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroFeature;
