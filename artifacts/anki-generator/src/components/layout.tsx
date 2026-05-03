import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, LayoutDashboard, Library, Sparkles, Moon, Sun, History, CalendarDays } from "lucide-react";
import { ApkWelcomeBanner } from "@/components/apk-welcome-banner";
import { BottomNav } from "@/components/bottom-nav";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { FeedbackButton } from "@/components/feedback-button";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { Button } from "@/components/ui/button";

const NAV_ACCENTS: Record<string, { color: string; glow: string }> = {
  "/":        { color: "#34d399", glow: "hsl(152 72% 55% / 0.35)" },
  "/decks":   { color: "#818cf8", glow: "hsl(239 84% 68% / 0.35)" },
  "/history": { color: "#38bdf8", glow: "hsl(199 89% 60% / 0.35)" },
  "/planner": { color: "#fb923c", glow: "hsl(24 95% 60% / 0.35)" },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [dark, setDark] = useDarkMode();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/decks", label: "Library", icon: Library },
    { href: "/history", label: "History", icon: History },
    { href: "/planner", label: "Planner", icon: CalendarDays },
  ];

  const generateActive = location === "/generate";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mr-1 sm:mr-2 md:mr-6 shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold tracking-tight hidden sm:inline">AnkiGen</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/"
                ? location === "/"
                : location.startsWith(href);
              const accent = NAV_ACCENTS[href];
              return (
                <Link key={href} href={href}>
                  <span
                    className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-foreground/55 hover:text-foreground hover:bg-muted/60"
                    }`}
                    style={isActive ? { color: accent?.color } : undefined}
                    aria-label={label}
                  >
                    {isActive && accent && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-md"
                        style={{ background: `${accent.color}14`, boxShadow: `0 0 10px ${accent.glow}` }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden xs:inline sm:inline">{label}</span>
                    </span>
                    {isActive && accent && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0.5 left-2 right-2 h-0.5 rounded-full"
                        style={{ background: accent.color, opacity: 0.7 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </span>
                </Link>
              );
            })}

            <Link href="/generate">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={`relative ml-0.5 sm:ml-1 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-sm font-semibold overflow-hidden text-white shadow-sm shadow-primary/20 ${
                  generateActive ? "ring-2 ring-primary/40 ring-offset-1 ring-offset-background" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(120deg, hsl(150 60% 45%) 0%, hsl(140 65% 42%) 50%, hsl(95 65% 45%) 100%)",
                }}
                aria-label="Generate flashcards"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)",
                  }}
                  animate={{ x: ["-120%", "120%"] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1.4,
                  }}
                />
                <motion.span
                  aria-hidden
                  className="relative inline-flex"
                  animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.15, 1, 1] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 0.6,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                <span className="relative">Generate</span>
              </motion.span>
            </Link>
          </nav>
          <div className="ml-auto pl-2 flex items-center gap-1">
            <PomodoroTimer />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setDark(d => !d)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className={`flex-1 flex flex-col w-full ${location.startsWith("/planner") ? "" : "max-w-5xl mx-auto p-4 md:p-8 pb-24 lg:pb-8"}`}>
        {children}
      </main>
      <BottomNav />
      <FeedbackButton />
      <ApkWelcomeBanner />
    </div>
  );
}
