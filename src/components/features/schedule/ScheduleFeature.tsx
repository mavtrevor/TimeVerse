"use client";

import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import type { ScheduleItem, RecurrenceType, TaskDifficulty } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, PlusCircle, Trash2, ListChecks, Pencil, Save, X, Repeat } from 'lucide-react';
import { format, parse, isValid, isSameDay, addDays, startOfWeek } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@radix-ui/react-separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [];

// Helper function to generate recurring task instances for a given date
const generateRecurringTasks = (allTasks: ScheduleItem[], targetDate: Date): ScheduleItem[] => {
  const targetDateString = format(targetDate, 'yyyy-MM-dd');
  const dayOfWeek = targetDate.getDay(); // 0 for Sunday, 6 for Saturday

  const recurringTasks = allTasks.filter(task => {
    if (!task.recurrenceType || !task.date) {
      return false; // Not a recurring task or missing start date
    }

    const startDate = parse(task.date, 'yyyy-MM-dd', new Date());
    if (!isValid(startDate) || startDate > targetDate) {
      return false; // Invalid start date or start date is in the future
    }

    if (task.recurrenceEndDate) {
      const endDate = parse(task.recurrenceEndDate, 'yyyy-MM-dd', new Date());
      if (isValid(endDate) && targetDate > endDate) {
        return false; // Target date is after the end date
      }
    }

    if (task.recurrenceType === 'daily') {
      return true; // Daily tasks appear every day after the start date
    }

    if (task.recurrenceType === 'weekly' && task.recurrenceDays && task.recurrenceDays.includes(dayOfWeek)) {
      // For weekly tasks, check if the target date's day of the week is in the recurrenceDays array
      return true;
    }

    return false;
  });

  // Create unique instances for recurring tasks on the target date
  return recurringTasks.map(task => ({
    ...task,
    id: `${task.id}-${targetDateString}`, // Create a unique ID for the instance
    date: targetDateString,
    completed: false,
    // We don't copy recurrence info to instances, as they refer to the original task
    recurrenceType: undefined, 
    recurrenceDays: undefined,
    recurrenceEndDate: undefined,
  }));
};

