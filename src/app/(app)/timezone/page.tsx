"use client";

import TimeZoneMeetingPlannerFeature from "@/components/features/timezone/TimeZoneMeetingPlannerFeature";

export default function TimeZoneMeetingPlannerPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Time Zone Meeting Planner</h1>
        <TimeZoneMeetingPlannerFeature />
      </div>
    </div>
  );
}