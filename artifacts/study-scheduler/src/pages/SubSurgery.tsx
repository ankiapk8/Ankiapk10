import { Link } from "wouter";
import { useGetAllTopics } from "@workspace/api-client-react";
import { ChevronLeft, Scissors } from "lucide-react";
import { ALL_SUBJECT_GROUPS, type Topic } from "@/lib/topics";

const SUB_SURGERY_KEYS = ["ent", "ophthalmology", "orthopedic", "neurosurgery", "urology"];

export function SubSurgery() {
  const allTopicsData = useGetAllTopics();
  const allTopics: Record<string, Topic[]> = (allTopicsData as { topics?: Record<string, Topic[]> })?.topics ?? {};

  const subjects = ALL_SUBJECT_GROUPS.filter((g) => SUB_SURGERY_KEYS.includes(g.storageKey));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/">
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Sub Surgery</h1>
          </div>
        </div>

        <div className="grid gap-3">
          {subjects.map((g) => {
            const count = allTopics[g.storageKey]?.length ?? 0;
            const done = allTopics[g.storageKey]?.filter((t) => t.status === "Done" || t.status === "Revised").length ?? 0;
            return (
              <Link key={g.storageKey} href={`/sub-surgery/${g.storageKey}`}>
                <div
                  className="rounded-xl border border-card-border bg-card p-4 cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
                  data-testid={`card-subject-${g.storageKey}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{g.subjectLabel}</p>
                    <p className="text-xs text-muted-foreground">{done}/{count} done</p>
                  </div>
                  {count > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${count > 0 ? Math.round((done / count) * 100) : 0}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
