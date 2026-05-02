// ─── Types ───────────────────────────────────────────────────────────────────

export type Status     = "Not Started" | "In Progress" | "Done" | "Revised";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type Priority   = "Low" | "Medium" | "High";

export interface Topic {
  id: string;
  name: string;
  subject: string;
  filesAndMedia: string;
  videoLink: string;
  universityLecturer: string;
  amboss: string;
  notes: string;
  status: Status;
  difficultyLevel: Difficulty;
  priority: Priority;
  from: string;
  estimatedMinutes?: number;
}

export interface SubjectGroup {
  parentLabel: string;
  subjectLabel: string;
  storageKey: string;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  scheduleStartDate: string | null;
  scheduleEndDate?: string | null;
  scheduleSpacingDays?: number | null;
  topics: Record<string, Topic[]>;
}

export interface ScheduledItem {
  topic: Topic;
  subjectLabel: string;
  parentLabel: string;
  storageKey: string;
  firstDate: Date;
  secondDate: Date;
}

export interface SeparatedCSV {
  filename: string;
  csv: string;
  parentLabel: string;
  topicCount: number;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TOPIC: Topic = {
  id: "",
  name: "",
  subject: "",
  filesAndMedia: "",
  videoLink: "",
  universityLecturer: "",
  amboss: "",
  notes: "",
  status: "Not Started",
  difficultyLevel: "Medium",
  priority: "Medium",
  from: "",
  estimatedMinutes: 0,
};

export const ALL_SUBJECT_GROUPS: SubjectGroup[] = [
  { parentLabel: "Sub Medicine", subjectLabel: "Dermatology",   storageKey: "dermatology" },
  { parentLabel: "Sub Medicine", subjectLabel: "Family",        storageKey: "family" },
  { parentLabel: "Sub Medicine", subjectLabel: "Emergency",     storageKey: "emergency" },
  { parentLabel: "Sub Medicine", subjectLabel: "Forensic",      storageKey: "forensic" },
  { parentLabel: "Sub Medicine", subjectLabel: "Radiology",     storageKey: "radiology" },
  { parentLabel: "Psychiatric",  subjectLabel: "Psychiatric",   storageKey: "psychiatric" },
  { parentLabel: "Sub Surgery",  subjectLabel: "ENT",           storageKey: "ent" },
  { parentLabel: "Sub Surgery",  subjectLabel: "Ophthalmology", storageKey: "ophthalmology" },
  { parentLabel: "Sub Surgery",  subjectLabel: "Orthopedic",    storageKey: "orthopedic" },
  { parentLabel: "Sub Surgery",  subjectLabel: "Neurosurgery",  storageKey: "neurosurgery" },
  { parentLabel: "Sub Surgery",  subjectLabel: "Urology",       storageKey: "urology" },
  { parentLabel: "Pediatric",    subjectLabel: "Pediatric",     storageKey: "pediatric" },
  { parentLabel: "Gynecology",   subjectLabel: "Gynecology",    storageKey: "gynecology" },
  { parentLabel: "Gynecology",   subjectLabel: "Obstetric",     storageKey: "obstetric" },
];

// ─── Color maps ──────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<Status, string> = {
  "Not Started": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "In Progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  "Done":        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "Revised":     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  High:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  Hard:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export const PARENT_DOT_COLORS: Record<string, string> = {
  "Sub Medicine": "bg-blue-500",
  "Psychiatric":  "bg-purple-500",
  "Sub Surgery":  "bg-orange-500",
  "Pediatric":    "bg-green-500",
  "Gynecology":   "bg-pink-500",
};

// ─── Utilities ───────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMinutes(mins: number): string {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export function getScheduleStartDate(): Date {
  const v = lsGet("sp-schedule-start-date");
  if (v) { const d = new Date(v); if (!isNaN(d.getTime())) return d; }
  return new Date();
}
export function setScheduleStartDate(date: Date): void {
  lsSet("sp-schedule-start-date", date.toISOString());
}

export function getScheduleEndDate(startDate: Date): Date {
  const v = lsGet("sp-schedule-end-date");
  if (v) { const d = new Date(v); if (!isNaN(d.getTime())) return d; }
  const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  return end;
}
export function setScheduleEndDate(date: Date): void {
  lsSet("sp-schedule-end-date", date.toISOString());
}

