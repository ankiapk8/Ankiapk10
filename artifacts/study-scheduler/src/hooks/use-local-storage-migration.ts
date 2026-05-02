import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ALL_SUBJECT_GROUPS, type Topic } from "@/lib/topics";
import { getGetAllTopicsQueryKey } from "@workspace/api-client-react";
import type { AuthUser } from "./use-auth";

const MIGRATION_FLAG = "topics_migrated_v1";

export function useLocalStorageMigration(user: AuthUser | null) {
  const queryClient = useQueryClient();
  const migrating = useRef(false);

  useEffect(() => {
    if (!user || migrating.current) return;
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    const keysWithData = ALL_SUBJECT_GROUPS.filter((g) => {
      const raw = localStorage.getItem(`topics-${g.storageKey}`);
      return raw && raw !== "[]";
    });

    if (keysWithData.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, "1");
      return;
    }

    migrating.current = true;

    const uploads = keysWithData.map(async (g) => {
      const raw = localStorage.getItem(`topics-${g.storageKey}`);
      if (!raw) return;
      try {
        const topics = JSON.parse(raw) as Topic[];
        await fetch(`/api/study-topics/${g.storageKey}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics }),
        });
        localStorage.removeItem(`topics-${g.storageKey}`);
      } catch {
        // silent — will retry next load
      }
    });

    Promise.all(uploads).then(() => {
      localStorage.setItem(MIGRATION_FLAG, "1");
      queryClient.invalidateQueries({ queryKey: getGetAllTopicsQueryKey() });
    });
  }, [user, queryClient]);
}
