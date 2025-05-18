
"use client";

import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AppLanguage, AppTheme, TimeFormat } from '@/types';

export default function SettingsFeature() {
  const { timeFormat, setTheme, theme, language, setLanguage, setTimeFormat } = useSettings();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base">Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(value: AppTheme) => setTheme(value)}
              className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <Label htmlFor="theme-light" className="flex flex-col items-center gap-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <span>☀️ Light</span>
              </Label>
              <Label htmlFor="theme-dark" className="flex flex-col items-center gap-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <span>🌙 Dark</span>
              </Label>
              <Label htmlFor="theme-system" className="flex flex-col items-center gap-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <span>💻 System</span>
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Time & Date</CardTitle>
          <CardDescription>Adjust time and date display preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timeFormat" className="text-base">Time Format</Label>
             <Select value={timeFormat} onValueChange={(value: TimeFormat) => setTimeFormat(value)}>
                <SelectTrigger id="timeFormat" className="w-[180px] mt-2">
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (e.g., 3:00 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (e.g., 15:00)</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Choose your preferred language for the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="language" className="text-base">Application Language</Label>
            <Select value={language} onValueChange={(value: AppLanguage) => setLanguage(value)}>
              <SelectTrigger id="language" className="w-[180px] mt-2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Full multilingual support is being implemented. Some text may still appear in English.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
