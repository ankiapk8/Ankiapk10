import { Link } from "wouter";
import { useGetAllTopics } from "@workspace/api-client-react";
import { ChevronLeft } from "lucide-react";
import { TopicManager } from "@/components/TopicManager";
import { scheduleTopics, getScheduleStartDate, ALL_SUBJECT_GROUPS, type Topic } from "@/lib/topics";

interface TopicPageProps {
  storageKey: string;
  backPath: string;
}

export function TopicPage({ storageKey, backPath }: TopicPageProps) {
  const allTopicsData = useGetAllTopics();
  const allTopics: Record<string, Topic[]> = (allTopicsData as { topics?: Record<string, Topic[]> })?.topics ?? {};

  const group = ALL_SUBJECT_GROUPS.find((g) => g.storageKey === storageKey);
  const topics = allTopics[storageKey] ?? [];

  const startDate = getScheduleStartDate();
  const scheduledItems = scheduleTopics(allTopics, startDate).filter((i) => i.storageKey === storageKey);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href={backPath}>
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{group?.subjectLabel ?? storageKey}</h1>
        </div>

        {allTopicsData && (
          <TopicManager
            storageKey={storageKey}
            subjectLabel={group?.subjectLabel ?? storageKey}
            topics={topics}
            scheduledItems={scheduledItems}
          />
        )}
      </div>
    </div>
  );
}
