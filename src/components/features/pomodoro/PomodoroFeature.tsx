
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// useAuth and Firestore imports removed

type TimerType = 'focus' | 'short-break' | 'long-break';

const POMODORO_DURATIONS: Record<TimerType, number> = {
  focus: 25 * 60, // 25 minutes in seconds
  'short-break': 5 * 60, // 5 minutes in seconds
  'long-break': 15 * 60, // 15 minutes in seconds
};

const PomodoroFeature: React.FC = () => {
  const [timerType, setTimerType] = useState<TimerType>('focus');
  const [remainingTime, setRemainingTime] = useState(POMODORO_DURATIONS['focus']);
  const [pomodoroCycles, setPomodoroCycles] = useState(0); 
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // user state removed

  useEffect(() => {
    setRemainingTime(POMODORO_DURATIONS[timerType]);
    setProgress(100);
    setIsRunning(false); 
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
              if ((pomodoroCycles + 1) % 4 === 0) { 
                setTimerType('long-break');
              } else {
                setTimerType('short-break');
              }
            } else { 
              setTimerType('focus'); 
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
  }, [isRunning, remainingTime, timerType, pomodoroCycles]); 
  
  // Removed useEffect for Firestore updates

  useEffect(() => {
    const totalDuration = POMODORO_DURATIONS[timerType];
    const percentage = (remainingTime / totalDuration) * 100;
    setProgress(percentage);

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
    setPomodoroCycles(0);
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
