import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Settings, BarChart3, Flame, Download, RefreshCw,
  ChevronDown, ChevronUp, X, AlertTriangle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStudyTopicsContext } from "@/context/study-topics-context";
import {
  ALL_SUBJECT_GROUPS, computeStreak, getStudyActivityLog,
  getScheduleStartDate, setScheduleStartDate,
  getScheduleEndDate, setScheduleEndDate,
  getSpacingDays, setSpacingDays,
  getWeightByDifficulty, setWeightByDifficulty,
  exportBackup, importBackup, isoDate,
  generateAllSubjectsCSV, generateSeparatedCSVs, downloadCSV, downloadZip,
  getLastBackupAt, formatMinutes,
  type Status,
} from "@/lib/study-planner/topics";
import { CalendarView } from "@/components/study-planner/calendar-view";

function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }

const SUBJECTS_CONFIG = [
  { emoji: "🩺", label: "Sub Medicine",  color: "blue",   path: "/sub-medicine",  keys: ["dermatology","family","emergency","forensic","radiology"] },
  { emoji: "🧠", label: "Psychiatric",   color: "purple", path: "/psychiatric",   keys: ["psychiatric"] },
  { emoji: "🔬", label: "Sub Surgery",   color: "orange", path: "/sub-surgery",   keys: ["ent","ophthalmology","orthopedic","neurosurgery","urology"] },
  { emoji: "👶", label: "Pediatric",     color: "green",  path: "/pediatric",     keys: ["pediatric"] },
  { emoji: "🌸", label: "Gynecology",    color: "pink",   path: "/gynecology",    keys: ["gynecology","obstetric"] },
];

const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
  purple: "border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800",
  orange: "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800",
  green:  "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
  pink:   "border-pink-200 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800",
};

const COLOR_BAR: Record<string, string> = {
  blue: "bg-blue-500", purple: "bg-purple-500", orange: "bg-orange-500", green: "bg-green-500", pink: "bg-pink-500",
};

const COLOR_TEXT: Record<string, string> = {
  blue: "text-blue-700 dark:text-blue-400", purple: "text-purple-700 dark:text-purple-400",
  orange: "text-orange-700 dark:text-orange-400", green: "text-green-700 dark:text-green-400",
  pink: "text-pink-700 dark:text-pink-400",
};

function Accordion({ title, icon, defaultOpen = false, badge, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        {icon}
        <span className="font-semibold text-sm flex-1">{title}</span>
        {badge}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t">{children}</div>}
    </div>
  );
}

