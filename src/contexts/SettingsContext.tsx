
"use client";

import type { ReactNode } from "react";
import React, { createContext, useEffect } from 'react';
import type { AppSettings, TimeFormat, AppTheme, AppLanguage } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';

interface SettingsContextProps extends AppSettings {
  setTimeFormat: (format: TimeFormat) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
}

const defaultSettings: AppSettings = {
  timeFormat: '24h',
  theme: 'system',
  language: 'en',
};

export const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('chronozen-settings', defaultSettings);

  useEffect(() => {
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    // Add direction attribute if needed for RTL languages like Arabic
    if (settings.language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [settings.language]);


  const setTheme = (theme: AppTheme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setTimeFormat = (timeFormat: TimeFormat) => {
    setSettings(prev => ({ ...prev, timeFormat }));
  };

  const setLanguage = (language: AppLanguage) => {
    setSettings(prev => ({ ...prev, language }));
  };

  return (
    <SettingsContext.Provider value={{ ...settings, setTheme, setTimeFormat, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};
