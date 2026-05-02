import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Settings, BarChart3, Flame, Download, RefreshCw,
  ChevronDown, ChevronUp, X, AlertTriangle, ArrowRight, FolderPlus,
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
  customGroupsToSubjectGroups, CUSTOM_COLOR_STYLES,
  getOverdueItems, shiftTopicsToDate, getShiftDismissedDate, setShiftDismissedDate,
  type Status, type ScheduledItem,
} from "@/lib/study-planner/topics";
import { CalendarView } from "@/components/study-planner/calendar-view";
import { ShiftDialog } from "@/components/study-planner/shift-dialog";

function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }

const HARDCODED_SUBJECTS = [
  { emoji: "🩺", label: "Sub Medicine",  color: "blue",   path: "/sub-medicine",  keys: ["dermatology","family","emergency","forensic","radiology"] },
  { emoji: "🧠", label: "Psychiatric",   color: "purple", path: "/psychiatric",   keys: ["psychiatric"] },
  { emoji: "🔬", label: "Sub Surgery",   color: "orange", path: "/sub-surgery",   keys: ["ent","ophthalmology","orthopedic","neurosurgery","urology"] },
  { emoji: "👶", label: "Pediatric",     color: "green",  path: "/pediatric",     keys: ["pediatric"] },
  { emoji: "🌸", label: "Gynecology",    color: "pink",   path: "/gynecology",    keys: ["gynecology","obstetric"] },
];

