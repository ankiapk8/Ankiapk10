import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AmbientOrbs } from "@/components/ambient-orbs";
import {
  BookOpen, Settings, BarChart3, Flame, Download, RefreshCw,
  ChevronDown, X, AlertTriangle, ArrowRight, FolderPlus,
  Target, CalendarDays, TrendingDown, TrendingUp, Printer,
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
  redistributeOverdueItems, getBurndownData, getTodayScheduledCount, computeSchedule,
  type Status, type ScheduledItem,
} from "@/lib/study-planner/topics";
import { CalendarView } from "@/components/study-planner/calendar-view";
import { ShiftDialog } from "@/components/study-planner/shift-dialog";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, Line, ComposedChart,
} from "recharts";

function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }

const HARDCODED_SUBJECTS = [
  { emoji: "🩺", label: "Sub Medicine",  color: "blue",   path: "/sub-medicine",  keys: ["dermatology","family","emergency","forensic","radiology"],   description: "Dermatology · Family · Emergency · Forensic · Radiology" },
  { emoji: "🧠", label: "Psychiatric",   color: "purple", path: "/psychiatric",   keys: ["psychiatric"],                                                description: "Mental health and psychiatry" },
  { emoji: "🔬", label: "Sub Surgery",   color: "orange", path: "/sub-surgery",   keys: ["ent","ophthalmology","orthopedic","neurosurgery","urology"],   description: "ENT · Ophthalmology · Orthopedic · Neurosurgery · Urology" },
  { emoji: "👶", label: "Pediatric",     color: "green",  path: "/pediatric",     keys: ["pediatric"],                                                  description: "Pediatrics and child health" },
  { emoji: "🌸", label: "Gynecology",    color: "pink",   path: "/gynecology",    keys: ["gynecology","obstetric"],                                     description: "Gynecology · Obstetric" },
];

