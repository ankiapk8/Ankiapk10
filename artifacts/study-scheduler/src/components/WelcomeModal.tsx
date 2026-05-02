import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Calendar, BookOpen, MousePointerClick, FileDown, Stethoscope } from "lucide-react";
import type { AuthUser } from "@/hooks/use-auth";

interface WelcomeModalProps {
  user: AuthUser;
}

function CalendarPreview() {
  const days = ["S","M","T","W","T","F","S"];
  const chips = [
    { day: 3, label: "Psoriasis", color: "bg-red-400 text-white" },
    { day: 3, label: "Otitis", color: "bg-amber-400 text-white" },
    { day: 7, label: "Fractures", color: "bg-blue-400 text-white" },
    { day: 10, label: "Appendicitis", color: "bg-red-400 text-white" },
    { day: 14, label: "Prenatal", color: "bg-amber-400 text-white" },
    { day: 14, label: "Glaucoma", color: "bg-blue-400 text-white" },
    { day: 18, label: "Psoriasis", color: "bg-red-400 text-white" },
    { day: 21, label: "Fractures", color: "bg-blue-400 text-white" },
    { day: 21, label: "+2 more", color: "bg-muted text-muted-foreground text-[9px]" },
  ];
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3;
    return { day: day >= 1 && day <= 31 ? day : null };
  });
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden select-none">
      <div className="bg-primary/10 px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">May 2026</span>
        <div className="flex gap-1">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-4 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-7 px-1 pt-1">
        {days.map((d) => (
          <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">{d}</div>
        ))}
        {cells.map((c, i) => {
          const dayChips = chips.filter((ch) => ch.day === c.day);
          return (
            <div key={i} className={`min-h-[28px] border-t border-l border-border/50 p-0.5 ${i % 7 === 6 ? "border-r border-border/50" : ""} ${i >= 28 ? "border-b border-border/50" : ""}`}>
              {c.day && (
                <>
                  <span className={`text-[9px] block mb-0.5 ${c.day === 14 ? "text-primary font-bold" : "text-foreground"}`}>{c.day}</span>
                  {dayChips.map((ch, ci) => (
                    <div key={ci} className={`text-[8px] rounded px-0.5 truncate mb-0.5 leading-tight ${ch.color}`}>{ch.label}</div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubjectsPreview() {
  const subjects = [
    { name: "Sub Medicine", sub: "Derm, Family, Emergency…", count: 12, pct: 40 },
    { name: "Sub Surgery", sub: "ENT, Ophthalmology, Ortho…", count: 8, pct: 25 },
    { name: "Psychiatric", sub: "Psychiatry topics", count: 6, pct: 66 },
    { name: "Pediatric", sub: "Pediatrics topics", count: 9, pct: 11 },
    { name: "Gynecology", sub: "Gynecology, Obstetric", count: 5, pct: 80 },
  ];
  return (
    <div className="space-y-1.5 select-none">
      {subjects.map(({ name, sub, count, pct }) => (
        <div key={name} className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-3 hover:border-primary transition-colors">
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Stethoscope className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground truncate">{name}</p>
              <span className="text-[10px] text-primary font-medium shrink-0 ml-2">{count} topics</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
            <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DayDetailPreview() {
  const statuses = ["Not Started", "In Progress", "Done", "Revised"];
  const priorities = ["High", "Medium", "Low"];
  return (
    <div className="space-y-2 select-none">
      <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground font-medium">
        Wed, May 14 — 3 topics scheduled
      </div>
      <div className="rounded-xl border border-card-border bg-card p-3 space-y-3">
        <div>
          <p className="text-xs font-semibold text-foreground">Psoriasis</p>
          <p className="text-[10px] text-muted-foreground">Dermatology · Sub Medicine · 1st Study</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Files", "Video", "Amboss"].map((l) => (
            <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{l}</span>
          ))}
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Priority</p>
          <div className="flex gap-1">
            {priorities.map((p) => (
              <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${p === "High" ? "bg-red-500 text-white border-red-500" : "border-border text-muted-foreground"}`}>{p}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Status</p>
          <div className="flex flex-wrap gap-1">
            {statuses.map((s) => (
              <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer ${s === "In Progress" ? "bg-amber-100 text-amber-700 border-transparent" : "border-border text-muted-foreground"}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportPreview() {
  return (
    <div className="space-y-2 select-none">
      <div className="rounded-xl border border-card-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileDown className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Export CSV</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Export all scheduled topics with First & Second Study Dates — ready for Notion, Excel, Anki.</p>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-medium">All in One File</span>
          <span className="text-[10px] px-2 py-1 rounded-lg border border-border text-muted-foreground">ZIP by Subject</span>
        </div>
      </div>
      <div className="rounded-xl border border-card-border bg-card p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Backup & Restore</p>
        <p className="text-[10px] text-muted-foreground mb-2">Download a full JSON snapshot of all topics and your schedule. Restore from any previous backup.</p>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-medium">Download Backup</span>
          <span className="text-[10px] px-2 py-1 rounded-lg border border-border text-muted-foreground">Restore File</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="space-y-2 select-none">
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Total", value: "40", color: "text-foreground" },
          { label: "High Pri.", value: "12", color: "text-red-600 dark:text-red-400" },
          { label: "Completed", value: "18", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Not Started", value: "14", color: "text-slate-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg bg-muted/60 border border-card-border p-2 text-center">
            <p className="text-[9px] text-muted-foreground">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Overall Progress — 45%</p>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-slate-300 dark:bg-slate-600 h-full" style={{ width: "35%" }} />
          <div className="bg-amber-400 h-full" style={{ width: "10%" }} />
          <div className="bg-emerald-500 h-full" style={{ width: "30%" }} />
          <div className="bg-sky-400 h-full" style={{ width: "15%" }} />
        </div>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          {[
            { label: "Not Started", dot: "bg-slate-300 dark:bg-slate-600" },
            { label: "In Progress", dot: "bg-amber-400" },
            { label: "Done", dot: "bg-emerald-500" },
            { label: "Revised", dot: "bg-sky-400" },
          ].map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {[
          { label: "Dermatology", pct: 60 },
          { label: "Orthopedic", pct: 33 },
          { label: "Psychiatric", pct: 80 },
        ].map(({ label, pct }) => (
          <div key={label}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] text-foreground">{label}</span>
              <span className="text-[9px] text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDES = [
  {
    icon: BookOpen,
    title: "Welcome to your planner",
    description: "Track all 14 clinical subjects across 5 groups. Topics are synced to your account — access them from any device.",
    preview: <SubjectsPreview />,
  },
  {
    icon: Calendar,
    title: "Smart monthly calendar",
    description: "Topics are automatically distributed across remaining days of the month. Family Medicine is always scheduled first, then sorted by priority.",
    preview: <CalendarPreview />,
  },
  {
    icon: MousePointerClick,
    title: "Update topics in one click",
    description: "Click any day on the calendar to open a detail panel. Toggle priority (High / Medium / Low) and status (Not Started → Done) directly — saves instantly.",
    preview: <DayDetailPreview />,
  },
  {
    icon: Stethoscope,
    title: "Dashboard overview",
    description: "See total topics, high priority count, completion percentage, and per-subject progress bars — all updated in real time as you study.",
    preview: <DashboardPreview />,
  },
  {
    icon: FileDown,
    title: "Export & Backup",
    description: "Export all topics to a single CSV or a ZIP of per-subject files — ready for Notion, Excel, or Anki. Download full JSON backups and restore them anytime.",
    preview: <ExportPreview />,
  },
];

export function WelcomeModal({ user }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const key = `welcomed-${user.id}`;
    if (!localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [user.id]);

  function handleClose() {
    localStorage.setItem(`welcomed-${user.id}`, "1");
    setOpen(false);
    setStep(0);
  }

  function handlePrev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    if (step === SLIDES.length - 1) {
      handleClose();
    } else {
      setStep((s) => s + 1);
    }
  }

  const name = user.firstName ?? user.email?.split("@")[0] ?? "there";
  const slide = SLIDES[step];
  const SlideIcon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden gap-0"
        data-testid="dialog-welcome"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col" style={{ minHeight: "520px" }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <SlideIcon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {step === 0 ? `Welcome, ${name}!` : `Step ${step} of ${SLIDES.length - 1}`}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-welcome-dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-3 shrink-0">
            <h2 className="text-base font-semibold text-foreground leading-snug">{slide.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{slide.description}</p>
          </div>

          <div className="px-5 flex-1 overflow-hidden">
            <div
              key={step}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {slide.preview}
            </div>
          </div>

          <div className="px-5 pt-4 pb-5 flex items-center justify-between shrink-0 border-t border-border mt-3">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  data-testid={`button-welcome-dot-${i}`}
                  className={`rounded-full transition-all duration-200 ${
                    i === step
                      ? "w-5 h-2 bg-primary"
                      : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  data-testid="button-welcome-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                data-testid="button-welcome-next"
              >
                {isLast ? "Get started" : "Next"}
                {!isLast && <ChevronRight className="h-4 w-4 ml-0.5" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
