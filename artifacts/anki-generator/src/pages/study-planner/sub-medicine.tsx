import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyTopicsContext } from "@/context/study-topics-context";

const SUBJECTS = [
  { label: "Dermatology", storageKey: "dermatology", path: "/sub-medicine/dermatology" },
  { label: "Family Medicine", storageKey: "family", path: "/sub-medicine/family" },
  { label: "Emergency", storageKey: "emergency", path: "/sub-medicine/emergency" },
  { label: "Forensic", storageKey: "forensic", path: "/sub-medicine/forensic" },
  { label: "Radiology", storageKey: "radiology", path: "/sub-medicine/radiology" },
];

export default function SubMedicine() {
  const [, nav] = useLocation();
  const { topicsMap } = useStudyTopicsContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg">🩺</span>
        <h1 className="text-base font-semibold">Sub Medicine</h1>
      </div>
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {SUBJECTS.map(s => {
          const topics = topicsMap[s.storageKey] ?? [];
          const done = topics.filter(t => t.status === "Done" || t.status === "Revised").length;
          const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
          return (
            <button
              key={s.storageKey}
              onClick={() => nav(s.path)}
              className="w-full text-left rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{s.label}</span>
                <span className="text-xs text-muted-foreground">{topics.length} topics · {pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
