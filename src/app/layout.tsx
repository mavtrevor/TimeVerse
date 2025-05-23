
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from "@/components/ui/toaster"

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'TimeVerse – The Ultimate Online Clock Suite',
  description: 'Your ultimate online clock suite for alarms, timers, stopwatch, world clock, and more.',
  // Next.js will automatically pick up /src/app/favicon.ico if it exists.
  // The manual links below are for theme-specific favicons.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme-aware favicons for modern browsers */}
        {/* Ensure these files exist in your /public folder */}
        <link rel="icon" href="/favicon-light.ico" type="image/x-icon" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-dark.ico" type="image/x-icon" media="(prefers-color-scheme: dark)" />
        {/* 
          Next.js will also automatically add a link for /src/app/favicon.ico if it exists.
          The browser will choose the most specific icon.
          For example, if prefers-color-scheme: dark matches, favicon-dark.ico will be used.
          If no media query matches, it might fall back to a general favicon.ico in src/app/.
        */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <SettingsProvider>
            {children}
            <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}

