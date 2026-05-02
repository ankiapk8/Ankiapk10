import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, X, Search, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudyTopicsContext } from "@/context/study-topics-context";
import {
  type Topic, type Status, type Difficulty, type Priority,
  DEFAULT_TOPIC, STATUS_COLORS, PRIORITY_COLORS, DIFFICULTY_COLORS,
  generateId, formatMinutes, writeStudyActivity, generateSubjectCSV, downloadCSV,
  getScheduleStartDate, getScheduleEndDate, getSpacingDays,
} from "@/lib/study-planner/topics";

const STATUS_CYCLE: Status[] = ["Not Started", "In Progress", "Done", "Revised"];
const PRIORITY_CYCLE: Priority[] = ["High", "Medium", "Low"];

function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }

interface TopicManagerProps {
  storageKey: string;
  subjectLabel: string;
  parentLabel: string;
  accentClass?: string;
}

interface TopicFormData {
  name: string;
  status: Status;
  priority: Priority;
  difficultyLevel: Difficulty;
  estimatedMinutes: number;
  universityLecturer: string;
  filesAndMedia: string;
  videoLink: string;
  amboss: string;
  from: string;
  notes: string;
}

function blankForm(): TopicFormData {
  return {
    name: "",
    status: (lsGet("sp-settings-default-status") as Status) ?? "Not Started",
    priority: (lsGet("sp-settings-default-priority") as Priority) ?? "Medium",
    difficultyLevel: "Medium",
    estimatedMinutes: 0,
    universityLecturer: "",
    filesAndMedia: "",
    videoLink: "",
    amboss: "",
    from: "",
    notes: "",
  };
}

