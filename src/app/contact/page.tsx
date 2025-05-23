
import ContactFeature from '@/components/features/contact/ContactFeature';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
            <Logo />
            <span>
              TimeVerse
              <span className="hidden sm:inline"> – The Ultimate Online Clock Suite</span>
            </span>
        </Link>
        <Button variant="outline" asChild>
          <Link href="/">
            Back to App
          </Link>
        </Button>
      </header>
      <main className="flex-1 py-8">
        <ContactFeature />
      </main>
      <footer className="border-t p-6 text-center text-sm text-muted-foreground">
         <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap">
            <Link href="/contact" className="hover:text-foreground">Contacts</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <span className="hidden sm:inline">|</span>
            <span>© 2025 TimeVerse</span>
          </div>
      </footer>
    </div>
  );
}
