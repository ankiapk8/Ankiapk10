import type { Topic } from "@/lib/study-planner/topics";
import { apiUrl } from "@/lib/utils";

type TopicsResponse = { topics: Record<string, Topic[]> };

export async function getAllTopics(): Promise<TopicsResponse> {
  const res = await fetch(apiUrl("/topics"), {
    credentials: "include",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load study topics");
  return res.json();
}

export async function upsertTopics(storageKey: string, topics: Topic[]): Promise<Topic[]> {
  const res = await fetch(apiUrl(`/topics/${encodeURIComponent(storageKey)}`), {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ topics }),
  });
  if (!res.ok) throw new Error("Failed to save study topics");
  const data = (await res.json()) as { topics: Topic[] };
  return data.topics;
}