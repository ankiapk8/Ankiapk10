import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Sparkles } from "lucide-react";
import type { AuthUser } from "@/hooks/use-auth";

interface WelcomeModalProps {
  user: AuthUser;
}

export function WelcomeModal({ user }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `welcomed-${user.id}`;
    if (!localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [user.id]);

  function handleClose() {
    localStorage.setItem(`welcomed-${user.id}`, "1");
    setOpen(false);
  }

  const name = user.firstName ?? user.email?.split("@")[0] ?? "there";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm" data-testid="dialog-welcome">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Welcome, {name}!</DialogTitle>
          </div>
          <DialogDescription>
            Your final year study planner is ready. Here's how to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex gap-3 rounded-lg bg-accent/50 p-3">
            <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Set your schedule start date</p>
              <p className="text-muted-foreground text-xs mt-0.5">Topics will be auto-distributed across the remaining days of the month.</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1.5 px-1">
            <p>1. Pick a subject card to add your topics.</p>
            <p>2. Topics appear on the calendar automatically.</p>
            <p>3. Click any day to update status & priority inline.</p>
            <p>4. Export to CSV or back up anytime from the home screen.</p>
          </div>
        </div>
        <Button className="w-full mt-2" onClick={handleClose} data-testid="button-welcome-close">
          Let's get started
        </Button>
      </DialogContent>
    </Dialog>
  );
}
