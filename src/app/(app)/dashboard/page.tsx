"use client";

import UserDashboardFeature from "@/components/features/dashboard/UserDashboardFeature";

export default function UserDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-10rem)] p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-4xl">
        <UserDashboardFeature />
      </div>
    </div>
  );
}