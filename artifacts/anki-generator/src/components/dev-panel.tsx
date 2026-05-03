import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, User, ChevronDown, ChevronUp, RotateCcw, Zap, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") ?? "";

interface DevStatus {
  authenticated: boolean;
  userId: string | null;
  devIsPro: boolean | null;
}

async function fetchDevStatus(): Promise<DevStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/dev/status`, { credentials: "include" });
    if (!res.ok) return { authenticated: false, userId: null, devIsPro: null };
    return res.json();
  } catch {
    return { authenticated: false, userId: null, devIsPro: null };
  }
}

async function setDevPro(isPro: boolean): Promise<void> {
  await fetch(`${API_BASE}/api/dev/set-pro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isPro }),
  });
}

async function clearDevOverride(): Promise<void> {
  await fetch(`${API_BASE}/api/dev/set-pro`, {
    method: "DELETE",
    credentials: "include",
  });
}

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function refresh() {
    const s = await fetchDevStatus();
    setStatus(s);
  }

  useEffect(() => { refresh(); }, []);

  async function handleSet(isPro: boolean) {
    setLoading(true);
    await setDevPro(isPro);
    await refresh();
    queryClient.invalidateQueries({ queryKey: ["subscription/status"] });
    queryClient.invalidateQueries({ queryKey: ["subscription/usage"] });
    setLoading(false);
  }

  async function handleClear() {
    setLoading(true);
    await clearDevOverride();
    await refresh();
    queryClient.invalidateQueries({ queryKey: ["subscription/status"] });
    setLoading(false);
  }

  const devIsPro = status?.devIsPro;
  const hasOverride = devIsPro !== null && devIsPro !== undefined;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-violet-400/40 bg-background/95 backdrop-blur shadow-xl shadow-violet-500/10 overflow-hidden w-64"
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
          <span className="text-violet-600 dark:text-violet-400 font-bold tracking-wide uppercase">Dev Mode</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            hasOverride
              ? devIsPro
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
              : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          }`}>
            {hasOverride ? (devIsPro ? "PRO" : "FREE") : "REAL"}
          </span>
          <span className="ml-auto text-muted-foreground">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-border/40">
                <div className="text-muted-foreground/70 text-[10px] uppercase tracking-widest pt-0.5">Subscription override</div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSet(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border transition-all ${
                      hasOverride && !devIsPro
                        ? "border-foreground/50 bg-foreground text-background"
                        : "border-border hover:border-foreground/30 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Lock className="h-3 w-3" />
                    Free
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSet(true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border transition-all ${
                      hasOverride && devIsPro
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-border hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-muted-foreground hover:text-amber-600"
                    }`}
                  >
                    <Crown className="h-3 w-3" />
                    Pro
                  </button>
                </div>

                {hasOverride && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleClear}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 rounded-md transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to real subscription
                  </button>
                )}

                <div className="border-t border-border/40 pt-2 space-y-1 text-[10px] text-muted-foreground/60">
                  <div className="flex justify-between">
                    <span>Authenticated</span>
                    <span className={status?.authenticated ? "text-emerald-500" : "text-red-400"}>
                      {status?.authenticated ? "yes" : "no"}
                    </span>
                  </div>
                  {status?.userId && (
                    <div className="flex justify-between">
                      <span>User ID</span>
                      <span className="text-foreground/50 truncate max-w-[110px]">{status.userId.slice(0, 8)}…</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Override</span>
                    <span>{hasOverride ? (devIsPro ? "Pro forced" : "Free forced") : "none (real DB)"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
