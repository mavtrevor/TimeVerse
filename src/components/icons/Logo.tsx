
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="TimeVerse Logo"
      className="h-8 w-8"
      {...props}
    >
      <circle cx="50" cy="50" r="45" fill="hsl(var(--primary))" />
      <path
        d="M50 15 V50 H75"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="50" cy="50" r="5" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}
