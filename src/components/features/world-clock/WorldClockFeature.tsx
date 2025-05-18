
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { WorldClockCity, CityDetail } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { commonTimezones, getTimeInTimezone, getTimezoneOffset, formatTime } from '@/lib/timeUtils';
import { popularCityDetails } from '@/lib/cityData';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const INITIAL_USER_ADDED_CLOCKS: WorldClockCity[] = [];

export default function WorldClockFeature() {
  const [userAddedCities, setUserAddedCities] = useLocalStorage<WorldClockCity[]>('timeverse-user-worldclocks', INITIAL_USER_ADDED_CLOCKS);
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const settings = useSettings();
  const { timeFormat, language } = settings;
  const { toast } = useToast();
  const [clientNow, setClientNow] = useState<Date | null>(null);
  const [localTimezone, setLocalTimezone] = useState<string>('');
  const [localCityName, setLocalCityName] = useState<string>('Local Time');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setClientNow(new Date()); // Set initial time on client after mount
    const timerId = setInterval(() => setClientNow(new Date()), 1000); // Update every second
    
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocalTimezone(detectedTimezone);
    const foundLocal = popularCityDetails.find(c => c.iana === detectedTimezone) || commonTimezones.find(c => c.timezone === detectedTimezone);
    setLocalCityName(foundLocal?.name || 'Local Time');

    return () => clearInterval(timerId);
  }, []);

  const handleAddCity = (timezoneId: string) => {
    const selectedTzData = commonTimezones.find(tz => tz.timezone === timezoneId);
    if (!selectedTzData) {
      toast({ title: "Error", description: "Selected timezone data not found.", variant: "destructive" });
      return;
    }

    const isAlreadyPopular = popularCityDetails.some(pc => pc.iana === timezoneId);
    const isAlreadyAddedByUser = userAddedCities.some(uac => uac.timezone === timezoneId);
    const isLocal = timezoneId === localTimezone;

    if (isLocal) {
      toast({ title: "Info", description: "Local time is already displayed." });
    } else if (isAlreadyPopular) {
      toast({ title: "Info", description: `${selectedTzData.name} is already shown in the popular cities list.` });
    } else if (isAlreadyAddedByUser) {
      toast({ title: "Already Added", description: `${selectedTzData.name} is already in your custom list.` });
    } else {
      const newCity: WorldClockCity = {
        id: Date.now().toString(),
        name: selectedTzData.name,
        timezone: selectedTzData.timezone,
      };
      setUserAddedCities([...userAddedCities, newCity]);
      toast({ title: "City Added", description: `${selectedTzData.name} added to your custom list.` });
    }
    setIsAddCityDialogOpen(false);
  };

  const handleDeleteUserAddedCity = (id: string) => {
    const cityToDelete = userAddedCities.find(c => c.id === id);
    setUserAddedCities(userAddedCities.filter(c => c.id !== id));
    if (cityToDelete) {
      toast({ title: "City Removed", description: `${cityToDelete.name} removed from your custom list.`, variant: "destructive" });
    }
  };

  const renderCityCard = (city: CityDetail | WorldClockCity, isUserAdded: boolean = false, isLocal: boolean = false) => {
    const cityData = city as CityDetail; // For popular cities
    const userCityData = city as WorldClockCity; // For user-added cities
    
    const name = cityData.displayName || city.name;
    const timezone = isUserAdded ? userCityData.timezone : cityData.iana;
    const linkHref = `/world-clock/${encodeURIComponent(timezone)}`;

    return (
      <Card key={isUserAdded ? userCityData.id : cityData.iana} className="shadow-lg flex flex-col">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl hover:text-primary">
              <Link href={linkHref}>
                {name}
              </Link>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{getTimezoneOffset(timezone)}</p>
          </div>
          {isUserAdded && ( 
             <Button variant="ghost" size="icon" onClick={() => handleDeleteUserAddedCity(userCityData.id)} className="text-muted-foreground hover:text-destructive -mt-1 -mr-2">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {!isUserAdded && !isLocal && (
             <Link href={linkHref} passHref legacyBehavior>
                <Button variant="ghost" size="icon" aria-label={`Details for ${name}`} className="text-muted-foreground hover:text-primary -mt-1 -mr-2">
                    <ArrowRight className="h-4 w-4" />
                </Button>
             </Link>
          )}
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center">
          <p className="text-4xl font-mono font-bold text-primary">
            {clientNow ? getTimeInTimezone(timezone, settings, clientNow) : "00:00:00"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {clientNow ? clientNow.toLocaleDateString(language, { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric' }) : "Loading date..."}
          </p>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Local Time Display */}
      {localTimezone && clientNow && (
        <Card className="shadow-xl border-primary ring-1 ring-primary/50">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
                <Link href={`/world-clock/${encodeURIComponent(localTimezone)}`} className="hover:underline">
                    {localCityName} (Your Local Time)
                </Link>
            </CardTitle>
            <CardDescription>{getTimezoneOffset(localTimezone)}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="font-mono text-5xl md:text-7xl font-bold text-primary select-none">
              {formatTime(clientNow, timeFormat)}
            </div>
            <div className="text-md md:text-lg text-muted-foreground select-none mt-1">
              {clientNow.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Popular Cities</h2>
        {popularCityDetails.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No popular cities configured.
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {popularCityDetails.filter(city => city.iana !== localTimezone).map(city => renderCityCard(city, false))}
        </div>
      </div>

      <Separator />
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Your Custom Clocks</h2>
          <Dialog open={isAddCityDialogOpen} onOpenChange={setIsAddCityDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Custom City
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Custom City to World Clock</DialogTitle>
              </DialogHeader>
              <AddCityForm 
                onAddCity={handleAddCity} 
                existingTimezones={[
                    localTimezone,
                    ...popularCityDetails.map(c => c.iana), 
                    ...userAddedCities.map(c => c.timezone)
                ]} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {(!mounted || userAddedCities.length === 0) ? (
          <Card className="shadow-sm border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              {!mounted ? "Loading custom clocks..." : "You haven't added any custom city clocks."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userAddedCities.map(city => renderCityCard(city, true))}
          </div>
        )}
      </div>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-xl">🕒 How to Use the World Clock on Our Website</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Our online world clock makes it easy to check the current time and date in any city or country worldwide. Whether you're coordinating meetings across time zones or just curious about the local time in another region, our tool gives you real-time, accurate results instantly.
          </p>
          
          <h3 className="font-semibold text-md">🌐 Explore Global Time Zones</h3>
          <p>The homepage shows:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>The exact local time based on your current location.</li>
            <li>A customizable list of clocks for major global cities like New York, London, Tokyo, and more.</li>
          </ul>
          <p>You can add, remove, or reorder cities in this list to suit your preferences. Each city clock is clickable — simply tap the city name to open a dedicated full-page clock view for that location.</p>

          <h3 className="font-semibold text-md">🎨 Personalize Your Clock Display</h3>
          <p>Make the clock your own! You can:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Adjust the text color</li>
            <li>Change the font style and size</li>
          </ul>
          <p>All customization settings are saved automatically in your browser, so your preferences stay in place the next time you visit.</p>

          <h3 className="font-semibold text-md">✅ Why Use Our Online Clock?</h3>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Check the current time across multiple time zones</li>
            <li>Quickly view the time difference between your city and others</li>
            <li>Access a clean, mobile-friendly interface that works across devices</li>
            <li>Enjoy real-time synchronization with no manual refreshing</li>
          </ul>
          <p>Our world clock is ideal for remote teams, travelers, students, and anyone who needs a reliable global timekeeping tool.</p>
        </CardContent>
      </Card>

    </div>
  );
}


interface AddCityFormProps {
  onAddCity: (timezone: string) => void;
  existingTimezones: string[]; // Full list of timezones already displayed (local, popular, user-added)
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

  // Filter commonTimezones to exclude those already displayed (local, popular, or user-added)
  const availableTimezones = commonTimezones.filter(tz => !existingTimezones.includes(tz.timezone));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <Select onValueChange={setSelectedTimezone} value={selectedTimezone}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a city/timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Timezones</SelectLabel>
            {availableTimezones.length > 0 ? availableTimezones.map(tz => (
              <SelectItem key={tz.timezone} value={tz.timezone}>
                {tz.name} ({getTimezoneOffset(tz.timezone)})
              </SelectItem>
            )) : <SelectItem value="none" disabled>No more unique timezones to add from this list.</SelectItem>}
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

    