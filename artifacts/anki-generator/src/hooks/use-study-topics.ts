import { useState, useEffect, useCallback } from "react";
import type { Topic } from "@/lib/study-planner/topics";
import {
  ALL_SUBJECT_GROUPS,
  getCustomGroups, saveCustomGroups,
  customGroupsToSubjectGroups,
  type CustomSubjectGroup,
} from "@/lib/study-planner/topics";

const PREFIX = "sp-topics-";

function readFromStorage(storageKey: string): Topic[] {
  try {
    const raw = localStorage.getItem(PREFIX + storageKey);
    return raw ? (JSON.parse(raw) as Topic[]) : [];
  } catch { return []; }
}

function writeToStorage(storageKey: string, topics: Topic[]): void {
  try { localStorage.setItem(PREFIX + storageKey, JSON.stringify(topics)); } catch {}
}

function readAll(extraKeys: string[] = []): Record<string, Topic[]> {
  const allKeys = [...new Set([...ALL_SUBJECT_GROUPS.map(g => g.storageKey), ...extraKeys])];
  return Object.fromEntries(allKeys.map(k => [k, readFromStorage(k)]));
}

export interface UseStudyTopicsResult {
  topicsMap: Record<string, Topic[]>;
  isLoading: boolean;
  customGroups: CustomSubjectGroup[];
  upsertTopics: (storageKey: string, topics: Topic[]) => void;
  getAllTopics: () => Topic[];
  updateCustomGroups: (groups: CustomSubjectGroup[]) => void;
}

export function useStudyTopics(): UseStudyTopicsResult {
  const [customGroups, setCustomGroupsState] = useState<CustomSubjectGroup[]>(() => getCustomGroups());
  const [topicsMap, setTopicsMap] = useState<Record<string, Topic[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const getCustomKeys = (groups: CustomSubjectGroup[]) =>
    groups.flatMap(g => g.subjects.map(s => s.storageKey));

  useEffect(() => {
    const cg = getCustomGroups();
    setCustomGroupsState(cg);
    setTopicsMap(readAll(getCustomKeys(cg)));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = () => {
      setTopicsMap(prev => readAll(getCustomKeys(customGroups)));
    };
    window.addEventListener("sp-topics-updated", handler);
    return () => window.removeEventListener("sp-topics-updated", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customGroups]);

  useEffect(() => {
    const handler = () => {
      const groups = getCustomGroups();
      setCustomGroupsState(groups);
      setTopicsMap(readAll(getCustomKeys(groups)));
    };
    window.addEventListener("sp-custom-groups-updated", handler);
    return () => window.removeEventListener("sp-custom-groups-updated", handler);
  }, []);

  const upsertTopics = useCallback((storageKey: string, topics: Topic[]) => {
    writeToStorage(storageKey, topics);
    setTopicsMap(prev => ({ ...prev, [storageKey]: topics }));
    window.dispatchEvent(new CustomEvent("sp-topics-updated"));
  }, []);

  const getAllTopics = useCallback((): Topic[] => {
    return Object.values(topicsMap).flat();
  }, [topicsMap]);

  const updateCustomGroups = useCallback((groups: CustomSubjectGroup[]) => {
    saveCustomGroups(groups);
    setCustomGroupsState(groups);
    setTopicsMap(readAll(getCustomKeys(groups)));
  }, []);

  return { topicsMap, isLoading, customGroups, upsertTopics, getAllTopics, updateCustomGroups };
}
