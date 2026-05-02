import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, X, Volume2, VolumeX, Timer } from "lucide-react";

/* ─────────────────────────────────────────────
   Cycle definition: 40·5·40·5·40·15
───────────────────────────────────────────── */
const CYCLE = [
  { label: "Focus",       tag: "FOCUS",      emoji: "🎯", minutes: 40, accent: "#10b981", track: "#10b98130" },
  { label: "Short Break", tag: "BREAK",      emoji: "☕", minutes: 5,  accent: "#3b82f6", track: "#3b82f630" },
  { label: "Focus",       tag: "FOCUS",      emoji: "🎯", minutes: 40, accent: "#10b981", track: "#10b98130" },
  { label: "Short Break", tag: "BREAK",      emoji: "☕", minutes: 5,  accent: "#3b82f6", track: "#3b82f630" },
  { label: "Focus",       tag: "FOCUS",      emoji: "🎯", minutes: 40, accent: "#10b981", track: "#10b98130" },
  { label: "Long Break",  tag: "LONG BREAK", emoji: "🌿", minutes: 15, accent: "#8b5cf6", track: "#8b5cf630" },
] as const;

function toSec(m: number) { return m * 60; }
function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   Web Audio chimes (comfortable sine tones)
───────────────────────────────────────────── */
function playChime(type: "end" | "start" | "tick") {
  try {
    const ctx = new AudioContext();
    const schedule: [number, number, number][] = // [freq, delay, vol]
      type === "end"   ? [[523.25, 0, 0.16], [659.25, 0.22, 0.16], [783.99, 0.44, 0.16]] :
      type === "start" ? [[523.25, 0, 0.12]] :
      /* tick */         [[880, 0, 0.06], [880, 0.12, 0.06]];

    schedule.forEach(([freq, delay, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  } catch { /* AudioContext unavailable */ }
}

/* ─────────────────────────────────────────────
   Circular arc clock SVG
───────────────────────────────────────────── */
const R  = 54;
const SW = 6.5;
const SZ = (R + SW + 2) * 2;
const C  = 2 * Math.PI * R;

function ArcClock({ progress, accent, track, children }: {
  progress: number; accent: string; track: string; children: React.ReactNode;
}) {
  return (
    <div className="relative" style={{ width: SZ, height: SZ }}>
      <svg width={SZ} height={SZ} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none"
          stroke={track} strokeWidth={SW} />
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none"
          stroke={accent} strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.max(0, Math.min(1, progress)))}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Phase sequence pills
───────────────────────────────────────────── */
function PhaseBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {CYCLE.map((p, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <motion.div
              animate={{ width: active ? 24 : 8, opacity: active ? 1 : done ? 0.45 : 0.2 }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
              style={{ backgroundColor: p.accent, minWidth: 8 }}
            />
            <span className="text-[9px] font-mono text-muted-foreground/60"
              style={{ color: active ? p.accent : undefined }}>
              {p.minutes}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function PomodoroTimer() {
  const [open,      setOpen]      = useState(false);
  const [phaseIdx,  setPhaseIdx]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(toSec(CYCLE[0].minutes));
  const [running,   setRunning]   = useState(false);
  const [soundOn,   setSoundOn]   = useState(true);
  const [flash,     setFlash]     = useState<string | null>(null);
  const [started,   setStarted]   = useState(false); // has ever been started

  const stateRef = useRef({ phaseIdx, soundOn });
  stateRef.current = { phaseIdx, soundOn };

  /* ── timer tick ── */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        /* 1-minute warning tick */
        if (prev === 61 && stateRef.current.soundOn) playChime("tick");

        if (prev <= 1) {
          const { phaseIdx: pi, soundOn: so } = stateRef.current;
          if (so) playChime("end");
          const next = (pi + 1) % CYCLE.length;
          setPhaseIdx(next);
          setFlash(CYCLE[next].label);
          setTimeout(() => {
            setFlash(null);
            if (so) playChime("start");
          }, 2200);
          return toSec(CYCLE[next].minutes);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const phase    = CYCLE[phaseIdx];
  const duration = toSec(phase.minutes);
  const progress = timeLeft / duration;

  const toggle = () => {
    if (!started) {
      setStarted(true);
      if (soundOn) playChime("start");
    }
    setRunning(r => !r);
  };

  const skip = () => {
    const next = (phaseIdx + 1) % CYCLE.length;
    setPhaseIdx(next);
    setTimeLeft(toSec(CYCLE[next].minutes));
  };

  const reset = () => {
    setRunning(false);
    setStarted(false);
    setPhaseIdx(0);
    setTimeLeft(toSec(CYCLE[0].minutes));
  };

  /* ─ Header badge ─ */
  const badge = (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => setOpen(o => !o)}
      className={`relative flex items-center gap-1.5 h-8 rounded-full border transition-all select-none ${
        running
          ? "pl-2.5 pr-3 font-mono text-xs font-bold"
          : "w-8 justify-center"
      } ${
        running
          ? "border-transparent shadow-sm"
          : "border-border/60 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      style={running ? {
        backgroundColor: phase.accent + "1a",
        borderColor: phase.accent + "55",
        color: phase.accent,
      } : {}}
      title="Pomodoro timer"
    >
      {running ? (
        <>
          <span className="text-[10px]">{phase.emoji}</span>
          <span>{fmt(timeLeft)}</span>
        </>
      ) : started ? (
        <>
          <Timer className="h-4 w-4" />
          {!running && <span className="text-[10px] font-mono ml-0.5 text-muted-foreground/70">{fmt(timeLeft)}</span>}
        </>
      ) : (
        <Timer className="h-4 w-4" />
      )}
      {/* Running pulse ring */}
      {running && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px solid ${phase.accent}` }}
          animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );

  /* ─ Panel ─ */
  const panel = (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-[58px] right-3 z-[60] w-[248px] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Phase flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
            style={{ backgroundColor: phase.accent + "22" }}
          >
            <span className="text-3xl mb-1">{phase.emoji}</span>
            <span className="text-sm font-bold" style={{ color: phase.accent }}>{flash}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Starting now…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{phase.emoji}</span>
          <span className="text-xs font-bold tracking-widest uppercase"
            style={{ color: phase.accent }}>
            {phase.tag}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setSoundOn(s => !s)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            title={soundOn ? "Mute sounds" : "Enable sounds"}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Clock */}
      <div className="flex flex-col items-center py-3 gap-1">
        <ArcClock progress={progress} accent={phase.accent} track={phase.track}>
          <span className="text-2xl font-mono font-bold tabular-nums tracking-tight">
            {fmt(timeLeft)}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
            {`${Math.ceil(timeLeft / 60)} min left`}
          </span>
        </ArcClock>
      </div>

      {/* Phase bar */}
      <div className="px-4 pb-3">
        <PhaseBar current={phaseIdx} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4">
        {/* Reset */}
        <button
          onClick={reset}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Play / Pause (primary) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className="h-12 w-12 flex items-center justify-center rounded-full text-white shadow-lg transition-colors"
          style={{ backgroundColor: phase.accent }}
          title={running ? "Pause" : "Start"}
        >
          {running
            ? <Pause className="h-5 w-5 fill-white" />
            : <Play  className="h-5 w-5 fill-white ml-0.5" />
          }
        </motion.button>

        {/* Skip */}
        <button
          onClick={skip}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Skip to next phase"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cycle label */}
      <div className="pb-3 text-center text-[10px] text-muted-foreground/50 font-mono tracking-wide">
        Round {Math.floor(phaseIdx / CYCLE.length) + 1} · Phase {phaseIdx + 1} of {CYCLE.length}
      </div>
    </motion.div>
  );

  return (
    <>
      {badge}
      <AnimatePresence>
        {open && panel}
      </AnimatePresence>
      {/* Backdrop (close on outside click) */}
      {open && (
        <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
