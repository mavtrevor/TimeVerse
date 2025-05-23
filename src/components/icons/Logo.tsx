// src/components/icons/Logo.tsx
"use client";

import Image, { type ImageProps } from 'next/image';
import { useSettings } from '@/hooks/useSettings';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Define a type for the props
type LogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  className?: string;
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
};

export function Logo({ className, width, height, ...props }: LogoProps) {
  const { theme } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let currentEffectiveTheme: 'light' | 'dark' = 'light'; // Default for SSR / pre-mount

  if (mounted) {
    if (theme === 'system') {
      currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      currentEffectiveTheme = theme;
    }
  }

  const lightModeLogo = "/timeverse-logo-full.png";
  const darkModeLogo = "/timeverse-logo-full-dark.png"; // Path to your new dark mode logo

  // Select logo based on theme, default to lightModeLogo if not mounted yet to avoid hydration mismatch for src
  const logoSrc = mounted && currentEffectiveTheme === 'dark' ? darkModeLogo : lightModeLogo;
  
  // Default dimensions if not provided, matching h-10 (40px)
  const defaultWidth = 160; 
  const defaultHeight = 40;


  return (
    <div
      className={cn("relative", className)}
      style={{ 
        width: width ? `${width}px` : `${defaultWidth}px`, 
        height: height ? `${height}px` : `${defaultHeight}px` 
      }}
    >
      <Image
        key={logoSrc} // Add key to help React re-render if src changes, especially with next/image optimizations
        src={logoSrc}
        alt="TimeVerse Logo"
        fill // Use fill to make the image responsive within the parent div
        style={{ objectFit: 'contain' }} // Ensures the image scales correctly without cropping
        priority // Preload logo if it's LCP
        {...props} // Spread other ImageProps like unoptimized if needed
      />
    </div>
  );
}
