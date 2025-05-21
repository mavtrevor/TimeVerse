
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
 <html lang="en" suppressHydrationWarning>
 <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <SettingsProvider>
            {children}
            <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