export default function ScheduleFeature() {
  const [allTasks, setAllTasks] = useLocalStorage<ScheduleItem[]>('timeverse-schedule-items', INITIAL_SCHEDULE_ITEMS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState<RecurrenceType>('none');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty | undefined>(undefined);

  const [newTaskRecurrenceDays, setNewTaskRecurrenceDays] = useState<number[]>([]);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingTaskTime, setEditingTaskTime] = useState('');
  const [editingTaskNotes, setEditingTaskNotes] = useState('');
  const [editingTaskRecurrenceType, setEditingTaskRecurrenceType] = useState<RecurrenceType>('none');
  const [editingTaskRecurrenceDays, setEditingTaskRecurrenceDays] = useState<number[]>([]);
  const [editingTaskDifficulty, setEditingTaskDifficulty] = useState<TaskDifficulty | undefined>(undefined);


  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const tasksForSelectedDate = useMemo(() => {
    const nonRecurring = allTasks.filter(task => task.date === selectedDateString && !task.recurrenceType);
    const recurringInstances = generateRecurringTasks(allTasks.filter(task => task.recurrenceType), selectedDate); // Generate from actual recurring tasks

    // Simple combination for now - need to refine how recurring instance completions/edits are handled
    // Currently, editing/completing an instance affects the original task, which is incorrect.
    // A more robust solution would involve storing instance-specific data.

    // For this UI/UX improvement, we'll just display them together. 
    // We still have the issue where checking an instance marks the original task.
    // This needs a more complex data structure (e.g., a separate list of completed recurring instances).

    return [...nonRecurring, ...recurringInstances].sort((a, b) => {
      // Sort by time first, then by text if time is the same or missing
      const timeA = a.time || '';
      const timeB = b.time || '';
      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      } else if (timeA) {
        return -1; // Tasks with time come first
      } else if (timeB) {
        return 1; // Tasks with time come first
      }
      return a.text.localeCompare(b.text); // Sort by text if no time
    });
  }, [allTasks, selectedDateString, selectedDate]);

  const completedTasksCount = tasksForSelectedDate.filter(task => task.completed).length;
  const totalTasksCount = tasksForSelectedDate.length;
  const completionPercentage = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      toast({ title: "Task cannot be empty", variant: "destructive" });
      return;
    }

    if (newTaskTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTaskTime)) {
       toast({ title: "Invalid Time Format", description: "Please use HH:mm format (e.g., 09:00)", variant: "destructive" });
       return;
    }

    if (newTaskRecurrenceType === 'weekly' && newTaskRecurrenceDays.length === 0) {
       toast({ title: "Select Days", description: "Please select at least one day for weekly recurrence.", variant: "destructive" });
       return;
    }

    const newTask: ScheduleItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      date: selectedDateString, // For recurring tasks, this is the start date
      time: newTaskTime || undefined,
      notes: newTaskNotes.trim() || undefined,
      recurrenceType: newTaskRecurrenceType === 'none' ? undefined : newTaskRecurrenceType,
      recurrenceDays: newTaskRecurrenceType === 'weekly' ? newTaskRecurrenceDays : undefined,
       // recurrenceEndDate: ... add input for end date later
      difficulty: newTaskDifficulty,
    };
    setAllTasks(prevTasks => [...prevTasks, newTask]);
    setNewTaskText('');
    setNewTaskTime('');
    setNewTaskNotes('');
    setNewTaskRecurrenceType('none');
    setNewTaskRecurrenceDays([]);
    setNewTaskDifficulty(undefined);
    toast({ title: "Task Added", description: `"${newTask.text}" added to ${format(selectedDate, 'PPP')}${newTask.time ? ' at ' + newTask.time : ''}.` });
  };

  const handleToggleTask = (taskId: string) => {
    setAllTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
     // TODO: Handle completing recurring task instances properly (mark instance as completed for this day)
  };

  const handleDeleteTask = (taskId: string) => {
    // TODO: Handle deleting recurring tasks properly (offer options: this instance, this and future, all)
    const taskToDelete = allTasks.find(task => task.id === taskId);
    setAllTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.text}" deleted.`, variant: "destructive" });
    }
  };

  const handleEditClick = (task: ScheduleItem) => {
    // When editing, find the *original* task if it's a recurring instance
    const originalTask = task.recurrenceType ? allTasks.find(t => task.id.startsWith(t.id.split('-')[0])) : allTasks.find(t => t.id === task.id);
    if (!originalTask) return; 

    setEditingTaskId(originalTask.id);
    setEditingTaskText(originalTask.text);
    setEditingTaskTime(originalTask.time || '');
    setEditingTaskNotes(originalTask.notes || '');
    setEditingTaskRecurrenceType(originalTask.recurrenceType || 'none');
    setEditingTaskRecurrenceDays(originalTask.recurrenceDays || []);
    setEditingTaskDifficulty(originalTask.difficulty);
    // setEditingTaskRecurrenceEndDate(... set end date if implemented)
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editingTaskText.trim()) {
       toast({ title: "Task cannot be empty", variant: "destructive" });
       return;
    }

    if (editingTaskTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(editingTaskTime)) {
      toast({ title: "Invalid Time Format", description: "Please use HH:mm format (e.g., 09:00)", variant: "destructive" });
      return;
    }

     if (editingTaskRecurrenceType === 'weekly' && editingTaskRecurrenceDays.length === 0) {
       toast({ title: "Select Days", description: "Please select at least one day for weekly recurrence.", variant: "destructive" });
       return;
    }

    setAllTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { 
              ...task,
              text: editingTaskText.trim(),
              time: editingTaskTime || undefined,
              notes: editingTaskNotes.trim() || undefined,
              recurrenceType: editingTaskRecurrenceType === 'none' ? undefined : editingTaskRecurrenceType,
              recurrenceDays: editingTaskRecurrenceType === 'weekly' ? editingTaskRecurrenceDays : undefined,
               // recurrenceEndDate: ... save end date if implemented
              difficulty: editingTaskDifficulty,
            }
          : task
      )
    );
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingTaskTime('');
    setEditingTaskNotes('');
    setEditingTaskRecurrenceType('none');
    setEditingTaskRecurrenceDays([]);
    setEditingTaskDifficulty(undefined);
    toast({ title: "Task Updated", description: `Task updated successfully.` });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
    setEditingTaskTime('');
    setEditingTaskNotes('');
    setEditingTaskRecurrenceType('none');
    setEditingTaskRecurrenceDays([]);
    setEditingTaskDifficulty(undefined);
  };

  const handleEditInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(taskId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleNewTaskInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) setSelectedDate(date);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getRecurrenceText = (task: ScheduleItem) => {
    if (!task.recurrenceType) return '';
    if (task.recurrenceType === 'daily') return '(Daily)';
    if (task.recurrenceType === 'weekly' && task.recurrenceDays) {
      const sortedDays = task.recurrenceDays.sort((a, b) => a - b);
      const dayAbbreviations = sortedDays.map(dayIndex => daysOfWeek[dayIndex].substring(0, 3));
      return `(Weekly on ${dayAbbreviations.join(', ')})`;
    }
    return '';
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
        <CardContent className="space-y-6">
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

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="flex flex-col space-y-1.5">
                 <Label htmlFor="new-task-time">Time (Optional)</Label>
                 <Input
                  id="new-task-time"
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full"
                  aria-label="New task time"
                />
               </div>
               <div className="flex flex-col space-y-1.5 sm:col-span-2">
                  <Label htmlFor="new-task-text">Task Description</Label>
                  <Input
                    id="new-task-text"
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Enter a new task..."
                    onKeyPress={handleNewTaskInputKeyPress}
                    className="flex-grow"
                    aria-label="New task text"
                  />
               </div>
            </div>
             <div className="flex flex-col space-y-1.5">
               <Label htmlFor="new-task-notes">Notes (Optional)</Label>
               <Textarea
                id="new-task-notes"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="flex-grow"
                rows={2}
                aria-label="New task notes"
              />
             </div>

            {/* Recurrence Options for New Task */}
            <div className="flex flex-col gap-2">
               <Label>Repeat</Label>
               <Select value={newTaskRecurrenceType} onValueChange={setNewTaskRecurrenceType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>

              {newTaskRecurrenceType === 'weekly' && (
                 <div className="flex flex-col space-y-2">
                   <Label>Repeat On:</Label>
                   <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day, index) => (
                      <div key={day} className="flex items-center space-x-1">
                        <Checkbox
                          id={`new-task-day-${index}`}
                          checked={newTaskRecurrenceDays.includes(index)}
                          onCheckedChange={(checked) => {
                            setNewTaskRecurrenceDays(prev => 
                              checked ? [...prev, index] : prev.filter(d => d !== index)
                            );
                          }}
                        />
                        <Label htmlFor={`new-task-day-${index}`}>{day.substring(0, 3)}</Label>
                      </div>
                    ))}
                  </div>
                 </div>
              )}

              {/* Add input for recurrence end date later */}

            </div>

            {/* Difficulty Options for New Task */}
             <div className="flex flex-col gap-2">
               <Label>Difficulty (Optional)</Label>
               <Select value={newTaskDifficulty} onValueChange={(value: TaskDifficulty) => setNewTaskDifficulty(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
             </div>


            <Button onClick={handleAddTask} className="shrink-0 w-full sm:w-auto">
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
                {tasksForSelectedDate.map(task => {
                  let difficultyClasses = '';
                  switch (task.difficulty) {
                    case 'easy':
                      difficultyClasses = 'bg-green-100 border-l-4 border-green-500';
                      break;
                    case 'medium':
                      difficultyClasses = 'bg-yellow-100 border-l-4 border-yellow-500';
                      break;
                    case 'hard':
                      difficultyClasses = 'bg-red-100 border-l-4 border-red-500';
                      break;
                  }
                  <li key={task.id} className="flex flex-col p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                       {editingTaskId === task.id ? (
                        // Editing state
                        <div className="flex flex-col gap-3 flex-grow">
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <div className="flex flex-col space-y-1.5">
                               <Label htmlFor={`edit-task-time-${task.id}`}>Time (Optional)</Label>
                               <Input
                                id={`edit-task-time-${task.id}`}
                                type="time"
                                value={editingTaskTime}
                                onChange={(e) => setEditingTaskTime(e.target.value)}
                                className="w-full"
                                aria-label="Edit task time"
                              />
                             </div>
                             <div className="flex flex-col space-y-1.5 sm:col-span-2">
                                <Label htmlFor={`edit-task-text-${task.id}`}>Task Description</Label>
                                <Input
                                  id={`edit-task-text-${task.id}`}
                                  type="text"
                                  value={editingTaskText}
                                  onChange={(e) => setEditingTaskText(e.target.value)}
                                  onKeyPress={(e) => handleEditInputKeyPress(e as React.KeyboardEvent<HTMLInputElement>, task.id)}
                                  className="flex-grow"
                                  aria-label="Edit task text"
                                />
                             </div>
                          </div>
                           <div className="flex flex-col space-y-1.5">
                              <Label htmlFor={`edit-task-notes-${task.id}`}>Notes (Optional)</Label>
                              <Textarea
                               id={`edit-task-notes-${task.id}`}
                               value={editingTaskNotes}
                               onChange={(e) => setEditingTaskNotes(e.target.value)}
                               placeholder="Edit notes (optional)..."
                               className="flex-grow"
                               rows={2}
                               aria-label="Edit task notes"
                             />
                           </div>

                          {/* Recurrence Options for Editing Task */}
                           <div className="flex flex-col gap-2">
                             <Label>Repeat</Label>
                             <Select value={editingTaskRecurrenceType} onValueChange={setEditingTaskRecurrenceType}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select recurrence" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>

                            {editingTaskRecurrenceType === 'weekly' && (
                               <div className="flex flex-col space-y-2">
                                <Label>Repeat On:</Label>
                                <div className="flex flex-wrap gap-2">
                                  {daysOfWeek.map((day, index) => (
                                    <div key={day} className="flex items-center space-x-1">
                                      <Checkbox
                                        id={`edit-task-day-${task.id}-${index}`}
                                        checked={editingTaskRecurrenceDays.includes(index)}
                                        onCheckedChange={(checked) => {
                                          setEditingTaskRecurrenceDays(prev => 
                                            checked ? [...prev, index] : prev.filter(d => d !== index)
                                          );
                                        }}
                                      />
                                      <Label htmlFor={`edit-task-day-${task.id}-${index}`}>{day.substring(0, 3)}</Label>
                                    </div>
                                  ))}
                                </div>
                               </div>
                            )}
                            {/* Add input for recurrence end date later */}
                          </div>

                        </div>
                       ) : (
                        // Non-editing state - Checkbox, Time, Text, and Recurrence/Notes
                        <div className="flex items-start space-x-3 flex-grow">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.id)}
                            aria-label={`Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                            className="mt-1" // Align checkbox better with text
                          />
                          <div className="flex-grow space-y-1">
                             <div className={`flex items-center ${task.completed ? 'line-through text-muted-foreground' : ''}`}> 
                               {task.time && <span className="text-muted-foreground text-sm mr-2 font-mono">{task.time}</span>}
                               <span className="font-medium">{task.text}</span>
                               {task.recurrenceType && (
                                  <Repeat className="ml-2 h-4 w-4 text-muted-foreground" aria-label={`Repeats ${task.recurrenceType}`} />
                               )}
                             </div>
                             {task.notes && (
                                <div className="text-muted-foreground text-sm italic break-words">
                                  {task.notes}
                                </div>
                             )}
                             {task.recurrenceType && task.recurrenceType !== 'none' && ( // Display recurrence text below notes if exists, or below text
                                <div className="text-muted-foreground text-xs">
                                  {getRecurrenceText(task)}
                                </div>
                             )}
                          </div>
                        </div>
                       )}

                      {/* Edit and Delete Buttons (conditionally rendered) */}
                      <div className="flex space-x-1 shrink-0">
                        {editingTaskId !== task.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(task)}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Edit task "${task.text}"`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {editingTaskId !== task.id && (
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete task "${task.text}"`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                         {editingTaskId === task.id && (
                           <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveEdit(task.id)}
                            aria-label="Save edit"
                          >
                            <Save className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {editingTaskId === task.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            aria-label="Cancel edit"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
})}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