export default function SPHome() {
  const [, nav] = useLocation();
  const { topicsMap, upsertTopics } = useStudyTopicsContext();

  const [startDate, setStartDateState] = useState(() => getScheduleStartDate());
  const [endDate, setEndDateState] = useState(() => getScheduleEndDate(getScheduleStartDate()));
  const [spacing, setSpacingState] = useState(() => getSpacingDays());
  const [weightByDiff, setWeightByDiffState] = useState(() => getWeightByDifficulty());
  const [calendarKey, setCalendarKey] = useState(0);
  const [activityTick, setActivityTick] = useState(0);
  const [backupDismissed, setBackupDismissed] = useState(false);
  const [exportProgress, setExportProgress] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activity log re-renders
  useEffect(() => {
    const handler = () => setActivityTick(t => t + 1);
    window.addEventListener("sp-study-activity-updated", handler);
    return () => window.removeEventListener("sp-study-activity-updated", handler);
  }, []);

  const allTopics = useMemo(() => Object.values(topicsMap).flat(), [topicsMap]);
  const totalTopics = allTopics.length;
  const highPriority = allTopics.filter(t => t.priority === "High").length;
  const completed = allTopics.filter(t => t.status === "Done" || t.status === "Revised").length;
  const timeRemainingMins = allTopics
    .filter(t => t.status === "Not Started" || t.status === "In Progress")
    .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
  const streak = useMemo(() => computeStreak(), [activityTick]);
  const activityLog = useMemo(() => getStudyActivityLog(), [activityTick]);
  const displayName = lsGet("sp-settings-display-name") || "Student";

  const showBackupReminder = useMemo(() => {
    if (backupDismissed || totalTopics === 0) return false;
    const last = getLastBackupAt();
    if (!last) return true;
    return (Date.now() - last.getTime()) > 7 * 86400000;
  }, [totalTopics, backupDismissed, activityTick]);

  // Schedule update helpers
  const handleStartDate = (v: string) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return;
    setScheduleStartDate(d); setStartDateState(d); setCalendarKey(k => k + 1);
  };
  const handleEndDate = (v: string) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return;
    setScheduleEndDate(d); setEndDateState(d); setCalendarKey(k => k + 1);
  };
  const handleSpacing = (v: number) => {
    setSpacingDays(v); setSpacingState(v); setCalendarKey(k => k + 1);
  };
  const handleWeight = (v: boolean) => {
    setWeightByDifficulty(v); setWeightByDiffState(v); setCalendarKey(k => k + 1);
  };

  // 8-week heatmap
  const heatmapCells = useMemo(() => {
    const cells: { date: Date; active: boolean; future: boolean; today: boolean }[] = [];
    const today = new Date();
    // Start from Monday 8 weeks ago
    const base = new Date(today);
    const day = base.getDay();
    const mondayOffset = day === 0 ? -6 : -(day - 1);
    base.setDate(base.getDate() + mondayOffset - 7 * 7);
    for (let i = 0; i < 56; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const key = isoDate(d);
      cells.push({
        date: d,
        active: !!activityLog[key],
        future: d > today,
        today: key === isoDate(today),
      });
    }
    return cells;
  }, [activityLog]);

  const activeDays = heatmapCells.filter(c => c.active).length;

  // Per-subject stats
  const subjectStats = useMemo(() => {
    return SUBJECTS_CONFIG.map(sc => {
      const topics = sc.keys.flatMap(k => topicsMap[k] ?? []);
      const done = topics.filter(t => t.status === "Done" || t.status === "Revised").length;
      const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
      const byStatus: Record<Status, number> = { "Not Started": 0, "In Progress": 0, "Done": 0, "Revised": 0 };
      topics.forEach(t => byStatus[t.status]++);
      const timeLeft = topics.filter(t => t.status === "Not Started" || t.status === "In Progress")
        .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
      return { ...sc, topics, done, pct, byStatus, timeLeft };
    });
  }, [topicsMap]);

  const handleExportCSV = async () => {
    setExportProgress(true);
    const csv = generateAllSubjectsCSV(ALL_SUBJECT_GROUPS, topicsMap, endDate, spacing, weightByDiff);
    downloadCSV(csv, "study-planner-all.csv");
    setExportProgress(false);
  };

  const handleExportZip = async () => {
    setExportProgress(true);
    const files = generateSeparatedCSVs(ALL_SUBJECT_GROUPS, topicsMap, endDate, spacing, weightByDiff);
    await downloadZip(files, "study-planner.zip");
    setExportProgress(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = importBackup(ev.target?.result as string);
      if (result.ok && result.data) {
        for (const [key, topics] of Object.entries(result.data.topics)) {
          upsertTopics(key, topics as typeof allTopics);
        }
        setImportMsg({ ok: true, msg: result.message });
      } else {
        setImportMsg({ ok: false, msg: result.message });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Week labels for heatmap
  const weekMonthLabels = useMemo(() => {
    return Array.from({ length: 8 }, (_, wi) => {
      const cell = heatmapCells[wi * 7];
      if (!cell) return null;
      const prev = wi > 0 ? heatmapCells[(wi - 1) * 7] : null;
      if (!prev || cell.date.getMonth() !== prev.date.getMonth()) {
        return { wi, label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][cell.date.getMonth()] };
      }
      return null;
    }).filter(Boolean) as { wi: number; label: string }[];
  }, [heatmapCells]);

  return (
    <div className="sp-root min-h-screen bg-background pb-24">
      {/* User bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Final Year Study Planner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Backup reminder */}
        {showBackupReminder && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 flex-1">It's been a while since your last backup.</p>
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300" onClick={() => exportBackup(ALL_SUBJECT_GROUPS, topicsMap)}>
              Download Now
            </Button>
            <button onClick={() => setBackupDismissed(true)} className="text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dashboard accordion */}
        <Accordion
          title="Dashboard"
          defaultOpen
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          badge={streak > 0 ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500 mr-1">
              🔥 {streak} days
            </span>
          ) : undefined}
        >
          {/* Schedule controls */}
          <div className="grid grid-cols-2 gap-3 mb-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" className="h-8 text-xs" value={isoDate(startDate)} onChange={e => handleStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" className="h-8 text-xs" value={isoDate(endDate)} onChange={e => handleEndDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Spacing (days)</Label>
              <Input type="number" min={1} max={365} className="h-8 text-xs" value={spacing} onChange={e => handleSpacing(parseInt(e.target.value) || 14)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hard topics first</Label>
              <div className="flex items-center gap-2 h-8">
                <Switch checked={weightByDiff} onCheckedChange={handleWeight} />
                <span className="text-xs text-muted-foreground">{weightByDiff ? "On" : "Off"}</span>
              </div>
            </div>
          </div>

          {totalTopics > 0 && (
            <div className="space-y-4">
              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Topics", value: totalTopics, color: "text-primary" },
                  { label: "High Priority", value: highPriority, color: "text-red-500" },
                  { label: "Completed", value: completed, color: "text-green-600" },
                  { label: "Time Left", value: formatMinutes(timeRemainingMins) || "0m", color: "text-blue-500" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border bg-background p-2 text-center">
                    <div className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 8-week heatmap */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">8-Week Activity</span>
                  <span className="text-[10px] text-muted-foreground">{activeDays} active days</span>
                </div>
                <div className="relative">
                  {/* Month labels */}
                  <div className="grid grid-cols-8 mb-0.5">
                    {Array.from({ length: 8 }, (_, wi) => {
                      const lbl = weekMonthLabels.find(l => l.wi === wi);
                      return <div key={wi} className="text-[9px] text-muted-foreground text-center">{lbl?.label ?? ""}</div>;
                    })}
                  </div>
                  <div className="flex gap-0.5">
                    {/* Day labels */}
                    <div className="flex flex-col gap-0.5 mr-0.5">
                      {["M","","W","","F","","S"].map((d, i) => (
                        <div key={i} className="h-3 flex items-center text-[8px] text-muted-foreground w-3">{d}</div>
                      ))}
                    </div>
                    {/* 8 columns of 7 */}
                    {Array.from({ length: 8 }, (_, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {heatmapCells.slice(wi * 7, wi * 7 + 7).map((cell, di) => (
                          <div
                            key={di}
                            title={isoDate(cell.date)}
                            className={`h-3 w-3 rounded-sm transition-colors ${
                              cell.today ? "ring-1 ring-primary ring-offset-1" : ""
                            } ${
                              cell.future ? "bg-muted/40" :
                              cell.active ? "bg-green-500" :
                              "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-muted" /><span className="text-[9px] text-muted-foreground">No activity</span></div>
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-green-500" /><span className="text-[9px] text-muted-foreground">Studied</span></div>
                  </div>
                </div>
              </div>

              {/* Overall progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Overall Progress</span>
                  <span className="text-xs font-bold text-green-600">{totalTopics ? Math.round((completed / totalTopics) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalTopics ? (completed / totalTopics) * 100 : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(["Not Started", "In Progress", "Done", "Revised"] as Status[]).map(s => {
                    const count = allTopics.filter(t => t.status === s).length;
                    return count > 0 ? (
                      <span key={s} className="text-[10px] text-muted-foreground">{s}: {count}</span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Per-subject breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold">Completion by Subject</span>
                {subjectStats.filter(s => s.topics.length > 0).map(s => (
                  <div key={s.label} className="rounded-lg border bg-background p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{s.emoji}</span>
                      <span className="text-xs font-semibold flex-1">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.topics.length} topics</span>
                      <button onClick={() => nav(s.path)} className={`text-[10px] font-medium ${COLOR_TEXT[s.color]} flex items-center gap-0.5`}>
                        Go <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                      <span className="text-[10px] font-bold">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${s.topics.length ? (s.byStatus["Done"] / s.topics.length) * 100 : 0}%` }} />
                      <div className="h-full bg-green-400 transition-all" style={{ width: `${s.topics.length ? (s.byStatus["Revised"] / s.topics.length) * 100 : 0}%` }} />
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${s.topics.length ? (s.byStatus["In Progress"] / s.topics.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(Object.entries(s.byStatus) as [Status, number][]).filter(([,c]) => c > 0).map(([st, c]) => (
                        <span key={st} className="text-[9px] text-muted-foreground">{st}: {c}</span>
                      ))}
                      {s.timeLeft > 0 && <span className="text-[9px] text-violet-500 ml-auto">⏱ {formatMinutes(s.timeLeft)} left</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Accordion>

        {/* Export & Download */}
        <Accordion title="Export & Download" icon={<Download className="h-4 w-4 text-yellow-500" />}>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleExportCSV} disabled={exportProgress}>
                {exportProgress ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Download Combined CSV"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleExportZip} disabled={exportProgress}>
                {exportProgress ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Download as ZIP"}
              </Button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">📖 Notion import guide</summary>
              <ol className="mt-2 space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Open Notion → click "+" → choose "Import" → CSV</li>
                <li>Select the downloaded CSV file</li>
                <li>Notion auto-detects columns including dates</li>
                <li>Set "First Study Date" and "Second Study Date" as Date properties</li>
              </ol>
            </details>
          </div>
        </Accordion>

        {/* Backup & Restore */}
        <Accordion title="Backup & Restore" icon={<RefreshCw className="h-4 w-4 text-green-500" />}>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => exportBackup(ALL_SUBJECT_GROUPS, topicsMap)}>
                Download Backup
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => fileInputRef.current?.click()}>
                Restore from Backup
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importMsg && (
              <div className={`rounded-lg px-3 py-2 text-xs font-medium ${importMsg.ok ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
                {importMsg.msg}
              </div>
            )}
          </div>
        </Accordion>

        {/* Subject cards */}
        <div data-subjects-section>
          <h2 className="text-sm font-semibold mb-3">Subjects</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjectStats.map(s => (
              <button
                key={s.label}
                onClick={() => nav(s.path)}
                className={`rounded-xl border p-3 text-left hover:shadow-sm transition-all ${COLOR_MAP[s.color]}`}
              >
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className={`text-sm font-semibold ${COLOR_TEXT[s.color]}`}>{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.topics.length} topics · {s.pct}%</div>
                <div className="h-1 w-full bg-white/50 dark:bg-black/20 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${COLOR_BAR[s.color]}`} style={{ width: `${s.pct}%` }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div data-calendar-section>
          <h2 className="text-sm font-semibold mb-3">Study Calendar</h2>
          <div className="rounded-xl border bg-card p-4">
            <CalendarView
              key={calendarKey}
              groups={ALL_SUBJECT_GROUPS}
              topicsMap={topicsMap}
              startDate={startDate}
              endDate={endDate}
              spacing={spacing}
              weightByDifficulty={weightByDiff}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
