
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Flag, Download, Maximize, Minimize } from 'lucide-react';
import { formatDuration } from '@/lib/timeUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';

export default function StopwatchFeature() {
  const [time, setTime] = useState(0); // time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLapTimeRef = useRef<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const startStopwatch = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    const startTime = Date.now() - time;
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 10); // Update every 10ms for smoother display
  }, [isRunning, time]);

  const pauseStopwatch = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRunning(false);
  }, []);

  const resetStopwatch = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    lastLapTimeRef.current = 0;
  }, []);

  const recordLap = useCallback(() => {
    if (!isRunning && time === 0) return; // Don't record lap if stopwatch hasn't started or is reset
    const currentLapTime = time - lastLapTimeRef.current;
    setLaps(prevLaps => [...prevLaps, currentLapTime]);
    lastLapTimeRef.current = time;
  }, [isRunning, time]);
  
  useEffect(() => {
    return () => { // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const exportLaps = () => {
    if (laps.length === 0) {
      toast({ title: "No laps to export", description: "Record some laps first.", variant: "default" });
      return;
    }
    const header = "Lap,Lap Time (ms),Lap Time (formatted),Total Time (ms),Total Time (formatted)\n";
    let cumulativeTime = 0;
    const csvContent = laps.map((lapTime, index) => {
      cumulativeTime += lapTime;
      return `${index + 1},${lapTime},${formatDuration(lapTime / 1000)},${cumulativeTime},${formatDuration(cumulativeTime / 1000)}`;
    }).join("\n");
    
    const fullCsv = header + csvContent;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "stopwatch_laps.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Laps Exported", description: "Laps have been downloaded as CSV." });
    } else {
       toast({ title: "Export Failed", description: "Your browser doesn't support direct download.", variant: "destructive" });
    }
  };
  
  const toggleFullscreen = () => {
    const elem = document.getElementById("stopwatch-card");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  const displayTime = formatDuration(time / 1000);
  const milliseconds = String(time % 1000).padStart(3, '0').slice(0,2); // Display hundredths of a second


  return (
    <div className={`p-4 md:p-6 ${isFullscreen ? 'fixed inset-0 bg-background z-50 flex items-center justify-center' : ''}`}>
      <Card id="stopwatch-card" className={`shadow-lg w-full ${isFullscreen ? 'h-full max-h-screen' : 'max-w-2xl mx-auto'} flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Stopwatch</CardTitle>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground hover:text-primary">
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center py-8">
          <div className={`font-mono text-primary ${isFullscreen ? 'text-8xl sm:text-9xl' : 'text-7xl sm:text-8xl'}`}>
            {displayTime}<span className={` ${isFullscreen ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'} opacity-70`}>.{milliseconds}</span>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <Button onClick={isRunning ? pauseStopwatch : startStopwatch} size="lg" className="w-32">
              {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={resetStopwatch} variant="outline" size="lg" className="w-32">
              <RotateCcw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>
          <div className="flex gap-2">
             <Button onClick={recordLap} variant="secondary" size="lg" disabled={!isRunning && time === 0} className="w-32">
              <Flag className="mr-2 h-5 w-5" /> Lap
            </Button>
             <Button onClick={exportLaps} variant="ghost" size="lg" disabled={laps.length === 0}>
              <Download className="mr-2 h-5 w-5" /> Export
            </Button>
          </div>
        </CardFooter>
        {laps.length > 0 && (
          <ScrollArea className={`px-4 pb-4 ${isFullscreen ? 'max-h-64' : 'max-h-48'} mt-2`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Lap</TableHead>
                  <TableHead>Lap Time</TableHead>
                  <TableHead className="text-right">Total Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laps.slice().reverse().map((lapTime, index) => {
                  const lapNumber = laps.length - index;
                  let cumulativeTime = 0;
                  for(let i = 0; i < lapNumber; i++) {
                    cumulativeTime += laps[i];
                  }
                  return (
                    <TableRow key={lapNumber}>
                      <TableCell>{lapNumber}</TableCell>
                      <TableCell>{formatDuration(lapTime / 1000)}.{String(lapTime % 1000).padStart(3, '0').slice(0,2)}</TableCell>
                      <TableCell className="text-right">{formatDuration(cumulativeTime / 1000)}.{String(cumulativeTime % 1000).padStart(3, '0').slice(0,2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