export function getScheduleWindowDays(startDate: Date, endDate?: Date): number {
  const end = endDate ?? getScheduleEndDate(startDate);
  const diff = Math.round((end.getTime() - startDate.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(365, diff));
}

export function getSpacingDays(): number {
  const v = lsGet("sp-schedule-spacing-days");
  const n = v ? parseInt(v, 10) : 14;
  return isNaN(n) ? 14 : n;
}
export function setSpacingDays(days: number): void {
  lsSet("sp-schedule-spacing-days", String(days));
}

export function getWeightByDifficulty(): boolean {
  return lsGet("sp-weight-by-difficulty") === "true";
}
export function setWeightByDifficulty(val: boolean): void {
  lsSet("sp-weight-by-difficulty", String(val));
}

export function writeStudyActivity(date?: Date): void {
  try {
    const raw = lsGet("sp-study-activity");
    const log: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    log[isoDate(date ?? new Date())] = true;
    lsSet("sp-study-activity", JSON.stringify(log));
    window.dispatchEvent(new CustomEvent("sp-study-activity-updated"));
  } catch { /* ignore */ }
}

export function computeStreak(): number {
  try {
    const raw = lsGet("sp-study-activity");
    if (!raw) return 0;
    const log: Record<string, boolean> = JSON.parse(raw);
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (log[isoDate(d)]) streak++;
      else if (i > 0) break;
    }
    return streak;
  } catch { return 0; }
}

export function getStudyActivityLog(): Record<string, boolean> {
  try {
    const raw = lsGet("sp-study-activity");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getLastBackupAt(): Date | null {
  const v = lsGet("sp-last-backup-at");
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Schedule algorithm ──────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
const DIFFICULTY_ORDER: Record<Difficulty, number> = { Hard: 0, Medium: 1, Easy: 2 };

function assignDates(
  topics: Topic[],
  startDate: Date,
  daysWindow: number,
  spacing: number,
): { topic: Topic; firstDate: Date; secondDate: Date }[] {
  return topics.map((topic, i) => {
    const offset = topics.length > 1
      ? Math.round((i / (topics.length - 1)) * (daysWindow - 1))
      : 0;
    const firstDate = new Date(startDate);
    firstDate.setDate(firstDate.getDate() + offset);
    const secondDate = new Date(firstDate);
    secondDate.setDate(secondDate.getDate() + spacing);
    return { topic, firstDate, secondDate };
  });
}

export function computeSchedule(
  groups: SubjectGroup[],
  topicsMap: Record<string, Topic[]>,
  startDate?: Date,
  endDate?: Date,
  spacing?: number,
  weightByDifficulty?: boolean,
): ScheduledItem[] {
  const start = startDate ?? getScheduleStartDate();
  const end = endDate ?? getScheduleEndDate(start);
  const sp = spacing ?? getSpacingDays();
  const weight = weightByDifficulty ?? getWeightByDifficulty();
  const daysWindow = getScheduleWindowDays(start, end);

  const items: ScheduledItem[] = [];
  for (const group of groups) {
    const topics = [...(topicsMap[group.storageKey] ?? [])];
    topics.sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      if (weight) {
        const dDiff = DIFFICULTY_ORDER[a.difficultyLevel] - DIFFICULTY_ORDER[b.difficultyLevel];
        if (dDiff !== 0) return dDiff;
      }
      return a.name.localeCompare(b.name);
    });
    const assigned = assignDates(topics, start, daysWindow, sp);
    for (const a of assigned) {
      items.push({ ...a, subjectLabel: group.subjectLabel, parentLabel: group.parentLabel, storageKey: group.storageKey });
    }
  }
  return items;
}

// ─── CSV export ──────────────────────────────────────────────────────────────

export const NOTION_HEADERS = [
  "Name", "Subject", "Parent Subject", "Files and Media", "Video Link",
  "University Lecturer", "Amboss", "First Study Date", "Second Study Date",
  "Notes", "Status", "Difficulty Level", "Priority", "From", "Est. Minutes",
];

export function csvRow(cells: string[]): string {
  return cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",");
}

