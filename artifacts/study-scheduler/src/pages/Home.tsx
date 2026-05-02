import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGetAllTopics, getGetAllTopicsQueryKey, useUpsertTopics } from "@workspace/api-client-react";
import {
  ChevronDown, LogOut, LayoutDashboard, FileDown, Save, Upload,
  Stethoscope, Scissors, Baby, Brain, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarView } from "@/components/CalendarView";
import { DashboardStats } from "@/components/DashboardStats";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useLocalStorageMigration } from "@/hooks/use-local-storage-migration";
import {
  scheduleTopics, getScheduleStartDate, generateAllSubjectsCSV, generateSeparatedCSVs,
  downloadCSV, downloadZip, exportBackup, importBackup, type Topic, ALL_SUBJECT_GROUPS
} from "@/lib/topics";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/hooks/use-auth";

interface HomeProps {
  user: AuthUser;
  onLogout: () => void;
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        data-testid={`button-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-border">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const SUBJECT_CARDS = [
  { label: "Sub Medicine", path: "/sub-medicine", icon: Stethoscope, description: "Derm, Family, Emergency, Forensic, Radiology" },
  { label: "Psychiatric", path: "/psychiatric", icon: Brain, description: "Psychiatry topics" },
  { label: "Sub Surgery", path: "/sub-surgery", icon: Scissors, description: "ENT, Ophthalmology, Ortho, Neuro, Urology" },
  { label: "Pediatric", path: "/pediatric", icon: Baby, description: "Pediatrics topics" },
  { label: "Gynecology", path: "/gynecology", icon: Activity, description: "Gynecology, Obstetric" },
];

export function Home({ user, onLogout }: HomeProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upsertTopics = useUpsertTopics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTopicsData = useGetAllTopics();
  const allTopics: Record<string, Topic[]> = (allTopicsData as { topics?: Record<string, Topic[]> })?.topics ?? {};

  useLocalStorageMigration(user);

  const [startDate, setStartDate] = useState(getScheduleStartDate);
  const [startDateInput, setStartDateInput] = useState(() => {
    const d = getScheduleStartDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const scheduledItems = scheduleTopics(allTopics, startDate);
  const totalTopics = Object.values(allTopics).flat().length;

  const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setStartDateInput(val);
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      setStartDate(d);
      localStorage.setItem("schedule-start-date", val);
    }
  }

  function handleExportAll() {
    if (scheduledItems.length === 0) { toast({ title: "No topics to export" }); return; }
    downloadCSV(generateAllSubjectsCSV(scheduledItems), "study-planner-all.csv");
  }

  async function handleExportZip() {
    if (scheduledItems.length === 0) { toast({ title: "No topics to export" }); return; }
    await downloadZip(generateSeparatedCSVs(scheduledItems), "study-planner.zip");
  }

  function handleBackup() {
    exportBackup(allTopics);
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = importBackup(text);
    if (!result.ok || !result.data) {
      toast({ title: result.message, variant: "destructive" });
      return;
    }
    const { topics, scheduleStartDate } = result.data;
    if (scheduleStartDate) {
      localStorage.setItem("schedule-start-date", scheduleStartDate);
      const d = new Date(scheduleStartDate);
      if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); setStartDate(d); setStartDateInput(scheduleStartDate); }
    }
    const uploads = ALL_SUBJECT_GROUPS.map((g) => {
      const t = topics[g.storageKey];
      if (!t || t.length === 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        upsertTopics.mutate({ storageKey: g.storageKey, data: { topics: t } }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
    });
    await Promise.all(uploads);
    queryClient.invalidateQueries({ queryKey: getGetAllTopicsQueryKey() });
    toast({ title: "Backup restored successfully" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const displayName = user.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user.email?.split("@")[0] ?? "Student";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Final Year Study Planner</p>
              <p className="text-xs text-muted-foreground">
                {startDateInput} – {endOfMonth.getFullYear()}-{String(endOfMonth.getMonth() + 1).padStart(2, "0")}-{String(endOfMonth.getDate()).padStart(2, "0")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground" data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <WelcomeModal user={user} />

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label htmlFor="schedule-start" className="text-xs text-muted-foreground mb-1 block">Schedule Start Date</label>
            <Input
              id="schedule-start"
              type="date"
              value={startDateInput}
              onChange={handleDateChange}
              className="max-w-[180px]"
              data-testid="input-schedule-start"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Topics scheduled</p>
            <p className="text-2xl font-bold text-primary">{totalTopics}</p>
          </div>
        </div>

        <CollapsibleSection title="Dashboard" icon={LayoutDashboard} defaultOpen={totalTopics > 0}>
          <DashboardStats allTopics={allTopics} />
        </CollapsibleSection>

        <CollapsibleSection title="Export CSV" icon={FileDown}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Export all scheduled topics to CSV for Notion, Excel, or Anki import.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleExportAll} data-testid="button-export-all">
                <FileDown className="h-4 w-4 mr-1.5" /> Export All in One File
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportZip} data-testid="button-export-zip">
                <FileDown className="h-4 w-4 mr-1.5" /> Export as ZIP (Separate Files)
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Backup & Restore" icon={Save}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Download a full backup of your topics and schedule. Restore from a previous backup file.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleBackup} data-testid="button-backup">
                <Save className="h-4 w-4 mr-1.5" /> Download Backup
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-restore">
                <Upload className="h-4 w-4 mr-1.5" /> Choose Backup File
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} data-testid="input-backup-file" />
            </div>
          </div>
        </CollapsibleSection>

        <div className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Calendar</h2>
          <CalendarView items={scheduledItems} allTopics={allTopics} startDate={startDate} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUBJECT_CARDS.map(({ label, path, icon: Icon, description }) => {
              const subKeys = ALL_SUBJECT_GROUPS.filter((g) => g.parentLabel === label).map((g) => g.storageKey);
              const count = subKeys.reduce((sum, k) => sum + (allTopics[k]?.length ?? 0), 0);
              return (
                <Link key={label} href={path}>
                  <div
                    className="rounded-xl border border-card-border bg-card p-4 cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors flex items-start gap-3"
                    data-testid={`card-subject-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
                      <p className="text-xs text-primary mt-1 font-medium">{count} {count === 1 ? "topic" : "topics"}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
