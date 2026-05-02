import JSZip from "jszip";

export type Status = "Not Started" | "In Progress" | "Done" | "Revised";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type Priority = "Low" | "Medium" | "High";

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
}

export interface SubjectGroup {
  parentLabel: string;
  subjectLabel: string;
  storageKey: string;
}

export interface ScheduledItem {
  topic: Topic;
  subjectLabel: string;
  parentLabel: string;
  storageKey: string;
  firstDate: Date;
  secondDate: Date;
}

export const ALL_SUBJECT_GROUPS: SubjectGroup[] = [
  { parentLabel: "Sub Medicine", subjectLabel: "Dermatology", storageKey: "dermatology" },
  { parentLabel: "Sub Medicine", subjectLabel: "Family Medicine", storageKey: "family" },
  { parentLabel: "Sub Medicine", subjectLabel: "Emergency", storageKey: "emergency" },
  { parentLabel: "Sub Medicine", subjectLabel: "Forensic", storageKey: "forensic" },
  { parentLabel: "Sub Medicine", subjectLabel: "Radiology", storageKey: "radiology" },
  { parentLabel: "Psychiatric", subjectLabel: "Psychiatric", storageKey: "psychiatric" },
  { parentLabel: "Sub Surgery", subjectLabel: "ENT", storageKey: "ent" },
  { parentLabel: "Sub Surgery", subjectLabel: "Ophthalmology", storageKey: "ophthalmology" },
  { parentLabel: "Sub Surgery", subjectLabel: "Orthopedic", storageKey: "orthopedic" },
  { parentLabel: "Sub Surgery", subjectLabel: "Neurosurgery", storageKey: "neurosurgery" },
  { parentLabel: "Sub Surgery", subjectLabel: "Urology", storageKey: "urology" },
  { parentLabel: "Pediatric", subjectLabel: "Pediatric", storageKey: "pediatric" },
  { parentLabel: "Gynecology", subjectLabel: "Gynecology", storageKey: "gynecology" },
  { parentLabel: "Gynecology", subjectLabel: "Obstetric", storageKey: "obstetric" },
];

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

export function scheduleTopics(
  allTopics: Record<string, Topic[]>,
  startDate: Date
): ScheduledItem[] {
  const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  const windowDays = Math.max(1, endOfMonth.getDate() - startDate.getDate() + 1);

  const expanded: Array<{ topic: Topic; group: SubjectGroup; groupIndex: number }> = [];
  for (let gi = 0; gi < ALL_SUBJECT_GROUPS.length; gi++) {
    const group = ALL_SUBJECT_GROUPS[gi];
    const topics = allTopics[group.storageKey] ?? [];
    for (const topic of topics) {
      expanded.push({ topic, group, groupIndex: gi });
    }
  }

  expanded.sort((a, b) => {
    if (a.group.storageKey === "family" && b.group.storageKey !== "family") return -1;
    if (b.group.storageKey === "family" && a.group.storageKey !== "family") return 1;
    const pd = PRIORITY_ORDER[a.topic.priority] - PRIORITY_ORDER[b.topic.priority];
    if (pd !== 0) return pd;
    const gd = a.groupIndex - b.groupIndex;
    if (gd !== 0) return gd;
    return a.topic.name.localeCompare(b.topic.name);
  });

  const N = expanded.length;
  return expanded.map(({ topic, group }, i) => {
    const dayOffset = N <= windowDays ? i : Math.floor((i / N) * windowDays);
    const firstDate = new Date(startDate);
    firstDate.setDate(startDate.getDate() + dayOffset);
    const secondDate = new Date(firstDate);
    secondDate.setDate(firstDate.getDate() + 14);
    return {
      topic,
      subjectLabel: group.subjectLabel,
      parentLabel: group.parentLabel,
      storageKey: group.storageKey,
      firstDate,
      secondDate,
    };
  });
}

export function getScheduleStartDate(): Date {
  const stored = localStorage.getItem("schedule-start-date");
  if (stored) {
    const d = new Date(stored);
    if (!isNaN(d.getTime())) return d;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

const CSV_HEADERS = [
  "Name", "Subject", "Parent Subject", "Files and Media", "Video Link",
  "University Lecturer", "Amboss", "First Study Date", "Second Study Date",
  "Notes", "Status", "Difficulty Level", "Priority", "From",
];

function topicToRow(item: ScheduledItem): string {
  return [
    item.topic.name, item.subjectLabel, item.parentLabel,
    item.topic.filesAndMedia, item.topic.videoLink, item.topic.universityLecturer,
    item.topic.amboss, formatDate(item.firstDate), formatDate(item.secondDate),
    item.topic.notes, item.topic.status, item.topic.difficultyLevel,
    item.topic.priority, item.topic.from,
  ].map(escapeCsv).join(",");
}

const BOM = "\uFEFF";

export function generateAllSubjectsCSV(items: ScheduledItem[]): string {
  const rows = [CSV_HEADERS.join(","), ...items.map(topicToRow)];
  return BOM + rows.join("\n");
}

export function generateSeparatedCSVs(items: ScheduledItem[]): Array<{ filename: string; content: string }> {
  const byKey: Record<string, ScheduledItem[]> = {};
  for (const item of items) {
    if (!byKey[item.storageKey]) byKey[item.storageKey] = [];
    byKey[item.storageKey].push(item);
  }
  return Object.entries(byKey).map(([key, keyItems]) => ({
    filename: `${key}.csv`,
    content: BOM + [CSV_HEADERS.join(","), ...keyItems.map(topicToRow)].join("\n"),
  }));
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadZip(files: Array<{ filename: string; content: string }>, zipName: string): Promise<void> {
  const zip = new JSZip();
  for (const f of files) zip.file(f.filename, f.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

export interface BackupData {
  version: number;
  exportedAt: string;
  scheduleStartDate: string;
  topics: Record<string, Topic[]>;
}

export function exportBackup(allTopics: Record<string, Topic[]>): void {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scheduleStartDate: localStorage.getItem("schedule-start-date") ?? formatDate(new Date()),
    topics: allTopics,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `study-planner-backup-${formatDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(json: string): { ok: boolean; message: string; data?: BackupData } {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { ok: false, message: "Invalid JSON" };
    const d = parsed as Record<string, unknown>;
    if (d.version !== 1) return { ok: false, message: "Unsupported backup version" };
    if (typeof d.topics !== "object" || d.topics === null) return { ok: false, message: "Missing topics" };
    return { ok: true, message: "Backup loaded successfully", data: d as BackupData };
  } catch {
    return { ok: false, message: "Failed to parse backup file" };
  }
}
