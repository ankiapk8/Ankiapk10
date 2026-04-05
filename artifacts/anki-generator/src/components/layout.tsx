import { Link, useLocation } from "wouter";
import { BookOpen, Library, PlusCircle } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 md:px-6 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold tracking-tight">AnkiGen</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground/80 ${
                location === "/" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Generate
            </Link>
            <Link
              href="/decks"
              className={`transition-colors hover:text-foreground/80 ${
                location.startsWith("/decks") ? "text-foreground" : "text-foreground/60"
              }`}
            >
              Library
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
