
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extendedCommonTimezones, dialogCountries, getTimeInTimezone, getTimezoneOffset, formatTime } from '@/lib/timeUtils';
import type { CommonTimezoneInfo } from '@/lib/timeUtils';
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
    setClientNow(new Date()); 
    const timerId = setInterval(() => setClientNow(new Date()), 1000); 
    
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocalTimezone(detectedTimezone);

    const foundLocalInPopular = popularCityDetails.find(c => c.iana === detectedTimezone);
    if (foundLocalInPopular) {
        setLocalCityName(foundLocalInPopular.displayName || foundLocalInPopular.name);
    } else {
        const foundLocalInExtended = extendedCommonTimezones.find(c => c.timezone === detectedTimezone);
        setLocalCityName(foundLocalInExtended?.city || 'Local Time');
    }
    

    return () => clearInterval(timerId);
  }, []);

  const handleAddCity = (timezoneIana: string, title: string) => {
    const isAlreadyPopular = popularCityDetails.some(pc => pc.iana === timezoneIana);
    const isAlreadyAddedByUser = userAddedCities.some(uac => uac.timezone === timezoneIana);
    const isLocal = timezoneIana === localTimezone;

    if (isLocal) {
      toast({ title: "Info", description: "Local time is already displayed." });
    } else if (isAlreadyPopular) {
       const popularCity = popularCityDetails.find(pc => pc.iana === timezoneIana);
      toast({ title: "Info", description: `${popularCity?.name || 'This city'} is already shown in the popular cities list.` });
    } else if (isAlreadyAddedByUser) {
      toast({ title: "Already Added", description: `${title} is already in your custom list.` });
    } else {
      const newCity: WorldClockCity = {
        id: Date.now().toString(),
        name: title, 
        timezone: timezoneIana,
      };
      setUserAddedCities([...userAddedCities, newCity]);
      toast({ title: "City Added", description: `${title} added to your custom list.` });
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
    const cityData = city as CityDetail; 
    const userCityData = city as WorldClockCity; 
    
    const name = isUserAdded ? userCityData.name : (cityData.displayName || cityData.name);
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
            <p className="text-xs text-muted-foreground">
              {clientNow ? getTimezoneOffset(timezone, clientNow) : 'N/A'}
            </p>
          </div>
          {isUserAdded && ( 
             <Button variant="ghost" size="icon" onClick={() => handleDeleteUserAddedCity(userCityData.id)} className="text-muted-foreground hover:text-destructive -mt-1 -mr-2">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {(!isUserAdded && !isLocal) && ( 
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

  const renderUserAddedCitiesList = () => {
    if (userAddedCities.length === 0) {
      return (
        <Card className="shadow-sm border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            You haven't added any custom city clocks.
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {userAddedCities.map(city => renderCityCard(city, true))}
      </div>
    );
  };


  return (
    <div className="space-y-8 p-4 md:p-6">
      {mounted && localTimezone && clientNow && (
        <Card className="shadow-xl border-primary ring-1 ring-primary/50">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
                <Link href={`/world-clock/${encodeURIComponent(localTimezone)}`} className="hover:underline">
                    {localCityName} (Your Local Time)
                </Link>
            </CardTitle>
            <CardDescription>{getTimezoneOffset(localTimezone, clientNow)}</CardDescription>
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
        {!mounted || !clientNow ? (
           <Card className="shadow-lg"><CardContent className="pt-6 text-center text-muted-foreground">Loading popular cities...</CardContent></Card>
        ) : popularCityDetails.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No popular cities configured.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popularCityDetails.filter(city => city.iana !== localTimezone).map(city => renderCityCard(city, false))}
          </div>
        )}
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold text-xl">Add</DialogTitle>
              </DialogHeader>
              <AddCityForm 
                onAddCity={handleAddCity} 
                onClose={() => setIsAddCityDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        {/* Render custom cities list or "Loading..." if not mounted, or "No custom clocks..." if empty */}
        {!mounted ? (
          <Card className="shadow-sm border-dashed"><CardContent className="pt-6 text-center text-muted-foreground">Loading custom clocks...</CardContent></Card>
        ) : (
          renderUserAddedCitiesList()
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
  onAddCity: (timezoneIana: string, title: string) => void;
  onClose: () => void;
}

function AddCityForm({ onAddCity, onClose }: AddCityFormProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [selectedTimezoneIana, setSelectedTimezoneIana] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [clientNowForOffset, setClientNowForOffset] = useState<Date | null>(null);

  useEffect(() => {
    setClientNowForOffset(new Date()); // For calculating current offsets in dropdown
  }, []);


  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedTimezoneIana(''); 
    setCustomTitle('');
  };

  const handleTimezoneChange = (iana: string) => {
    setSelectedTimezoneIana(iana);
    const tzData = extendedCommonTimezones.find(tz => tz.timezone === iana);
    setCustomTitle(tzData?.city || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTimezoneIana) {
      onAddCity(selectedTimezoneIana, customTitle || 'Custom City');
    }
  };

  const timezonesForSelectedCountry = selectedCountryCode && clientNowForOffset
    ? extendedCommonTimezones.filter(tz => tz.countryCode === selectedCountryCode)
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <Label htmlFor="country">Country</Label>
        <Select onValueChange={handleCountryChange} value={selectedCountryCode}>
          <SelectTrigger id="country" className="w-full mt-1">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {dialogCountries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="timezone">Time zone</Label>
        <Select 
            onValueChange={handleTimezoneChange} 
            value={selectedTimezoneIana} 
            disabled={!selectedCountryCode || timezonesForSelectedCountry.length === 0 || !clientNowForOffset}
        >
          <SelectTrigger id="timezone" className="w-full mt-1">
            <SelectValue placeholder={!clientNowForOffset ? "Loading timezones..." : (!selectedCountryCode ? "Select country first" : (timezonesForSelectedCountry.length === 0 ? "No timezones for this country" : "Select a timezone"))} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {clientNowForOffset && timezonesForSelectedCountry.map(tz => (
                <SelectItem key={tz.timezone} value={tz.timezone}>
                  {`(${getTimezoneOffset(tz.timezone, clientNowForOffset)}) ${tz.name}`}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="title">Title</Label>
        <Input 
            id="title" 
            className="mt-1" 
            value={customTitle} 
            onChange={(e) => setCustomTitle(e.target.value)} 
            placeholder="Enter custom title"
            disabled={!selectedTimezoneIana}
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
            type="submit" 
            disabled={!selectedTimezoneIana || !customTitle.trim()} 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
            OK
        </Button>
      </DialogFooter>
    </form>
  );
}

