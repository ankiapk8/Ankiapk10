import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

const ESTIMATED_BUILD_MS = 90_000;
const SUCCESS_DISPLAY_MS = 2400;
const FAILURE_DISPLAY_MS = 4000;

type Phase = "building" | "success" | "failure";

export function ApkBuildOverlay({
  isBuilding,
  buildFailed,
  startedAt,
  targetHost,
  errorMessage,
  optimisticBuildToken,
}: {
  isBuilding: boolean;
  buildFailed: boolean;
  startedAt: string | null;
  targetHost: string | null;
  errorMessage: string | null;
  optimisticBuildToken?: number;
}) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const [progress, setProgress] = useState(0);
  const [optimisticStartedAt, setOptimisticStartedAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isBuilding) {
      setPhase("building");
      setProgress(0);
    }
  }, [isBuilding, startedAt]);

  // Show immediately when the user clicks rebuild (optimistic) so the popup
  // doesn't have to wait for the next status poll to pick up "building".
  useEffect(() => {
    if (!optimisticBuildToken) return;
    setPhase("building");
    setProgress(0);
    setOptimisticStartedAt(new Date().toISOString());
  }, [optimisticBuildToken]);

  const effectiveStartedAt = startedAt ?? optimisticStartedAt;

  useEffect(() => {
    if (phase !== "building") return;
    const start = effectiveStartedAt
      ? new Date(effectiveStartedAt).getTime()
      : Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(98, (elapsed / ESTIMATED_BUILD_MS) * 100);
      setProgress(pct);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, effectiveStartedAt]);

  useEffect(() => {
    if (phase !== "building") return;
    if (isBuilding) return;
    if (buildFailed) {
      setPhase("failure");
      const t = window.setTimeout(() => setPhase(null), FAILURE_DISPLAY_MS);
      return () => window.clearTimeout(t);
    }
    setProgress(100);
    setPhase("success");
    const t = window.setTimeout(() => setPhase(null), SUCCESS_DISPLAY_MS);
    return () => window.clearTimeout(t);
  }, [isBuilding, buildFailed, phase]);

  const remainingSec = Math.max(
    0,
    Math.round((ESTIMATED_BUILD_MS * (100 - progress)) / 100 / 1000),
  );

  if (typeof document === "undefined") return null;

  const overlay = (
    <AnimatePresence>
      {phase && (
        <motion.div
          key="apk-build-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: "100dvh",
            width: "100vw",
            zIndex: 2147483646,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            pointerEvents: "none",
          }}
          aria-live="polite"
          role="status"
          data-testid="apk-build-overlay"
        >
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-white text-slate-800 shadow-2xl overflow-hidden"
            style={{ pointerEvents: "auto", maxHeight: "calc(100dvh - 2rem)" }}
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            {phase === "building" && (
              <BuildingBody
                progress={progress}
                remainingSec={remainingSec}
                targetHost={targetHost}
              />
            )}
            {phase === "success" && <SuccessBody targetHost={targetHost} />}
            {phase === "failure" && <FailureBody errorMessage={errorMessage} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

function BuildingBody({
  progress,
  remainingSec,
  targetHost,
}: {
  progress: number;
  remainingSec: number;
  targetHost: string | null;
}) {
  return (
    <>
      <div
        className="px-6 pt-7 pb-5 text-center text-white"
        style={{
          background:
            "linear-gradient(135deg, #16A34A 0%, #15803D 50%, #064E3B 100%)",
        }}
      >
        <motion.div
          className="mx-auto w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-3"
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Hammer className="w-8 h-8 text-yellow-200" strokeWidth={2.2} />
        </motion.div>
        <h2 className="text-xl font-bold tracking-tight">Updating your APK</h2>
        <p className="text-white/85 text-sm mt-1">
          Building a fresh Android app with your latest changes…
        </p>
      </div>

      <div className="px-6 pt-5 pb-6">
        <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "linear" }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
          <span className="tabular-nums">{Math.round(progress)}%</span>
          <span className="tabular-nums">
            {remainingSec > 0
              ? `~${remainingSec}s remaining`
              : "Wrapping up…"}
          </span>
        </div>
        {targetHost && (
          <p className="mt-3 text-[11px] text-slate-500 text-center truncate">
            Targeting <span className="font-mono">{targetHost}</span>
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-400 text-center">
          You can keep using the site — this will close on its own.
        </p>
      </div>
    </>
  );
}

function SuccessBody({ targetHost }: { targetHost: string | null }) {
  return (
    <div className="px-6 py-7 text-center">
      <motion.div
        className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <CheckCircle2 className="w-9 h-9 text-emerald-600" strokeWidth={2.2} />
      </motion.div>
      <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center justify-center gap-1.5">
        APK updated <Sparkles className="w-4 h-4 text-amber-500" />
      </h2>
      <p className="text-sm text-slate-600 mt-1">
        Your fresh APK is ready to download
        {targetHost ? (
          <>
            {" "}for <span className="font-mono text-slate-700">{targetHost}</span>
          </>
        ) : null}
        .
      </p>
    </div>
  );
}

function FailureBody({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="px-6 py-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <AlertTriangle className="w-7 h-7 text-red-600" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-slate-800">
        Build didn't finish
      </h2>
      <p className="text-sm text-slate-600 mt-1 break-words">
        {errorMessage || "Something went wrong while building the APK."}
      </p>
    </div>
  );
}
