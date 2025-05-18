
// This page is now the root of the (app) group, effectively `/`
// It will render the Alarms feature by default.
import AlarmsFeature from '@/components/features/alarms/AlarmsFeature';

export default function RootPage() {
  // SidebarProvider is now in (app)/layout.tsx
  return <AlarmsFeature />;
}