function Accordion({ title, icon, defaultOpen = false, badge, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all relative overflow-hidden group ${open ? "bg-gradient-to-r from-muted/60 to-muted/20 border-b border-border/40" : "hover:bg-muted/30"}`}
      >
        {/* Shimmer on hover */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)" }}
        />
        {icon}
        <span className="font-semibold text-sm flex-1 relative">{title}</span>
        {badge}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="relative"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const completionPct = totalTopics ? Math.round((completed / totalTopics) * 100) : 0;
  const burndownData = useMemo(() => getBurndownData(totalTopics, startDate, endDate), [totalTopics, startDate, endDate]);
  const lastPastBurndownPoint = useMemo(() => [...burndownData].reverse().find(pt => !pt.isFuture), [burndownData]);
  const lastActualPoint = useMemo(() => [...burndownData].reverse().find(pt => pt.actual !== undefined), [burndownData]);
  const onTrack = lastActualPoint
    ? (lastActualPoint.actual ?? 0) >= lastActualPoint.planned
    : completionPct >= (lastPastBurndownPoint?.planned ?? 0);
  const todayCount = useMemo(() => getTodayScheduledCount(allGroups, topicsMap, startDate, endDate, spacing, weightByDiff), [allGroups, topicsMap, startDate, endDate, spacing, weightByDiff]);

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

  const handleExportPDF = () => {
    const items = computeSchedule(allGroups, topicsMap, startDate, endDate, spacing, weightByDiff);
    if (!items.length) {
      alert("No scheduled topics. Add topics and set a schedule start/end date first.");
      return;
    }
    const byDate = new Map<string, typeof items>();
    for (const item of items) {
      const d = isoDate(item.firstDate);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(item);
    }
    const priorityBorder: Record<string, string> = {
      "High": "#ef4444", "Medium": "#f59e0b", "Low": "#3b82f6",
    };
    const statusBg: Record<string, string> = {
      "Not Started": "#f1f5f9", "In Progress": "#fef9c3", "Done": "#dcfce7", "Revised": "#d1fae5",
    };
    const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = isoDate(new Date());
    let monthsHtml = "";
    const monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endLimit = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    while (monthCursor <= endLimit) {
      const year = monthCursor.getFullYear();
      const month = monthCursor.getMonth();
      const monthName = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const firstDow = new Date(year, month, 1).getDay();
      const totalDays = new Date(year, month + 1, 0).getDate();
      let cells = "";
      let dayOfWeekCounter = firstDow;
      cells += `<tr>`;
      for (let pad = 0; pad < firstDow; pad++) cells += `<td class="empty"></td>`;
      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayItems = byDate.get(dateStr) ?? [];
        const pills = dayItems.map(it =>
          `<div class="pill" style="background:${statusBg[it.topic.status] ?? "#f1f5f9"};border-left:3px solid ${priorityBorder[it.topic.priority] ?? "#888"}">${it.topic.name.replace(/</g, "&lt;").substring(0, 22)}</div>`
        ).join("");
        cells += `<td class="${dateStr === todayStr ? "today" : ""}"><span class="daynum">${d}</span>${pills}</td>`;
        dayOfWeekCounter++;
        if (dayOfWeekCounter % 7 === 0 && d < totalDays) cells += `</tr><tr>`;
      }
      const endPad = 6 - ((firstDow + totalDays - 1) % 7);
      for (let pad = 0; pad < endPad; pad++) cells += `<td class="empty"></td>`;
      cells += `</tr>`;
      monthsHtml += `
        <div class="month">
          <h2>${monthName}</h2>
          <table>
            <thead><tr>${DAYS_SHORT.map(d => `<th>${d}</th>`).join("")}</tr></thead>
            <tbody>${cells}</tbody>
          </table>
        </div>`;
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Study Timetable</title>
<style>
  body{font-family:Arial,sans-serif;font-size:10px;margin:16px;color:#111}
  h1{font-size:16px;font-weight:700;margin:0 0 3px}
  .meta{font-size:9px;color:#666;margin:0 0 16px}
  .month{margin-bottom:20px;page-break-inside:avoid}
  h2{font-size:12px;font-weight:700;margin:0 0 5px;color:#333}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  th{background:#f3f4f6;padding:3px 2px;text-align:center;font-size:8px;font-weight:700;color:#666;border:1px solid #e5e7eb}
  td{padding:2px;border:1px solid #e5e7eb;vertical-align:top;min-height:52px;font-size:8px}
  td.empty{background:#fafafa}
  td.today{background:#eff6ff}
  .daynum{display:block;font-weight:700;color:#374151;font-size:9px;margin-bottom:1px}
  .pill{padding:1px 3px;margin-top:1px;border-radius:2px;font-size:7px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333}
  .legend{display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap}
  .legend-item{display:flex;align-items:center;gap:4px;font-size:8px;color:#555}
  .legend-dot{width:10px;height:10px;border-radius:2px}
  @media print{body{margin:0}@page{margin:1cm;size:A4 landscape}}
</style></head>
<body>
<h1>Study Timetable</h1>
<p class="meta">Generated ${new Date().toLocaleDateString()} · ${items.length} topics · ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}</p>
<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#f1f5f9;border-left:3px solid #ef4444"></div>High priority</div>
  <div class="legend-item"><div class="legend-dot" style="background:#f1f5f9;border-left:3px solid #f59e0b"></div>Medium priority</div>
  <div class="legend-item"><div class="legend-dot" style="background:#f1f5f9;border-left:3px solid #3b82f6"></div>Low priority</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dcfce7"></div>Done</div>
  <div class="legend-item"><div class="legend-dot" style="background:#fef9c3"></div>In Progress</div>
  <div class="legend-item"><div class="legend-dot" style="background:#eff6ff"></div>Today</div>
</div>
${monthsHtml}
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow pop-ups to export the printable timetable."); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

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
    <div className="sp-root relative min-h-screen bg-background pb-24">
      <AmbientOrbs color="hsl(38 95% 60% / 0.10)" />

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
          onRedistribute={(items) => {
            redistributeOverdueItems(items, endDate);
            setCalendarKey(k => k + 1);
            setShowShiftDialog(false);
          }}
        />
      )}

      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
            style={{
              background: "hsl(38 95% 60% / 0.15)",
              boxShadow: "0 0 12px hsl(38 95% 60% / 0.25)",
            }}
          >
            <CalendarDays className="h-4 w-4" style={{ color: "#fb923c" }} />
          </div>
          <span
            className="font-bold text-sm bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #fb923c, #fbbf24)" }}
          >
            Study Planner
          </span>
        </motion.div>
        <div className="flex items-center gap-2">
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700/60 shrink-0">
              {todayCount} due today
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden sm:block">{displayName}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav("/settings")}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
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

        <Accordion title="Dashboard" defaultOpen icon={<BarChart3 className="h-4 w-4 text-primary" />}
          badge={streak > 0 ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500 mr-1">
              🔥 {streak} days
            </span>
          ) : undefined}>
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
                  { label: "Topics",       value: totalTopics,                          hexColor: "#818cf8", rgb: "129,140,248" },
                  { label: "High Priority",value: highPriority,                         hexColor: "#f87171", rgb: "248,113,113" },
                  { label: "Completed",    value: completed,                            hexColor: "#34d399", rgb: "52,211,153"  },
                  { label: "Time Left",    value: formatMinutes(timeRemainingMins)||"0m",hexColor: "#38bdf8", rgb: "56,189,248"  },
                ].map((s, idx) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * idx, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-lg border bg-card/70 backdrop-blur-sm p-2 text-center relative overflow-hidden"
                    style={{ boxShadow: `inset 0 0 0 1px rgba(${s.rgb},0.15), 0 0 8px rgba(${s.rgb},0.05)` }}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, rgba(${s.rgb},0.12) 0%, transparent 70%)` }} />
                    <div className="relative text-lg font-bold tabular-nums" style={{ color: s.hexColor }}>{s.value}</div>
                    <div className="relative text-[9px] text-muted-foreground leading-tight">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Burndown / Schedule progress chart */}
              {burndownData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold">Schedule Progress</span>
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${onTrack ? "text-green-600" : "text-amber-500"}`}>
                      {onTrack ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {onTrack ? "On Track" : "Behind Schedule"}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart data={burndownData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <defs>
                        <linearGradient id="burnPlanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="label" tick={{ fontSize: 8 }} interval="preserveStartEnd" stroke="transparent" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} tickFormatter={(v: number) => `${v}%`} stroke="transparent" />
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value}%`, name === "planned" ? "Expected" : "Actual (checked)"]}
                        contentStyle={{ fontSize: 10, borderRadius: 8, padding: "4px 8px" }}
                      />
                      <Area type="monotone" dataKey="planned" stroke="#818cf8" fill="url(#burnPlanGrad)" strokeWidth={1.5} dot={false} name="planned" />
                      <Line type="monotone" dataKey="actual" stroke="#34d399" strokeWidth={2} dot={false} connectNulls={false} name="actual" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded" style={{ background: "rgba(129,140,248,0.5)", border: "1px solid #818cf8" }} />
                      <span className="text-[9px] text-muted-foreground">Expected</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-4 border-t-2 border-green-500" />
                      <span className="text-[9px] text-muted-foreground">Actual (daily checklist)</span>
                    </span>
                  </div>
                </div>
              )}

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
                  {([
                    { s: "Not Started" as Status, color: "bg-slate-300" },
                    { s: "In Progress" as Status, color: "bg-amber-400" },
                    { s: "Done" as Status, color: "bg-emerald-400" },
                    { s: "Revised" as Status, color: "bg-green-600" },
                  ].map(({ s, color }) => {
                    const count = allTopics.filter(t => t.status === s).length;
                    return count > 0 ? (
                      <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        {s} ({count})
                      </span>
                    ) : null;
                  }))}
                </div>
              </div>

              {(() => {
                const highC = allTopics.filter(t => t.priority === "High").length;
                const medC  = allTopics.filter(t => t.priority === "Medium").length;
                const lowC  = allTopics.filter(t => t.priority === "Low").length;
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">Priority Breakdown</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden flex bg-muted">
                      {highC > 0 && <div className="h-full bg-red-500 transition-all" style={{ width: `${(highC/totalTopics)*100}%` }} title={`High: ${highC}`} />}
                      {medC > 0  && <div className="h-full bg-amber-400 transition-all" style={{ width: `${(medC/totalTopics)*100}%` }} title={`Medium: ${medC}`} />}
                      {lowC > 0  && <div className="h-full bg-blue-400 transition-all" style={{ width: `${(lowC/totalTopics)*100}%` }} title={`Low: ${lowC}`} />}
                    </div>
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      {[
                        { label: "High", val: highC, color: "bg-red-500" },
                        { label: "Medium", val: medC, color: "bg-amber-400" },
                        { label: "Low", val: lowC, color: "bg-blue-400" },
                      ].map(p => (
                        <span key={p.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${p.color}`} />
                          {p.label} ({p.val})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

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
            <p className="text-xs text-muted-foreground">
              Dates spread from <strong>all topics combined</strong> — sorted by priority (High first). Second Study = First + {spacing} days.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleExportCSV} disabled={exportProgress}>
                {exportProgress ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Combined CSV"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleExportZip} disabled={exportProgress}>
                {exportProgress ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "ZIP (per subject)"}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={handleExportPDF}>
              <Printer className="h-3.5 w-3.5" />
              Print / Save as PDF Timetable
            </Button>
            {/* CSV columns */}
            <div className="border-t pt-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-1.5">CSV columns (Notion-ready):</p>
              <div className="flex flex-wrap gap-1">
                {["Name","Subject","Parent Subject","Files and Media","Video Link","University Lecturer","Amboss","First Study Date","Second Study Date","Notes","Status","Difficulty Level","Priority","From","Est. Minutes"].map(col => (
                  <span key={col} className="text-[10px] bg-muted border px-1.5 py-0.5 rounded text-muted-foreground">{col}</span>
                ))}
              </div>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">📋 How to import into Notion</summary>
              <ol className="mt-2 space-y-1.5 text-muted-foreground list-none">
                {[
                  { n: 1, t: "Download the CSV using one of the buttons above." },
                  { n: 2, t: 'Open Notion and navigate to the database page where you want to add the data.' },
                  { n: 3, t: 'Click the "…" menu (top right of the database) → Import → CSV.' },
                  { n: 4, t: 'Select the downloaded CSV file. Notion will map columns automatically.' },
                ].map(step => (
                  <li key={step.n} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                    <span>{step.t}</span>
                  </li>
                ))}
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
            {hardcodedStats.map((s, idx) => {
              const styles = CUSTOM_COLOR_STYLES[s.color] ?? CUSTOM_COLOR_STYLES.blue;
              return (
                <motion.button
                  key={s.label}
                  onClick={() => nav(s.path)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2, scale: 1.01, transition: { duration: 0.15 } }}
                  className={`rounded-xl border p-3 text-left shadow-sm hover:shadow-md transition-shadow ${styles.card}`}
                >
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className={`text-sm font-semibold ${styles.text}`}>{s.label}</div>
                  {s.description && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{s.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{s.topics.length} topics · {s.pct}%</div>
                  <div className="h-1.5 w-full bg-white/50 dark:bg-black/20 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${styles.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ delay: 0.15 + 0.04 * idx, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.button>
              );
            })}

            {/* Custom subjects */}
            {customStats.map((g, idx) => (
              <motion.button
                key={g.id}
                onClick={() => nav(g.navPath)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * (hardcodedStats.length + idx), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, scale: 1.01, transition: { duration: 0.15 } }}
                className={`rounded-xl border p-3 text-left shadow-sm hover:shadow-md transition-shadow ${g.styles.card}`}
              >
                <div className="text-xl mb-1">{g.emoji}</div>
                <div className={`text-sm font-semibold ${g.styles.text}`}>{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.topics.length} topics · {g.pct}%</div>
                <div className="h-1.5 w-full bg-white/50 dark:bg-black/20 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${g.styles.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${g.pct}%` }}
                    transition={{ delay: 0.15 + 0.04 * (hardcodedStats.length + idx), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.button>
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
