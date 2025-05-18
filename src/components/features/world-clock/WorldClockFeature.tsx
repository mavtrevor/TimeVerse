
"use client";

import React, { useState, useEffect } from 'react';
import type { WorldClockCity } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { commonTimezones, getTimeInTimezone, getTimezoneOffset } from '@/lib/timeUtils';
import { useToast } from '@/hooks/use-toast';

const INITIAL_WORLD_CLOCKS: WorldClockCity[] = [];

export default function WorldClockFeature() {
  const [cities, setCities] = useLocalStorage<WorldClockCity[]>('chronozen-worldclocks', INITIAL_WORLD_CLOCKS);
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const { timeFormat, language } = useSettings(); 
  const settings = useSettings();
  const { toast } = useToast();
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date()); // Set initial time on client after mount
    const timerId = setInterval(() => setClientNow(new Date()), 1000); // Update every second
    return () => clearInterval(timerId);
  }, []);

  const handleAddCity = (timezoneId: string) => {
    const selectedTz = commonTimezones.find(tz => tz.timezone === timezoneId);
    if (selectedTz && !cities.find(c => c.timezone === selectedTz.timezone)) {
      const newCity: WorldClockCity = {
        id: Date.now().toString(),
        name: selectedTz.name,
        timezone: selectedTz.timezone,
      };
      setCities([...cities, newCity]);
      toast({ title: "City Added", description: `${selectedTz.name} added to your world clock.` });
    } else if (!selectedTz) {
      toast({ title: "Error", description: "Selected timezone not found.", variant: "destructive" });
    } else {
      toast({ title: "Already Added", description: `${selectedTz.name} is already in your list.` });
    }
    setIsAddCityDialogOpen(false);
  };

  const handleDeleteCity = (id: string) => {
    const cityToDelete = cities.find(c => c.id === id);
    setCities(cities.filter(c => c.id !== id));
    if (cityToDelete) {
      toast({ title: "City Removed", description: `${cityToDelete.name} removed.`, variant: "destructive" });
    }
  };
  
  useEffect(() => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localCityExists = cities.some(city => city.timezone === localTz && city.id === 'local');
    
    if (!localCityExists) {
      const localCityInfo = commonTimezones.find(tz => tz.timezone === localTz);
      const name = localCityInfo ? localCityInfo.name.replace(/\b\w/g, l => l.toUpperCase()) : "Local Time"; // Ensure consistent "Local Time" for auto-add if no match

      setCities(prevCities => {
        const existingLocalById = prevCities.find(c => c.id === 'local');
        if(existingLocalById) { // If "local" id exists, update its timezone if different, otherwise leave it
            if(existingLocalById.timezone !== localTz) {
                return prevCities.map(c => c.id === 'local' ? {...c, timezone: localTz, name: name} : c);
            }
            return prevCities;
        }
        
        // Remove any other city that might be using the local timezone string but a different name or id
        const filteredCities = prevCities.filter(c => c.timezone !== localTz || c.id === 'local');
        const newLocalCity: WorldClockCity = { id: 'local', name: name, timezone: localTz };

        // If there was another city with the local timezone but not id 'local', replace it if it exists, otherwise add
        const indexOfOldLocal = filteredCities.findIndex(c => c.timezone === localTz && c.id !== 'local');
        if (indexOfOldLocal !== -1) {
            filteredCities.splice(indexOfOldLocal, 1, newLocalCity);
            return filteredCities;
        }

        return [newLocalCity, ...filteredCities.filter(c => c.id !== 'local')];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">World Clock</h2>
        <Dialog open={isAddCityDialogOpen} onOpenChange={setIsAddCityDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add City
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add City to World Clock</DialogTitle>
            </DialogHeader>
            <AddCityForm onAddCity={handleAddCity} existingTimezones={cities.map(c => c.timezone)} />
          </DialogContent>
        </Dialog>
      </div>

      {cities.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No cities added. Click "Add City" to display times from around the world.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.map(city => (
          <Card key={city.id} className="shadow-lg flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl">{city.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{getTimezoneOffset(city.timezone)}</p>
              </div>
              {city.id !== 'local' && ( 
                 <Button variant="ghost" size="icon" onClick={() => handleDeleteCity(city.id)} className="text-muted-foreground hover:text-destructive -mt-1 -mr-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center">
              <p className="text-4xl font-mono font-bold text-primary">
                {clientNow ? getTimeInTimezone(city.timezone, settings, clientNow) : "00:00:00"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {clientNow ? clientNow.toLocaleDateString(language, { timeZone: city.timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Loading date..."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


interface AddCityFormProps {
  onAddCity: (timezone: string) => void;
  existingTimezones: string[];
}

function AddCityForm({ onAddCity, existingTimezones }: AddCityFormProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTimezone) {
      onAddCity(selectedTimezone);
      setSelectedTimezone(''); 
    }
  };

  const availableTimezones = commonTimezones.filter(tz => tz.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && !existingTimezones.includes(tz.timezone));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <Select onValueChange={setSelectedTimezone} value={selectedTimezone}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a city/timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Common Timezones</SelectLabel>
            {availableTimezones.length > 0 ? availableTimezones.map(tz => (
              <SelectItem key={tz.timezone} value={tz.timezone}>
                {tz.name} ({tz.timezone})
              </SelectItem>
            )) : <SelectItem value="none" disabled>No more timezones to add or all unique ones added</SelectItem>}
          </SelectGroup>
        </SelectContent>
      </Select>
      <DialogFooter>
        <DialogClose asChild>
           <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!selectedTimezone || selectedTimezone === "none"}>Add City</Button>
      </DialogFooter>
    </form>
  );
}

