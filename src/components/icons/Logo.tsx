// src/components/icons/Logo.tsx
import Image from 'next/image';
import type { ImageProps } from 'next/image';

// Define a type for the props, extending NextImageProps if needed for specific defaultRemoved
type LogoProps = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> & {
  className?: string;
};

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div className={cn("relative", className)} style={{ width: props.width || 160, height: props.height || 42 }}>
      <Image
        src="/timeverse-logo-full.png" // Path to your new logo in the public folder
        alt="TimeVerse Logo"
        fill // Use fill to make the image responsive within the parent div
        style={{ objectFit: 'contain' }} // Ensures the image scales correctly without cropping
        priority // Preload logo if it's LCP
        {...props}
      />
    </div>
  );
}

// Helper function (if not already available globally)
// You can keep this here or move it to a utils file if you have one
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
