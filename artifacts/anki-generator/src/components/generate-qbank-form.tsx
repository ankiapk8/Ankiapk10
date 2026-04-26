import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDecks, getListDecksQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/utils";
import { Loader2, Stethoscope, FolderOpen, FileText, ListOrdered, Wand2 } from "lucide-react";
import type { Deck } from "@workspace/api-client-react/src/generated/api.schemas";

type DeckWithParent = Deck & { parentId?: number | null };

interface GenerateQbankFormProps {
  defaultParentId?: number | null;
  prefilledText?: string;
  prefilledDeckName?: string;
  onDone?: (newDeckId?: number) => void;
}

function buildParentOptions(allDecks: DeckWithParent[]): { id: number; label: string; depth: number }[] {
  const rootDecks = allDecks.filter(d => !d.parentId);
  const byParent = new Map<number, DeckWithParent[]>();
  allDecks.filter(d => d.parentId).forEach(d => {
    const pid = d.parentId!;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(d);
  });
  const result: { id: number; label: string; depth: number }[] = [];
  function walk(deck: DeckWithParent, label: string, depth: number) {
    result.push({ id: deck.id, label, depth });
    const children = byParent.get(deck.id) ?? [];
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      walk(child, `${label} › ${child.name}`, depth + 1);
    }
  }
  for (const d of rootDecks.sort((a, b) => a.name.localeCompare(b.name))) {
    walk(d, d.name, 0);
  }
  return result;
}

export function GenerateQbankForm({ defaultParentId, prefilledText, prefilledDeckName, onDone }: GenerateQbankFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allDecks } = useListDecks();

  const [text, setText] = useState(prefilledText ?? "");
  const [deckName, setDeckName] = useState(prefilledDeckName ?? "");
  const [questionCount, setQuestionCount] = useState<number | "">(20);
  const [customPrompt, setCustomPrompt] = useState("");
  const [parentId, setParentId] = useState<string>(defaultParentId?.toString() ?? "none");
  const [isGenerating, setIsGenerating] = useState(false);

  const parentOptions = buildParentOptions((allDecks as DeckWithParent[]) ?? []);
  const selectedParent = parentOptions.find(o => o.id.toString() === parentId);

  const handleGenerate = async () => {
    if (!text.trim() || text.trim().length < 10) {
      toast({ title: "Add some source text first.", variant: "destructive" });
      return;
    }
    if (!deckName.trim()) {
      toast({ title: "Give your question bank a name.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch(apiUrl("api/generate-qbank"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          deckName,
          questionCount: typeof questionCount === "number" ? questionCount : 20,
          parentId: parentId === "none" ? null : parseInt(parentId, 10),
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? `Generation failed (${resp.status})`);
      }
      const data = (await resp.json()) as { deck: { id: number }; generatedCount: number };
      queryClient.invalidateQueries({ queryKey: getListDecksQueryKey() });
      toast({
        title: "Question bank ready",
        description: `${data.generatedCount} MCQ${data.generatedCount === 1 ? "" : "s"} created.`,
      });
      setText("");
      setDeckName("");
      setCustomPrompt("");
      onDone?.(data.deck.id);
    } catch (e) {
      toast({
        title: "Could not generate question bank",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-md bg-violet-500/15 text-violet-600 flex items-center justify-center shrink-0">
          <Stethoscope className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs leading-snug">
          <div className="font-semibold text-violet-700 dark:text-violet-300 mb-0.5">UWorld-style Question Bank</div>
          <span className="text-muted-foreground">Generates MCQs only, with full distractors and detailed explanations. Use the study screen to test yourself one question at a time.</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Parent Topic <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger className="h-8 text-sm">
            {parentId === "none" || !selectedParent
              ? <span className="text-muted-foreground">No parent — standalone question bank</span>
              : <span className="truncate">{selectedParent.label}</span>
            }
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="none">No parent — standalone question bank</SelectItem>
            {parentOptions.map(opt => (
              <SelectItem key={opt.id} value={opt.id.toString()} className="py-1.5">
                <span className="flex items-center gap-1 min-w-0">
                  {opt.depth > 0 && (
                    <span className="text-muted-foreground shrink-0 text-xs font-mono">
                      {"  ".repeat(opt.depth - 1)}{"└─"}
                    </span>
                  )}
                  <span className="truncate">{opt.label.split(" › ").pop()}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qbankName" className="text-sm flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Question Bank Name
        </Label>
        <Input
          id="qbankName"
          value={deckName}
          onChange={e => setDeckName(e.target.value)}
          placeholder="e.g. Cardiology USMLE QBank"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qbankText" className="text-sm flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          Source Material
        </Label>
        <Textarea
          id="qbankText"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste textbook chapters, lecture notes, or guideline excerpts. The AI will turn this into vignette-style MCQs."
          rows={9}
          className="resize-none font-mono text-xs"
        />
        <div className="text-[11px] text-muted-foreground">{text.length.toLocaleString()} characters</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="qbankCount" className="text-sm flex items-center gap-1.5">
            <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
            Target Question Count
          </Label>
          <Input
            id="qbankCount"
            type="number"
            min={1}
            max={200}
            value={questionCount}
            onChange={e => {
              const v = e.target.value;
              setQuestionCount(v === "" ? "" : Math.max(1, Math.min(200, parseInt(v, 10) || 1)));
            }}
          />
          <div className="text-[11px] text-muted-foreground">The AI may add more if your text is dense, or fewer if it's thin.</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="qbankCustom" className="text-sm flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
          Style Instructions <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="qbankCustom"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder='e.g. "USMLE Step 1 style", "high-yield clinical vignettes only", "include lab values"'
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      <Button
        className="w-full h-11 shadow-sm font-medium gap-2"
        size="lg"
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim() || !deckName.trim()}
      >
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" />Generating MCQs…</>
          : <><Stethoscope className="h-4 w-4" />Generate Question Bank</>
        }
      </Button>
    </div>
  );
}
