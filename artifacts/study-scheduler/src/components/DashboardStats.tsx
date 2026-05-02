import { ALL_SUBJECT_GROUPS, type Topic } from "@/lib/topics";

interface DashboardStatsProps {
  allTopics: Record<string, Topic[]>;
}

export function DashboardStats({ allTopics }: DashboardStatsProps) {
  const allFlat = Object.values(allTopics).flat();
  const total = allFlat.length;

  if (total === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No topics yet. Add topics to see dashboard stats.
      </div>
    );
  }

  const high = allFlat.filter((t) => t.priority === "High").length;
  const done = allFlat.filter((t) => t.status === "Done" || t.status === "Revised").length;
  const notStarted = allFlat.filter((t) => t.status === "Not Started").length;
  const inProgress = allFlat.filter((t) => t.status === "In Progress").length;
  const revised = allFlat.filter((t) => t.status === "Revised").length;
  const doneOnly = allFlat.filter((t) => t.status === "Done").length;
  const lowCount = allFlat.filter((t) => t.priority === "Low").length;
  const medCount = allFlat.filter((t) => t.priority === "Medium").length;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Topics", value: total, color: "text-foreground", bg: "bg-muted/60" },
          { label: "High Priority", value: high, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Completed", value: done, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Not Started", value: notStarted, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/40" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl ${bg} border border-card-border p-3`}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Overall Progress</p>
          <p className="text-xs text-muted-foreground">{pct(done)}% complete</p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-slate-300 dark:bg-slate-600 h-full transition-all" style={{ width: `${pct(notStarted)}%` }} />
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${pct(inProgress)}%` }} />
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct(doneOnly)}%` }} />
          <div className="bg-sky-400 h-full transition-all" style={{ width: `${pct(revised)}%` }} />
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {[
            { label: "Not Started", count: notStarted, dot: "bg-slate-300 dark:bg-slate-600" },
            { label: "In Progress", count: inProgress, dot: "bg-amber-400" },
            { label: "Done", count: doneOnly, dot: "bg-emerald-500" },
            { label: "Revised", count: revised, dot: "bg-sky-400" },
          ].map(({ label, count, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-muted-foreground">{label} ({count})</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Priority Breakdown</p>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-red-500 h-full transition-all" style={{ width: `${pct(high)}%` }} />
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${pct(medCount)}%` }} />
          <div className="bg-blue-400 h-full transition-all" style={{ width: `${pct(lowCount)}%` }} />
        </div>
        <div className="flex gap-4 mt-2">
          {[
            { label: "High", count: high, dot: "bg-red-500" },
            { label: "Medium", count: medCount, dot: "bg-amber-400" },
            { label: "Low", count: lowCount, dot: "bg-blue-400" },
          ].map(({ label, count, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-muted-foreground">{label} ({count})</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Per-Subject Completion</p>
        <div className="space-y-2">
          {ALL_SUBJECT_GROUPS.filter((g) => (allTopics[g.storageKey]?.length ?? 0) > 0).map((g) => {
            const topics = allTopics[g.storageKey] ?? [];
            const subDone = topics.filter((t) => t.status === "Done" || t.status === "Revised").length;
            const subPct = topics.length > 0 ? Math.round((subDone / topics.length) * 100) : 0;
            return (
              <div key={g.storageKey}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{g.subjectLabel}</span>
                  <span className="text-xs text-muted-foreground">{subDone}/{topics.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${subPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
