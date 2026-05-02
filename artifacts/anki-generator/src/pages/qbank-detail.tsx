import { useState, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetQbank,
  useListQbankQuestions,
  useUpdateQuestion,
  useDeleteQuestion,
  getListQbankQuestionsQueryKey,
  getGetQbankQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Stethoscope, Play, Search, X, Edit2, Trash2,
  Check, ChevronDown, ChevronRight, Tag, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "@workspace/api-client-react";

const LETTER = ["A", "B", "C", "D", "E", "F"];
const LETTER_COLORS: Record<string, string> = {
  A: "bg-sky-500", B: "bg-orange-500", C: "bg-purple-500",
  D: "bg-pink-500", E: "bg-teal-500", F: "bg-amber-500",
};

function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return tags.split(",").map(t => t.trim()).filter(Boolean);
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  onUpdate: (id: number, data: { front?: string; back?: string | null; tags?: string | null }) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(question.front);
  const [back, setBack] = useState(question.back ?? "");
  const [tagsInput, setTagsInput] = useState(parseTags(question.tags).join(", "));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const choices = question.choices ?? [];
  const correctIndex = question.correctIndex ?? 0;
  const tags = parseTags(question.tags);

  const handleSave = () => {
    onUpdate(question.id, {
      front: front.trim(),
      back: back.trim() || null,
      tags: tagsInput.trim() || null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFront(question.front);
    setBack(question.back ?? "");
    setTagsInput(parseTags(question.tags).join(", "));
    setEditing(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
      >
        <Card className="border-border/50 group hover:border-violet-500/30 hover:shadow-sm transition-all">
          <CardContent className="p-0">
            {editing ? (
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Question Stem</Label>
                  <Textarea
                    value={front}
                    onChange={e => setFront(e.target.value)}
                    className="min-h-[80px] text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Explanation</Label>
                  <Textarea
                    value={back}
                    onChange={e => setBack(e.target.value)}
                    className="min-h-[80px] text-sm"
                    placeholder="Answer explanation…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Tags (comma-separated)
                  </Label>
                  <Input
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="e.g. cardiology, heart failure, HFrEF"
                    className="text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!front.trim()}>
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="w-full text-left p-4 flex items-start gap-3"
                  onClick={() => setExpanded(e => !e)}
                >
                  <div className="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet-600">Q{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 text-left">
                      {question.front}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {choices.length > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {choices.length} choices
                        </span>
                      )}
                      {question.pageNumber != null && (
                        <span className="text-[10px] text-muted-foreground">p. {question.pageNumber}</span>
                      )}
                      {tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
                    <div
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {expanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/40 mt-0">
                        {choices.length > 0 && (
                          <div className="space-y-2 pt-3">
                            {choices.map((choice, i) => {
                              const letter = LETTER[i] ?? String(i + 1);
                              const isCorrect = i === correctIndex;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${
                                    isCorrect
                                      ? "bg-emerald-500/8 border border-emerald-200/70 dark:border-emerald-800/50"
                                      : "bg-muted/30 border border-border/40"
                                  }`}
                                >
                                  <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                                    isCorrect ? "bg-emerald-500" : (LETTER_COLORS[letter] ?? "bg-muted-foreground/30")
                                  }`}>
                                    {isCorrect ? <Check className="h-3 w-3 stroke-[3]" /> : letter}
                                  </span>
                                  <span className={`text-sm leading-snug ${isCorrect ? "font-medium text-emerald-900 dark:text-emerald-100" : "text-foreground"}`}>
                                    {choice}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {question.back && (
                          <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
                              Explanation
                            </p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {question.back}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this question?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmDelete(false); onDelete(question.id); }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function QbankDetail() {
  const [, params] = useRoute("/qbanks/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: qbank, isLoading: loadingQbank } = useGetQbank(id);
  const { data: questions, isLoading: loadingQuestions } = useListQbankQuestions(id);
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return questions ?? [];
    return (questions ?? []).filter(
      qu => qu.front.toLowerCase().includes(q) || (qu.back ?? "").toLowerCase().includes(q)
    );
  }, [questions, search]);

  const handleUpdate = (qId: number, data: { front?: string; back?: string; tags?: string | null }) => {
    updateQuestion.mutate(
      { id: qId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQbankQuestionsQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetQbankQueryKey(id) });
          toast({ title: "Question updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (qId: number) => {
    deleteQuestion.mutate(
      { id: qId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListQbankQuestionsQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetQbankQueryKey(id) });
          toast({ title: "Question deleted" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  if (loadingQbank) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!qbank) {
    return (
      <div className="text-center py-20">
        <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <p className="font-medium text-muted-foreground">Question bank not found</p>
        <Link href="/decks">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  const totalQuestions = questions?.length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/decks?tab=qbanks" className="inline-flex items-center text-sm text-muted-foreground hover:text-violet-600 mb-2 transition-colors gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-violet-700 dark:text-violet-300 tracking-tight">
                {qbank.name}
              </h1>
              {qbank.description && (
                <p className="text-muted-foreground text-sm mt-0.5">{qbank.description}</p>
              )}
            </div>
          </div>
        </div>
        {totalQuestions > 0 && (
          <Link href={`/practice-qbank/${id}`}>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20">
              <Play className="h-4 w-4" /> Practice ({totalQuestions} MCQ{totalQuestions !== 1 ? "s" : ""})
            </Button>
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground border-b pb-3">
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-violet-500" />
          <span className="font-medium text-foreground">{totalQuestions}</span> question{totalQuestions !== 1 ? "s" : ""}
        </span>
        {qbank.subQbanks && qbank.subQbanks.length > 0 && (
          <span className="text-muted-foreground">{qbank.subQbanks.length} sub-bank{qbank.subQbanks.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Search */}
      {totalQuestions > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Questions list */}
      {loadingQuestions ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : totalQuestions === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl">
          <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-40" />
          <p className="font-medium text-muted-foreground">No questions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a question bank from the{" "}
            <Link href="/generate" className="text-violet-600 hover:underline">Generate tab</Link>.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions match "{search}"</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {search && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
            </p>
          )}
          {filtered.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
