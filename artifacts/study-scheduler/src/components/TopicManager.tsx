import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpsertTopics, getGetAllTopicsQueryKey } from "@workspace/api-client-react";
import { Plus, Pencil, Trash2, ExternalLink, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateAllSubjectsCSV, downloadCSV, type Topic, type Status, type Difficulty, type Priority, type ScheduledItem } from "@/lib/topics";

interface TopicManagerProps {
  storageKey: string;
  subjectLabel: string;
  topics: Topic[];
  scheduledItems?: ScheduledItem[];
}

const EMPTY_TOPIC: Omit<Topic, "id"> = {
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
};

function statusColor(s: Status) {
  if (s === "Done") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (s === "Revised") return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400";
  if (s === "In Progress") return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

function priorityColor(p: Priority) {
  if (p === "High") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
  if (p === "Low") return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
}

function difficultyColor(d: Difficulty) {
  if (d === "Hard") return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
  if (d === "Easy") return "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400";
  return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
}

export function TopicManager({ storageKey, subjectLabel, topics, scheduledItems = [] }: TopicManagerProps) {
  const queryClient = useQueryClient();
  const upsertTopics = useUpsertTopics();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [form, setForm] = useState<Omit<Topic, "id">>(EMPTY_TOPIC);

  function openAdd() {
    setEditingTopic(null);
    setForm(EMPTY_TOPIC);
    setDialogOpen(true);
  }

  function openEdit(t: Topic) {
    setEditingTopic(t);
    setForm({ ...t });
    setDialogOpen(true);
  }

  function setField<K extends keyof Omit<Topic, "id">>(k: K, v: Omit<Topic, "id">[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Topic name is required", variant: "destructive" });
      return;
    }
    let updated: Topic[];
    if (editingTopic) {
      updated = topics.map((t) => (t.id === editingTopic.id ? { ...form, id: t.id } : t));
    } else {
      updated = [...topics, { ...form, id: crypto.randomUUID() }];
    }
    upsertTopics.mutate(
      { storageKey, data: { topics: updated } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllTopicsQueryKey() });
          setDialogOpen(false);
          toast({ title: editingTopic ? "Topic updated" : "Topic added" });
        },
        onError: () => toast({ title: "Failed to save topic", variant: "destructive" }),
      }
    );
  }

  async function deleteTopic(id: string) {
    const updated = topics.filter((t) => t.id !== id);
    upsertTopics.mutate(
      { storageKey, data: { topics: updated } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllTopicsQueryKey() });
          toast({ title: "Topic removed" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  }

  function handleExportCSV() {
    const csv = generateAllSubjectsCSV(scheduledItems);
    downloadCSV(csv, `${storageKey}.csv`);
  }

  const high = topics.filter((t) => t.priority === "High").length;
  const notStarted = topics.filter((t) => t.status === "Not Started").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-card-border p-3">
          <p className="text-xs text-muted-foreground">Total Topics</p>
          <p className="text-2xl font-bold text-foreground">{topics.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-card-border p-3">
          <p className="text-xs text-muted-foreground">Not Started</p>
          <p className="text-2xl font-bold text-slate-500">{notStarted}</p>
        </div>
        <div className="rounded-xl bg-card border border-card-border p-3">
          <p className="text-xs text-muted-foreground">High Priority</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{high}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={openAdd} data-testid="button-add-topic">
          <Plus className="h-4 w-4 mr-1.5" /> Add Topic
        </Button>
        {scheduledItems.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
            <FileDown className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground text-sm">
          No topics yet for {subjectLabel}. Click "Add Topic" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <div
              key={t.id}
              data-testid={`card-topic-${t.id}`}
              className="rounded-xl border border-card-border bg-card p-4 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-foreground leading-tight">{t.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      data-testid={`button-edit-${t.id}`}
                      onClick={() => openEdit(t)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      data-testid={`button-delete-${t.id}`}
                      onClick={() => deleteTopic(t.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(t.priority)}`}>{t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(t.difficultyLevel)}`}>{t.difficultyLevel}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {t.universityLecturer && (
                    <span className="text-xs text-muted-foreground">Lecturer: {t.universityLecturer}</span>
                  )}
                  {t.from && (
                    <span className="text-xs text-muted-foreground">Source: {t.from}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {t.filesAndMedia && (
                    <a href={t.filesAndMedia} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Files
                    </a>
                  )}
                  {t.videoLink && (
                    <a href={t.videoLink} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Video
                    </a>
                  )}
                  {t.amboss && (
                    <a href={t.amboss} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Amboss
                    </a>
                  )}
                </div>
                {t.notes && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1 mt-2 line-clamp-2">
                    {t.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-topic-form">
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic" : "Add Topic"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="topic-name">Topic Name *</Label>
              <Input id="topic-name" value={form.name} onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Psoriasis" data-testid="input-topic-name" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v as Status)}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Not Started", "In Progress", "Done", "Revised"] as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setField("priority", v as Priority)}>
                  <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficultyLevel} onValueChange={(v) => setField("difficultyLevel", v as Difficulty)}>
                  <SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-lecturer">University Lecturer</Label>
              <Input id="topic-lecturer" value={form.universityLecturer}
                onChange={(e) => setField("universityLecturer", e.target.value)}
                placeholder="Dr. Smith" data-testid="input-lecturer" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-files">Files & Media URL</Label>
              <Input id="topic-files" value={form.filesAndMedia}
                onChange={(e) => setField("filesAndMedia", e.target.value)}
                placeholder="https://..." data-testid="input-files" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-video">Video Link URL</Label>
              <Input id="topic-video" value={form.videoLink}
                onChange={(e) => setField("videoLink", e.target.value)}
                placeholder="https://youtube.com/..." data-testid="input-video" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-amboss">Amboss URL</Label>
              <Input id="topic-amboss" value={form.amboss}
                onChange={(e) => setField("amboss", e.target.value)}
                placeholder="https://www.amboss.com/..." data-testid="input-amboss" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-from">From / Source</Label>
              <Input id="topic-from" value={form.from}
                onChange={(e) => setField("from", e.target.value)}
                placeholder="Lecture notes, book chapter..." data-testid="input-from" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="topic-notes">Notes</Label>
              <Textarea id="topic-notes" value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Any additional notes..." rows={3} data-testid="input-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-topic">Cancel</Button>
            <Button onClick={save} disabled={upsertTopics.isPending} data-testid="button-save-topic">
              {upsertTopics.isPending ? "Saving…" : "Save Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