export function generateSubjectCSV(
  topics: Topic[],
  subjectLabel: string,
  parentLabel: string,
  endDate?: Date,
  spacing?: number,
): string {
  const start = getScheduleStartDate();
  const end = endDate ?? getScheduleEndDate(start);
  const sp = spacing ?? getSpacingDays();
  const daysWindow = getScheduleWindowDays(start, end);
  const assigned = assignDates(topics, start, daysWindow, sp);
  const rows = [csvRow(NOTION_HEADERS)];
  for (const { topic, firstDate, secondDate } of assigned) {
    rows.push(csvRow([
      topic.name, subjectLabel, parentLabel,
      topic.filesAndMedia, topic.videoLink,
      topic.universityLecturer, topic.amboss,
      isoDate(firstDate), isoDate(secondDate),
      topic.notes, topic.status, topic.difficultyLevel, topic.priority, topic.from,
      String(topic.estimatedMinutes ?? 0),
    ]));
  }
  return rows.join("\n");
}

export function generateAllSubjectsCSV(
  groups: SubjectGroup[],
  topicsMap: Record<string, Topic[]>,
  endDate?: Date,
  spacing?: number,
  weightByDifficulty?: boolean,
): string {
  const start = getScheduleStartDate();
  const end = endDate ?? getScheduleEndDate(start);
  const sp = spacing ?? getSpacingDays();
  const weight = weightByDifficulty ?? getWeightByDifficulty();
  const items = computeSchedule(groups, topicsMap, start, end, sp, weight);
  const rows = [csvRow(NOTION_HEADERS)];
  for (const { topic, subjectLabel, parentLabel, firstDate, secondDate } of items) {
    rows.push(csvRow([
      topic.name, subjectLabel, parentLabel,
      topic.filesAndMedia, topic.videoLink,
      topic.universityLecturer, topic.amboss,
      isoDate(firstDate), isoDate(secondDate),
      topic.notes, topic.status, topic.difficultyLevel, topic.priority, topic.from,
      String(topic.estimatedMinutes ?? 0),
    ]));
  }
  return rows.join("\n");
}

export function generateSeparatedCSVs(
  groups: SubjectGroup[],
  topicsMap: Record<string, Topic[]>,
  endDate?: Date,
  spacing?: number,
  weightByDifficulty?: boolean,
): SeparatedCSV[] {
  return groups
    .filter(g => (topicsMap[g.storageKey] ?? []).length > 0)
    .map(g => {
      const topics = topicsMap[g.storageKey] ?? [];
      return {
        filename: `${g.storageKey}.csv`,
        csv: generateSubjectCSV(topics, g.subjectLabel, g.parentLabel, endDate, spacing),
        parentLabel: g.parentLabel,
        topicCount: topics.length,
      };
    });
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadZip(files: SeparatedCSV[], zipName: string): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) zip.file(f.filename, "\uFEFF" + f.csv);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = zipName; a.click();
  URL.revokeObjectURL(url);
}

// ─── Backup ──────────────────────────────────────────────────────────────────

export function exportBackup(
  groups: SubjectGroup[],
  topicsMap: Record<string, Topic[]>,
): void {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scheduleStartDate: lsGet("sp-schedule-start-date"),
    scheduleEndDate: lsGet("sp-schedule-end-date"),
    scheduleSpacingDays: getSpacingDays(),
    topics: Object.fromEntries(groups.map(g => [g.storageKey, topicsMap[g.storageKey] ?? []])),
  };
  downloadCSV(JSON.stringify(data, null, 2), `study-planner-backup-${isoDate(new Date())}.json`);
  lsSet("sp-last-backup-at", new Date().toISOString());
}

export function importBackup(json: string): { ok: boolean; message: string; data?: BackupData } {
  try {
    const data = JSON.parse(json) as BackupData;
    if (data.version !== 1) return { ok: false, message: "Unsupported backup version." };
    if (!data.topics || typeof data.topics !== "object") return { ok: false, message: "Invalid backup: missing topics." };
    return { ok: true, message: "Backup loaded successfully.", data };
  } catch (e) {
    return { ok: false, message: `Parse error: ${e}` };
  }
}
