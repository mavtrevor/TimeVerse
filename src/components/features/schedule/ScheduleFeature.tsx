
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduleItem } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, ListChecks } from 'lucide-react';
import { format, parse, isValid } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [];

export default function ScheduleFeature() {
  const [allTasks, setAllTasks] = useLocalStorage<ScheduleItem[]>('timeverse-schedule-items', INITIAL_SCHEDULE_ITEMS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskText, setNewTaskText] = useState('');
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const tasksForSelectedDate = useMemo(() => {
    return allTasks.filter(task => task.date === selectedDateString).sort((a,b) => a.id.localeCompare(b.id));
  }, [allTasks, selectedDateString]);

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      toast({ title: "Task cannot be empty", variant: "destructive" });
      return;
    }
    const newTask: ScheduleItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      date: selectedDateString,
    };
    setAllTasks(prevTasks => [...prevTasks, newTask]);
    setNewTaskText('');
    toast({ title: "Task Added", description: `"${newTask.text}" added to ${format(selectedDate, 'PPP')}.` });
  };

  const handleToggleTask = (taskId: string) => {
    setAllTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = allTasks.find(task => task.id === taskId);
    setAllTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.text}" deleted.`, variant: "destructive" });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      setSelectedDate(date);
    }
  };

  if (!mounted) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p className="text-muted-foreground">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl flex items-center">
            <ListChecks className="mr-3 h-7 w-7 text-primary" /> Daily Schedule Planner
          </CardTitle>
          <CardDescription>Organize your tasks for any day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-lg font-semibold text-primary hidden sm:block">
              Tasks for: {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
          <p className="text-lg font-semibold text-primary sm:hidden text-center mt-2">
            Tasks for: {format(selectedDate, "MMMM d, yyyy")}
          </p>
          
          <Separator />

          <div className="flex gap-2">
            <Input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter a new task..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-grow"
            />
            <Button onClick={handleAddTask} className="shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Tasks for {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks for this day. Add some above!</p>
          ) : (
            <ScrollArea className="h-auto max-h-[400px]">
              <ul className="space-y-3 pr-3">
                {tasksForSelectedDate.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3 flex-grow">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        aria-label={`Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`flex-grow cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {task.text}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                      aria-label={`Delete task "${task.text}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
