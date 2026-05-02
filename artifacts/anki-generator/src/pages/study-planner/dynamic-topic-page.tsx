import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicManager } from "@/components/study-planner/topic-manager";
import { useStudyTopicsContext } from "@/context/study-topics-context";

export default function DynamicTopicPage() {
  const params = useParams<{ storageKey: string }>();
  const storageKey = params?.storageKey ?? "";
  const [, nav] = useLocation();
  const { customGroups } = useStudyTopicsContext();

  let config: { label: string; parentLabel: string; parentId: string } | null = null;
  for (const g of customGroups) {
    const s = g.subjects.find(s => s.storageKey === storageKey);
    if (s) { config = { label: s.label, parentLabel: g.label, parentId: g.id }; break; }
  }

  if (!config) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">Subject not found.</p>
        <Button variant="link" onClick={() => nav("/")}>← Back to home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon"
          onClick={() => nav(`/custom/${config!.parentId}`)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-semibold">{config.label}</h1>
          <p className="text-xs text-muted-foreground">{config.parentLabel}</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <TopicManager
          storageKey={storageKey}
          subjectLabel={config.label}
          parentLabel={config.parentLabel}
        />
      </div>
    </div>
  );
}
