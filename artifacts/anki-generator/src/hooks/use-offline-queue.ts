import { useEffect, useRef, useState, useCallback } from "react";

export type QueuedGeneration = {
  id: string;
  deckName: string;
  text: string;
  numCards: number;
  type?: "deck" | "qbank";
  customPrompt?: string;
  createdAt: number;
};

const DB_NAME = "ankigen-offline";
const STORE_NAME = "queue";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbEnqueue(item: QueuedGeneration): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll(): Promise<QueuedGeneration[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function dbRemove(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function useOfflineQueue() {
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const n = await dbCount();
      setQueueCount(n);
    } catch {}
  }, []);

  const enqueue = useCallback(async (item: Omit<QueuedGeneration, "id" | "createdAt">) => {
    const full: QueuedGeneration = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    };
    await dbEnqueue(full);
    await refreshCount();
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("ankigen-sync-queue");
      } catch {}
    }
  }, [refreshCount]);

  const syncQueue = useCallback(async (onSyncItem?: (item: QueuedGeneration) => Promise<boolean>) => {
    if (syncingRef.current || !navigator.onLine) return;
    const items = await dbGetAll();
    if (items.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    for (const item of items) {
      try {
        const ok = onSyncItem ? await onSyncItem(item) : false;
        if (ok) await dbRemove(item.id);
      } catch {}
    }

    await refreshCount();
    syncingRef.current = false;
    setIsSyncing(false);
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      refreshCount();
    };

    const handleSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "SYNC_QUEUE") syncQueue();
    };

    window.addEventListener("online", handleOnline);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [refreshCount, syncQueue]);

  return { queueCount, isSyncing, enqueue, syncQueue, refreshCount, dbGetAll };
}