export function TopicManager({ storageKey, subjectLabel, parentLabel, accentClass = "text-primary" }: TopicManagerProps) {
  const { topicsMap, upsertTopics } = useStudyTopicsContext();
  const topics = topicsMap[storageKey] ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TopicFormData>(blankForm());
  const [bulkStatus, setBulkStatus] = useState<Status | "">("");
  const [bulkPriority, setBulkPriority] = useState<Priority | "">("");

  const filtered = useMemo(() => {
    return topics.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter.length && !statusFilter.includes(t.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(t.priority)) return false;
      return true;
    });
  }, [topics, search, statusFilter, priorityFilter]);

  const totalMinutes = topics.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
  const notStarted = topics.filter(t => t.status === "Not Started").length;
  const highPriority = topics.filter(t => t.priority === "High").length;

  const openAdd = () => { setEditingId(null); setForm(blankForm()); setDialogOpen(true); };
  const openEdit = (t: Topic) => {
    setEditingId(t.id);
    setForm({
      name: t.name, status: t.status, priority: t.priority,
      difficultyLevel: t.difficultyLevel, estimatedMinutes: t.estimatedMinutes ?? 0,
      universityLecturer: t.universityLecturer, filesAndMedia: t.filesAndMedia,
      videoLink: t.videoLink, amboss: t.amboss, from: t.from, notes: t.notes,
    });
    setDialogOpen(true);
  };

  const saveTopic = () => {
    if (!form.name.trim()) return;
    const updated = editingId
      ? topics.map(t => t.id === editingId ? { ...t, ...form, subject: subjectLabel } : t)
      : [...topics, { ...DEFAULT_TOPIC, ...form, id: generateId(), subject: subjectLabel }];
    upsertTopics(storageKey, updated);
    if (form.status === "Done" || form.status === "Revised") writeStudyActivity();
    setDialogOpen(false);
  };

  const deleteTopic = (id: string) => {
    upsertTopics(storageKey, topics.filter(t => t.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const cycleStatus = (t: Topic) => {
    const idx = (STATUS_CYCLE.indexOf(t.status) + 1) % STATUS_CYCLE.length;
    const newStatus = STATUS_CYCLE[idx];
    upsertTopics(storageKey, topics.map(x => x.id === t.id ? { ...x, status: newStatus } : x));
    if (newStatus === "Done" || newStatus === "Revised") writeStudyActivity();
  };

  const cyclePriority = (t: Topic) => {
    const idx = (PRIORITY_CYCLE.indexOf(t.priority) + 1) % PRIORITY_CYCLE.length;
    upsertTopics(storageKey, topics.map(x => x.id === t.id ? { ...x, priority: PRIORITY_CYCLE[idx] } : x));
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const applyBulkStatus = (s: Status) => {
    const updated = topics.map(t => selected.has(t.id) ? { ...t, status: s } : t);
    upsertTopics(storageKey, updated);
    if (s === "Done" || s === "Revised") writeStudyActivity();
    setBulkStatus("");
  };

  const applyBulkPriority = (p: Priority) => {
    const updated = topics.map(t => selected.has(t.id) ? { ...t, priority: p } : t);
    upsertTopics(storageKey, updated);
    setBulkPriority("");
  };

  const handleExportCSV = () => {
    const start = getScheduleStartDate();
    const end = getScheduleEndDate(start);
    const spacing = getSpacingDays();
    const csv = generateSubjectCSV(topics, subjectLabel, parentLabel, end, spacing);
    downloadCSV(csv, `${storageKey}.csv`);
  };

  const anyFilter = search || statusFilter.length > 0 || priorityFilter.length > 0;

  const toggleStatusFilter = (s: Status) =>
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const togglePriorityFilter = (p: Priority) =>
    setPriorityFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: topics.length, color: "text-primary" },
          { label: "Not Started", value: notStarted, color: "text-gray-500" },
          { label: "High Priority", value: highPriority, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-2 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {totalMinutes > 0 && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
          ⏱ Time remaining: <strong>{formatMinutes(totalMinutes)}</strong> across {topics.length} topics
        </div>
      )}

      {/* Schedule banner */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        {topics.length} topics spread across schedule. Sorted High → Medium → Low priority.
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleExportCSV} className="h-8 px-2.5">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" onClick={openAdd} className="h-8 px-2.5">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {(["Not Started", "In Progress", "Done", "Revised"] as Status[]).map(s => (
          <button
            key={s}
            onClick={() => toggleStatusFilter(s)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
              statusFilter.includes(s) ? STATUS_COLORS[s] + " border-current" : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {s}
          </button>
        ))}
        {(["High", "Medium", "Low"] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => togglePriorityFilter(p)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
              priorityFilter.includes(p) ? PRIORITY_COLORS[p] + " border-current" : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {p}
          </button>
        ))}
        {anyFilter && (
          <button
            onClick={() => { setSearch(""); setStatusFilter([]); setPriorityFilter([]); }}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {anyFilter ? `Showing ${filtered.length} of ${topics.length}` : `${topics.length} topic${topics.length !== 1 ? "s" : ""}`}
      </div>

      {/* Topic list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {topics.length === 0 ? (
            <><p className="font-medium">No topics yet</p><p className="text-xs mt-1">Click "Add" to get started.</p></>
          ) : (
            <p>No topics match your filters.</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => (
            <div
              key={t.id}
              className={`rounded-xl border bg-card p-3 transition-colors ${selected.has(t.id) ? "border-primary/50 bg-primary/5" : "hover:bg-accent/30"}`}
            >
              <div className="flex items-start gap-2.5">
                <Checkbox
                  checked={selected.has(t.id)}
                  onCheckedChange={() => toggleSelect(t.id)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{t.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <button
                      onClick={() => cycleStatus(t)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${STATUS_COLORS[t.status]}`}
                    >
                      {t.status}
                    </button>
                    <button
                      onClick={() => cyclePriority(t)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${PRIORITY_COLORS[t.priority]}`}
                    >
                      {t.priority}
                    </button>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${DIFFICULTY_COLORS[t.difficultyLevel]}`}>
                      {t.difficultyLevel}
                    </span>
                    {(t.estimatedMinutes ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {formatMinutes(t.estimatedMinutes ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteTopic(t.id)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4">
          <div className="rounded-2xl border bg-popover shadow-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{selected.size} selected</span>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setSelected(new Set(filtered.map(t => t.id)))} className="text-primary hover:underline">Select All</button>
                <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:underline">Deselect All</button>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={bulkStatus} onValueChange={v => { setBulkStatus(v as Status); applyBulkStatus(v as Status); }}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Set Status →" />
                </SelectTrigger>
                <SelectContent>
                  {(["Not Started", "In Progress", "Done", "Revised"] as Status[]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bulkPriority} onValueChange={v => { setBulkPriority(v as Priority); applyBulkPriority(v as Priority); }}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Set Priority →" />
                </SelectTrigger>
                <SelectContent>
                  {(["High", "Medium", "Low"] as Priority[]).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Topic" : `Add Topic — ${subjectLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label>Topic Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acne Vulgaris" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Not Started","In Progress","Done","Revised"] as Status[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Low","Medium","High"] as Priority[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficultyLevel} onValueChange={v => setForm(f => ({ ...f, difficultyLevel: v as Difficulty }))}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Easy","Medium","Hard"] as Difficulty[]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Est. Study Time (mins)</Label>
              <Input type="number" min={0} max={300} value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: parseInt(e.target.value) || 0 }))} className="h-8" />
            </div>
            {[
              { key: "universityLecturer", label: "University Lecturer" },
              { key: "filesAndMedia", label: "Files & Media (URL)" },
              { key: "videoLink", label: "Video Link (URL)" },
              { key: "amboss", label: "Amboss Link" },
              { key: "from", label: "From / Source" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="text-sm resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!form.name.trim()} onClick={saveTopic}>
                {editingId ? "Save Changes" : "Add Topic"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
