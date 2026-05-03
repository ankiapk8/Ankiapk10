import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ChevronDown, ChevronUp, RotateCcw, Lock, FlaskConical, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") ?? "";
const LS_KEY = "dev-pro-override";
const LS_SIM_KEY = "dev-simulated";

interface DevStatus {
  authenticated: boolean;
  userId: string | null;
  devIsPro: boolean | null;
  simulated: boolean;
}

async function fetchDevStatus(): Promise<DevStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/dev/status`, { credentials: "include" });
    if (!res.ok) return { authenticated: false, userId: null, devIsPro: null, simulated: false };
    return res.json();
  } catch {
    return { authenticated: false, userId: null, devIsPro: null, simulated: false };
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

async function simulateSubscribe(): Promise<void> {
  await fetch(`${API_BASE}/api/dev/simulate-subscribe`, {
    method: "POST",
    credentials: "include",
  });
}

async function cancelSimulatedSubscribe(): Promise<void> {
  await fetch(`${API_BASE}/api/dev/simulate-subscribe`, {
    method: "DELETE",
    credentials: "include",
  });
}

export function DevPlanBadge() {
  const [state, setState] = useState<{ isPro: boolean | null; simulated: boolean }>({
    isPro: null,
    simulated: false,
  });

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem(LS_KEY);
      const sim = localStorage.getItem(LS_SIM_KEY) === "true";
      if (stored === "true") setState({ isPro: true, simulated: sim });
      else if (stored === "false") setState({ isPro: false, simulated: false });
      else setState({ isPro: null, simulated: false });
    };
    read();
    window.addEventListener("dev-plan-changed", read);
    return () => window.removeEventListener("dev-plan-changed", read);
  }, []);

  if (state.isPro === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide border ${
        state.isPro
          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300/50"
          : "bg-muted text-muted-foreground border-border"
      }`}
      title="Dev subscription override"
    >
      {state.isPro ? <Crown className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
      {state.isPro
        ? state.simulated ? "SIMULATED PRO" : "DEV PRO"
        : "DEV FREE"}
    </span>
  );
}

function syncToLocalStorage(isPro: boolean | null, simulated: boolean) {
  if (isPro === null) {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_SIM_KEY);
  } else {
    localStorage.setItem(LS_KEY, String(isPro));
    if (simulated) localStorage.setItem(LS_SIM_KEY, "true");
    else localStorage.removeItem(LS_SIM_KEY);
  }
  window.dispatchEvent(new Event("dev-plan-changed"));
}

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function refresh() {
    const s = await fetchDevStatus();
    setStatus(s);
    syncToLocalStorage(s.devIsPro, s.simulated);
  }

  useEffect(() => {
    refresh();

    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) {
      const isPro = stored === "true";
      const wasSimulated = localStorage.getItem(LS_SIM_KEY) === "true";
      if (wasSimulated && isPro) {
        simulateSubscribe().then(() => refresh());
      } else {
        setDevPro(isPro).then(() => refresh());
      }
    }
  }, []);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["subscription/status"] });
    queryClient.invalidateQueries({ queryKey: ["subscription/usage"] });
  }

  async function handleSet(isPro: boolean) {
    setLoading(true);
    await setDevPro(isPro);
    await refresh();
    invalidate();
    setLoading(false);
  }

  async function handleClear() {
    setLoading(true);
    await clearDevOverride();
    await refresh();
    invalidate();
    setLoading(false);
  }

  async function handleSimulateSubscribe() {
    setLoading(true);
    await simulateSubscribe();
    await refresh();
    invalidate();
    setLoading(false);
  }

  async function handleCancelSimulated() {
    setLoading(true);
    await cancelSimulatedSubscribe();
    await refresh();
    invalidate();
    setLoading(false);
  }

  const devIsPro = status?.devIsPro;
  const isSimulated = status?.simulated ?? false;
  const hasOverride = devIsPro !== null && devIsPro !== undefined;

  function headerBadgeLabel() {
    if (!hasOverride) return "REAL";
    if (devIsPro && isSimulated) return "SIMULATED PRO";
    if (devIsPro) return "PRO";
    return "FREE";
  }

  function headerBadgeClass() {
    if (!hasOverride) return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
    if (devIsPro && isSimulated) return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
    if (devIsPro) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    return "bg-muted text-muted-foreground";
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-violet-400/40 bg-background/95 backdrop-blur shadow-xl shadow-violet-500/10 overflow-hidden"
        style={{ width: "17rem" }}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
          <span className="text-violet-600 dark:text-violet-400 font-bold tracking-wide uppercase">Dev Mode</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${headerBadgeClass()}`}>
            {headerBadgeLabel()}
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

                <div className="text-muted-foreground/70 text-[10px] uppercase tracking-widest pt-0.5">
                  Subscription override
                </div>

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
                      hasOverride && devIsPro && !isSimulated
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-border hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-muted-foreground hover:text-amber-600"
                    }`}
                  >
                    <Crown className="h-3 w-3" />
                    Pro
                  </button>
                </div>

                <div className="border-t border-border/40 pt-2">
                  <div className="text-muted-foreground/70 text-[10px] uppercase tracking-widest mb-1.5">
                    Simulate Stripe (no key needed)
                  </div>
                  {!isSimulated ? (
                    <button
                      type="button"
                      disabled={loading || !status?.authenticated}
                      onClick={handleSimulateSubscribe}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-violet-400/60 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-violet-600 dark:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!status?.authenticated ? "Log in first to use simulate" : ""}
                    >
                      <FlaskConical className="h-3 w-3" />
                      Simulate Subscribe
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 text-violet-700 dark:text-violet-300">
                        <FlaskConical className="h-3 w-3 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Simulated Pro active</span>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleCancelSimulated}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-red-400/60 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 dark:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Cancel Simulated Sub
                      </button>
                    </div>
                  )}
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
                    <span>
                      {!hasOverride
                        ? "none (real DB)"
                        : devIsPro && isSimulated
                          ? "Simulated Pro"
                          : devIsPro
                            ? "Pro forced"
                            : "Free forced"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persisted</span>
                    <span>{localStorage.getItem(LS_KEY) !== null ? "yes (localStorage)" : "no"}</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-1.5 text-[9px] text-muted-foreground/40 leading-relaxed">
                  Dev panel only — hidden in production builds.
                  <br />
                  Override persists across refreshes.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