function Accordion({ title, icon, defaultOpen = false, badge, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/30 transition-colors">
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
  const { topicsMap, upsertTopics, customGroups, isLoading } = useStudyTopicsContext();

  const [startDate, setStartDateState] = useState(() => getScheduleStartDate());
  const [endDate, setEndDateState] = useState(() => getScheduleEndDate(getScheduleStartDate()));
  const [spacing, setSpacingState] = useState(() => getSpacingDays());
  const [weightByDiff, setWeightByDiffState] = useState(() => getWeightByDifficulty());
  const [calendarKey, setCalendarKey] = useState(0);
  const [activityTick, setActivityTick] = useState(0);
  const [backupDismissed, setBackupDismissed] = useState(false);
  const [exportProgress, setExportProgress] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [overdueItems, setOverdueItems] = useState<ScheduledItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All groups: hardcoded + custom
  const allGroups = useMemo(
    () => [...ALL_SUBJECT_GROUPS, ...customGroupsToSubjectGroups(customGroups)],
    [customGroups],
  );

  // Activity log refresh
  useEffect(() => {
    const handler = () => setActivityTick(t => t + 1);
    window.addEventListener("sp-study-activity-updated", handler);
    return () => window.removeEventListener("sp-study-activity-updated", handler);
  }, []);

  // Check for overdue topics after data loads
  useEffect(() => {
    if (isLoading) return;
    const dismissed = getShiftDismissedDate();
    const today = isoDate(new Date());
    if (dismissed === today) return;
    const overdue = getOverdueItems(allGroups, topicsMap, startDate, endDate, spacing, weightByDiff);
    if (overdue.length > 0) {
      setOverdueItems(overdue);
      setShowShiftDialog(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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

  const handleStartDate = (v: string | Date) => {
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return;
    setScheduleStartDate(d); setStartDateState(d); setCalendarKey(k => k + 1);
  };
  const handleEndDate = (v: string | Date) => {
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return;
    setScheduleEndDate(d); setEndDateState(d); setCalendarKey(k => k + 1);
  };
  const handleSpacing = (v: number) => { setSpacingDays(v); setSpacingState(v); setCalendarKey(k => k + 1); };
  const handleWeight  = (v: boolean) => { setWeightByDifficulty(v); setWeightByDiffState(v); setCalendarKey(k => k + 1); };

  // Heatmap
  const heatmapCells = useMemo(() => {
    const cells: { date: Date; active: boolean; future: boolean; today: boolean }[] = [];
    const today = new Date();
    const base = new Date(today);
    const day = base.getDay();
    base.setDate(base.getDate() + (day === 0 ? -6 : -(day - 1)) - 7 * 7);
    for (let i = 0; i < 56; i++) {
      const d = new Date(base); d.setDate(d.getDate() + i);
      const key = isoDate(d);
      cells.push({ date: d, active: !!activityLog[key], future: d > today, today: key === isoDate(today) });
    }
    return cells;
  }, [activityLog]);
  const activeDays = heatmapCells.filter(c => c.active).length;

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

  // Hardcoded subject stats
  const hardcodedStats = useMemo(() => HARDCODED_SUBJECTS.map(sc => {
    const topics = sc.keys.flatMap(k => topicsMap[k] ?? []);
    const done = topics.filter(t => t.status === "Done" || t.status === "Revised").length;
    const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
    const byStatus: Record<Status, number> = { "Not Started": 0, "In Progress": 0, "Done": 0, "Revised": 0 };
    topics.forEach(t => byStatus[t.status]++);
    const timeLeft = topics.filter(t => t.status === "Not Started" || t.status === "In Progress")
      .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
    return { ...sc, topics, done, pct, byStatus, timeLeft };
  }), [topicsMap]);

  // Custom group stats
  const customStats = useMemo(() => customGroups.map(g => {
    const topics = g.subjects.flatMap(s => topicsMap[s.storageKey] ?? []);
    const done = topics.filter(t => t.status === "Done" || t.status === "Revised").length;
    const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
    const navPath = g.subjects.length === 0 ? "/manage-subjects"
      : g.subjects.length === 1 ? `/subject/${g.subjects[0].storageKey}`
      : `/custom/${g.id}`;
    const styles = CUSTOM_COLOR_STYLES[g.color] ?? CUSTOM_COLOR_STYLES.blue;
    return { ...g, topics, done, pct, navPath, styles };
  }), [customGroups, topicsMap]);

  // All stats for dashboard breakdown
  const allStats = useMemo(() => [
    ...hardcodedStats.map(s => ({ emoji: s.emoji, label: s.label, path: s.path, topics: s.topics, pct: s.pct, byStatus: s.byStatus, timeLeft: s.timeLeft, colorText: CUSTOM_COLOR_STYLES[s.color]?.text ?? "text-primary" })),
    ...customStats.map(s => ({ emoji: s.emoji, label: s.label, path: s.navPath, topics: s.topics, pct: s.pct, byStatus: { "Not Started": s.topics.filter(t => t.status === "Not Started").length, "In Progress": s.topics.filter(t => t.status === "In Progress").length, "Done": s.topics.filter(t => t.status === "Done").length, "Revised": s.topics.filter(t => t.status === "Revised").length } as Record<Status, number>, timeLeft: s.topics.filter(t => t.status === "Not Started" || t.status === "In Progress").reduce((acc, t) => acc + (t.estimatedMinutes ?? 0), 0), colorText: s.styles.text })),
  ], [hardcodedStats, customStats]);

  const handleExportCSV = async () => {
    setExportProgress(true);
    const csv = generateAllSubjectsCSV(allGroups, topicsMap, endDate, spacing, weightByDiff);
    downloadCSV(csv, "study-planner-all.csv");
    setExportProgress(false);
  };
  const handleExportZip = async () => {
    setExportProgress(true);
    const files = generateSeparatedCSVs(allGroups, topicsMap, endDate, spacing, weightByDiff);
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

  return (
    <div className="sp-root min-h-screen bg-background pb-24">
      {/* Shift dialog */}
      {showShiftDialog && (
        <ShiftDialog
          items={overdueItems}
          onShift={(items, targetDate) => {
            shiftTopicsToDate(items.map(i => i.topic.id), targetDate);
            setCalendarKey(k => k + 1);
            setShowShiftDialog(false);
          }}
          onDismiss={() => {
            setShiftDismissedDate(isoDate(new Date()));
            setShowShiftDialog(false);
          }}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Study Planner</span>
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
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300"
              onClick={() => exportBackup(allGroups, topicsMap)}>
              Download Now
            </Button>
            <button onClick={() => setBackupDismissed(true)} className="text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dashboard */}
        <Accordion title="Dashboard" defaultOpen icon={<BarChart3 className="h-4 w-4 text-primary" />}
          badge={streak > 0 ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500 mr-1">
              🔥 {streak} days
            </span>
          ) : undefined}>
          {/* Schedule controls */}
          <div className="grid grid-cols-2 gap-3 mb-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" className="h-8 text-xs" value={isoDate(startDate)}
                onChange={e => handleStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" className="h-8 text-xs" value={isoDate(endDate)}
                onChange={e => handleEndDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Spacing (days)</Label>
              <Input type="number" min={1} max={365} className="h-8 text-xs" value={spacing}
                onChange={e => handleSpacing(parseInt(e.target.value) || 14)} />
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
                  <div className="grid grid-cols-8 mb-0.5">
                    {Array.from({ length: 8 }, (_, wi) => {
                      const lbl = weekMonthLabels.find(l => l.wi === wi);
                      return <div key={wi} className="text-[9px] text-muted-foreground text-center">{lbl?.label ?? ""}</div>;
                    })}
                  </div>
                  <div className="flex gap-0.5">
                    <div className="flex flex-col gap-0.5 mr-0.5">
                      {["M","","W","","F","","S"].map((d, i) => (
                        <div key={i} className="h-3 flex items-center text-[8px] text-muted-foreground w-3">{d}</div>
                      ))}
                    </div>
                    {Array.from({ length: 8 }, (_, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {heatmapCells.slice(wi * 7, wi * 7 + 7).map((cell, di) => (
                          <div key={di} title={isoDate(cell.date)}
                            className={`h-3 w-3 rounded-sm transition-colors ${cell.today ? "ring-1 ring-primary ring-offset-1" : ""}
                              ${cell.future ? "bg-muted/40" : cell.active ? "bg-green-500" : "bg-muted"}`} />
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
                  <span className="text-xs font-bold text-green-600">
                    {totalTopics ? Math.round((completed / totalTopics) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${totalTopics ? (completed / totalTopics) * 100 : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(["Not Started","In Progress","Done","Revised"] as Status[]).map(s => {
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
                {allStats.filter(s => s.topics.length > 0).map(s => (
                  <div key={s.label} className="rounded-lg border bg-background p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{s.emoji}</span>
                      <span className="text-xs font-semibold flex-1">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.topics.length} topics</span>
                      <button onClick={() => nav(s.path)}
                        className={`text-[10px] font-medium ${s.colorText} flex items-center gap-0.5`}>
                        Go <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                      <span className="text-[10px] font-bold">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${s.topics.length ? (s.byStatus["Done"] / s.topics.length) * 100 : 0}%` }} />
                      <div className="h-full bg-green-400 transition-all"
                        style={{ width: `${s.topics.length ? (s.byStatus["Revised"] / s.topics.length) * 100 : 0}%` }} />
                      <div className="h-full bg-amber-400 transition-all"
                        style={{ width: `${s.topics.length ? (s.byStatus["In Progress"] / s.topics.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(Object.entries(s.byStatus) as [Status, number][]).filter(([, c]) => c > 0).map(([st, c]) => (
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

        {/* Export */}
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

        {/* Backup */}
        <Accordion title="Backup & Restore" icon={<RefreshCw className="h-4 w-4 text-green-500" />}>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs"
                onClick={() => exportBackup(allGroups, topicsMap)}>
                Download Backup
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs"
                onClick={() => fileInputRef.current?.click()}>
                Restore from Backup
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importMsg && (
              <div className={`rounded-lg px-3 py-2 text-xs font-medium ${importMsg.ok
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
                {importMsg.msg}
              </div>
            )}
          </div>
        </Accordion>

        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Subjects</h2>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => nav("/manage-subjects")}>
              <FolderPlus className="h-3.5 w-3.5" /> Manage
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Hardcoded subjects */}
            {hardcodedStats.map(s => {
              const styles = CUSTOM_COLOR_STYLES[s.color] ?? CUSTOM_COLOR_STYLES.blue;
              return (
                <button key={s.label} onClick={() => nav(s.path)}
                  className={`rounded-xl border p-3 text-left hover:shadow-sm transition-all ${styles.card}`}>
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className={`text-sm font-semibold ${styles.text}`}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.topics.length} topics · {s.pct}%</div>
                  <div className="h-1 w-full bg-white/50 dark:bg-black/20 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${styles.bar}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </button>
              );
            })}

            {/* Custom subjects */}
            {customStats.map(g => (
              <button key={g.id} onClick={() => nav(g.navPath)}
                className={`rounded-xl border p-3 text-left hover:shadow-sm transition-all ${g.styles.card}`}>
                <div className="text-xl mb-1">{g.emoji}</div>
                <div className={`text-sm font-semibold ${g.styles.text}`}>{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.topics.length} topics · {g.pct}%</div>
                <div className="h-1 w-full bg-white/50 dark:bg-black/20 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${g.styles.bar}`} style={{ width: `${g.pct}%` }} />
                </div>
              </button>
            ))}

            {/* Add subject shortcut */}
            <button onClick={() => nav("/manage-subjects")}
              className="rounded-xl border border-dashed p-3 text-left hover:bg-accent/50 transition-all flex flex-col items-center justify-center gap-1 min-h-[90px]">
              <FolderPlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Add Subject</span>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Study Calendar</h2>
          <div className="rounded-xl border bg-card p-4">
            <CalendarView
              key={calendarKey}
              groups={allGroups}
              topicsMap={topicsMap}
              startDate={startDate}
              endDate={endDate}
              spacing={spacing}
              weightByDifficulty={weightByDiff}
              onStartDateChange={handleStartDate}
              onEndDateChange={handleEndDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
