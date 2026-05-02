import { useLocation, useParams } from "wouter";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyTopicsContext } from "@/context/study-topics-context";
import { CUSTOM_COLOR_STYLES } from "@/lib/study-planner/topics";

export default function CustomGroupPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId ?? "";
  const [, nav] = useLocation();
  const { customGroups, topicsMap } = useStudyTopicsContext();

  const group = customGroups.find(g => g.id === groupId);

  if (!group) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">Subject group not found.</p>
        <Button variant="link" onClick={() => nav("/")}>← Back to home</Button>
      </div>
    );
  }

  const styles = CUSTOM_COLOR_STYLES[group.color] ?? CUSTOM_COLOR_STYLES.blue;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-xl">{group.emoji}</span>
        <h1 className="text-base font-semibold flex-1">{group.label}</h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav("/manage-subjects")}
          title="Manage subjects">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3 pb-24">
        {group.subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No sub-topics yet</p>
            <p className="text-xs text-muted-foreground mt-1">Go to Manage Subjects to add sub-topics.</p>
            <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => nav("/manage-subjects")}>
              Manage Subjects
            </Button>
          </div>
        ) : (
          group.subjects.map(s => {
            const topics = topicsMap[s.storageKey] ?? [];
            const done = topics.filter(t => t.status === "Done" || t.status === "Revised").length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
            return (
              <button
                key={s.id}
                onClick={() => nav(`/subject/${s.storageKey}`)}
                className="w-full text-left rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{topics.length} topics · {pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${styles.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
