import { useState, useEffect, useCallback } from "react";
import type { Topic } from "@/lib/study-planner/topics";
import { ALL_SUBJECT_GROUPS } from "@/lib/study-planner/topics";

const PREFIX = "sp-topics-";

function readFromStorage(storageKey: string): Topic[] {
  try {
    const raw = localStorage.getItem(PREFIX + storageKey);
    return raw ? (JSON.parse(raw) as Topic[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(storageKey: string, topics: Topic[]): void {
  try {
    localStorage.setItem(PREFIX + storageKey, JSON.stringify(topics));
  } catch { /* ignore */ }
}

function readAll(): Record<string, Topic[]> {
  return Object.fromEntries(
    ALL_SUBJECT_GROUPS.map(g => [g.storageKey, readFromStorage(g.storageKey)])
  );
}

export interface UseStudyTopicsResult {
  topicsMap: Record<string, Topic[]>;
  isLoading: boolean;
  upsertTopics: (storageKey: string, topics: Topic[]) => void;
  getAllTopics: () => Topic[];
}

export function useStudyTopics(): UseStudyTopicsResult {
  const [topicsMap, setTopicsMap] = useState<Record<string, Topic[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTopicsMap(readAll());
    setIsLoading(false);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = () => setTopicsMap(readAll());
    window.addEventListener("sp-topics-updated", handler);
    return () => window.removeEventListener("sp-topics-updated", handler);
  }, []);

  const upsertTopics = useCallback((storageKey: string, topics: Topic[]) => {
    writeToStorage(storageKey, topics);
    setTopicsMap(prev => ({ ...prev, [storageKey]: topics }));
    window.dispatchEvent(new CustomEvent("sp-topics-updated"));
  }, []);

  const getAllTopics = useCallback((): Topic[] => {
    return Object.values(topicsMap).flat();
  }, [topicsMap]);

  return { topicsMap, isLoading, upsertTopics, getAllTopics };
}
