import { BookOpen, CalendarDays, FileDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UseAuthResult } from "@/hooks/use-auth";

interface AuthGateProps {
  auth: UseAuthResult;
  children: React.ReactNode;
}

export function AuthGate({ auth, children }: AuthGateProps) {
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-card-border bg-card shadow-md p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Final Year Study Planner</h1>
                <p className="text-sm text-muted-foreground">Your trusted revision companion</p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                { icon: CalendarDays, text: "Animated month calendar with auto-scheduled topics" },
                { icon: BookOpen, text: "Manage topics across 14 clinical subjects" },
                { icon: FileDown, text: "Export to CSV or ZIP for Notion, Anki & more" },
                { icon: ShieldCheck, text: "Secure cloud sync — your data follows you" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-accent flex items-center justify-center">
                    <Icon className="h-3 w-3 text-accent-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>

            <Button className="w-full" size="lg" onClick={auth.login} data-testid="button-signin">
              Sign In to Continue
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Uses your Replit account — no separate registration needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
