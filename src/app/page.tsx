
import AppLayout from '@/components/AppLayout';
import { SidebarProvider } from '@/components/ui/sidebar';


export default function HomePage() {
  return (
    <SidebarProvider> {/* Wrap AppLayout with SidebarProvider */}
      <AppLayout />
    </SidebarProvider>
  );
}
