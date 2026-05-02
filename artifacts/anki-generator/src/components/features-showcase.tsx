import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, BookOpen, Image, Target, FlaskConical,
  Network, LayoutDashboard, Download,
  ChevronLeft, ChevronRight,
  FileText, CheckCircle2, XCircle, BarChart2,
  Flame, Package,
  FileImage, MessageSquarePlus, Star,
} from "lucide-react";
import { useDarkMode } from "@/hooks/use-dark-mode";

// ─── Animated preview widgets (same logic as splash-screen) ────────────────

function PreviewGeneration({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const loop = () => {
      const t1 = setTimeout(() => setStep(1), 600);
      const t2 = setTimeout(() => setStep(2), 1400);
      const t3 = setTimeout(() => setStep(3), 2200);
      const t4 = setTimeout(() => { setStep(0); }, 4000);
      return [t1, t2, t3, t4];
    };
    const ids = loop();
    return () => ids.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 800);
    return () => clearTimeout(t);
  }, [step]);

  const surface = isDark ? "bg-white/8 border-white/10" : "bg-black/5 border-black/8";
  const text = isDark ? "text-white/60" : "text-black/50";
  const sub = isDark ? "text-white/30" : "text-black/25";
  const cardBg = isDark ? "bg-white/6 border-white/8" : "bg-white/80 border-black/8";

  return (
    <div className="w-full h-full flex flex-col gap-1.5 justify-center px-1">
      <motion.div className={`rounded-lg border border-dashed ${surface} flex items-center gap-2 px-3 py-2`}
        animate={{ borderColor: step >= 1 ? "#34d399aa" : undefined }}>
        <motion.div animate={{ rotate: step >= 1 ? [0, -8, 8, 0] : 0 }} transition={{ duration: 0.4 }}>
          <FileText className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-medium truncate ${text}`}>
            {step === 0 ? "Drop PDF or image here…" : "lecture_notes.pdf"}
          </div>
          {step >= 1 && (
            <motion.div className="mt-1 h-1 rounded-full overflow-hidden bg-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#34d399,#14b8a6)" }}
                initial={{ width: "0%" }} animate={{ width: step >= 2 ? "100%" : "55%" }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </motion.div>
          )}
        </div>
        {step >= 2 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#34d399" }} />
          </motion.div>
        )}
      </motion.div>
      <div className="flex gap-1.5">
        {["Mitosis", "Meiosis", "Osmosis"].map((label, i) => (
          <motion.div key={label} className={`flex-1 rounded-md border ${cardBg} p-1.5`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 6 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}>
            <div className={`text-[9px] font-semibold truncate ${text}`}>{label}</div>
            <div className={`text-[8px] mt-0.5 truncate ${sub}`}>Definition</div>
          </motion.div>
        ))}
      </div>
      {step >= 3 && (
        <motion.div className="text-center text-[9px] font-medium" style={{ color: "#34d399" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          ✓ 24 flashcards generated
        </motion.div>
      )}
    </div>
  );
}

function PreviewVisualDetection({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    const t4 = setTimeout(() => setStep(0), 4200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 800);
    return () => clearTimeout(t);
  }, [step]);

  const imgBg = isDark ? "bg-white/6" : "bg-black/5";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full">
        <div className={`rounded-lg ${imgBg} border ${isDark ? "border-white/8" : "border-black/8"} p-2 relative overflow-hidden`}>
          <div className="space-y-1 mb-2">
            {[80, 65, 72].map((w, i) => (
              <div key={i} className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-black/8"}`} style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="relative mx-auto w-3/4 h-14 rounded-md overflow-hidden"
            style={{ background: isDark ? "hsl(239 50% 18%)" : "hsl(239 50% 93%)" }}>
            <div className="absolute inset-2 flex items-center justify-around">
              {["A", "B", "C"].map((l, i) => (
                <div key={l} className="flex flex-col items-center gap-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ background: "#818cf8aa", color: "#fff" }}>{l}</div>
                  {i < 2 && <div className="absolute" style={{ left: `${28 + i * 32}%`, top: "50%", width: "20%", height: "1px", background: "#818cf888" }} />}
                </div>
              ))}
            </div>
            <motion.div className="absolute inset-1 rounded border-2" style={{ borderColor: "#818cf8" }}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.85 }} transition={{ duration: 0.4 }} />
            {step >= 2 && (
              <motion.div className="absolute -top-1 -right-1 px-1 py-0.5 rounded text-[8px] font-bold"
                style={{ background: "#818cf8", color: "#fff" }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}>flowchart</motion.div>
            )}
          </div>
          {step >= 3 && (
            <motion.div className="mt-1.5 text-center text-[9px] font-medium" style={{ color: "#818cf8" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>✓ Visual card created from figure</motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewStudyMode({ isDark }: { isDark: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const [got, setGot] = useState<null | "got" | "learning">(null);
  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1000);
    const t2 = setTimeout(() => setGot("got"), 2200);
    const t3 = setTimeout(() => { setFlipped(false); setGot(null); }, 3800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (flipped || got) return;
    const t = setTimeout(() => setFlipped(true), 1200);
    return () => clearTimeout(t);
  }, [flipped, got]);

  const cardFg = isDark ? "bg-white/8 border-white/12" : "bg-white/90 border-black/10";
  const front = isDark ? "text-white/80" : "text-black/75";
  const back = isDark ? "text-white/60" : "text-black/55";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="relative w-full" style={{ perspective: 600 }}>
        <motion.div className={`rounded-xl border ${cardFg} p-3 text-center relative overflow-hidden`}
          animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}>
          <div style={{ backfaceVisibility: "hidden" }}>
            <div className={`text-[10px] font-bold mb-1 ${front}`}>What is the powerhouse of the cell?</div>
            <div className={`text-[9px] ${isDark ? "text-white/30" : "text-black/25"}`}>Tap to reveal answer</div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="text-[11px] font-bold" style={{ color: "#38bdf8" }}>Mitochondria</div>
            <div className={`text-[9px] mt-1 ${back}`}>Produces ATP via cellular respiration</div>
          </div>
        </motion.div>
      </div>
      {flipped && (
        <motion.div className="flex gap-2 w-full" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <motion.div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border"
            style={{ background: got === "got" ? "#22c55e22" : "transparent", borderColor: got === "got" ? "#22c55e" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", color: got === "got" ? "#22c55e" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
            <CheckCircle2 className="h-3 w-3" /> Got it
          </motion.div>
          <motion.div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border"
            style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
            <XCircle className="h-3 w-3" /> Still learning
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function PreviewMCQ({ isDark }: { isDark: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const CORRECT = 1;
  const options = ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"];
  useEffect(() => {
    const t1 = setTimeout(() => setSelected(2), 800);
    const t2 = setTimeout(() => setRevealed(true), 1600);
    const t3 = setTimeout(() => { setSelected(null); setRevealed(false); }, 4000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (selected !== null || revealed) return;
    const t = setTimeout(() => setSelected(2), 900);
    return () => clearTimeout(t);
  }, [selected, revealed]);

  const text = isDark ? "text-white/70" : "text-black/65";
  const qText = isDark ? "text-white/80" : "text-black/75";

  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5">
      <div className={`text-[10px] font-semibold ${qText} leading-snug`}>Which organelle produces energy for the cell?</div>
      <div className="grid grid-cols-2 gap-1">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === CORRECT;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;
          return (
            <motion.div key={i} className="flex items-center gap-1 px-2 py-1 rounded-md border text-[9px] font-medium"
              animate={{ borderColor: showCorrect ? "#22c55e" : showWrong ? "#ef4444" : isSelected ? "#fb923c" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", background: showCorrect ? "#22c55e18" : showWrong ? "#ef444418" : isSelected ? "#fb923c18" : "transparent" }}
              transition={{ duration: 0.3 }}>
              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[8px]"
                style={{ background: showCorrect ? "#22c55e" : showWrong ? "#ef4444" : isSelected ? "#fb923c" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: (showCorrect || showWrong || isSelected) ? "#fff" : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={text}>{opt}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewQBank({ isDark }: { isDark: boolean }) {
  const [showExp, setShowExp] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShowExp(true), 900);
    const t2 = setTimeout(() => setShowExp(false), 4000);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (showExp) return;
    const t = setTimeout(() => setShowExp(true), 1000);
    return () => clearTimeout(t);
  }, [showExp]);

  const surface = isDark ? "bg-white/6 border-white/8" : "bg-white/70 border-black/8";
  const text = isDark ? "text-white/65" : "text-black/60";
  const sub = isDark ? "text-white/40" : "text-black/35";
  const expBg = isDark ? "bg-pink-500/10 border-pink-500/20" : "bg-pink-50 border-pink-200/60";

  return (
    <div className="w-full h-full flex flex-col gap-1.5 justify-center">
      <div className={`rounded-lg border ${surface} p-2`}>
        <div className={`text-[9px] font-semibold ${sub} uppercase tracking-wide mb-1`}>Question 7 / 40</div>
        <div className={`text-[10px] font-medium leading-snug ${text}`}>A 24-year-old presents with fatigue and pallor. MCV is 72 fL. Most likely diagnosis?</div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          {["Vitamin B12 deficiency", "Iron-deficiency anemia", "Folate deficiency"].map((opt, i) => (
            <div key={i} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] border ${i === 1 ? "border-pink-400/50 bg-pink-400/10" : isDark ? "border-white/6" : "border-black/6"}`}>
              <span className={`w-3 h-3 rounded-full text-[7px] flex items-center justify-center ${i === 1 ? "bg-pink-500 text-white" : isDark ? "bg-white/10 text-white/40" : "bg-black/8 text-black/30"}`}>{String.fromCharCode(65 + i)}</span>
              <span className={i === 1 ? "text-pink-400 font-medium" : sub}>{opt}</span>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {showExp && (
          <motion.div className={`rounded-lg border ${expBg} p-2`}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }}>
            <div className="text-[8px] font-semibold mb-0.5" style={{ color: "#f472b6" }}>AI Explanation</div>
            <div className={`text-[9px] leading-snug ${text}`}>Microcytic anemia (low MCV) with iron deficiency is most common in young women due to menstrual loss.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewMindMap({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1400);
    const t4 = setTimeout(() => setStep(4), 2000);
    const t5 = setTimeout(() => setStep(0), 4500);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 500);
    return () => clearTimeout(t);
  }, [step]);

  const nodes = [
    { label: "Cell Biology", x: 50, y: 50, color: "#a78bfa", main: true },
    { label: "Organelles", x: 18, y: 22, color: "#818cf8" },
    { label: "Division", x: 80, y: 22, color: "#a78bfa" },
    { label: "Transport", x: 18, y: 75, color: "#c4b5fd" },
    { label: "Metabolism", x: 80, y: 75, color: "#8b5cf6" },
  ];

  return (
    <div className="w-full h-full relative">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {nodes.slice(1).map((n, i) => (
          <motion.line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke={n.color} strokeWidth="0.8" strokeOpacity="0.5"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: step > i ? 1 : 0, opacity: step > i ? 1 : 0 }} transition={{ duration: 0.4 }} />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <motion.div key={i} className="absolute flex items-center justify-center rounded-full text-white font-semibold"
          style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)", width: n.main ? 28 : 22, height: n.main ? 28 : 22, fontSize: n.main ? 7 : 6, background: `${n.color}cc`, boxShadow: step === 4 && n.main ? `0 0 10px ${n.color}88` : undefined, textAlign: "center", lineHeight: 1.1 }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: step > (i === 0 ? -1 : i - 1) ? 1 : 0, opacity: step > (i === 0 ? -1 : i - 1) ? 1 : 0 }}
          transition={{ type: "spring", bounce: 0.4 }}>
          {n.label.split(" ").map((w, wi) => <div key={wi}>{w}</div>)}
        </motion.div>
      ))}
    </div>
  );
}

function PreviewDashboard({ isDark }: { isDark: boolean }) {
  const bars = [60, 80, 45, 90, 55, 75, 85];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 300);
    const t2 = setTimeout(() => setAnimate(false), 4000);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (animate) return;
    const t = setTimeout(() => setAnimate(true), 400);
    return () => clearTimeout(t);
  }, [animate]);

  const surface = isDark ? "bg-white/6 border-white/8" : "bg-white/80 border-black/8";
  const text = isDark ? "text-white/60" : "text-black/50";
  const sub = isDark ? "text-white/30" : "text-black/25";

  return (
    <div className="w-full h-full flex flex-col gap-1.5 justify-center">
      <div className="grid grid-cols-3 gap-1">
        {[{ icon: Flame, val: "7", label: "day streak", color: "#fb923c" }, { icon: CheckCircle2, val: "142", label: "cards done", color: "#4ade80" }, { icon: BarChart2, val: "89%", label: "accuracy", color: "#38bdf8" }]
          .map(({ icon: Icon, val, label, color }) => (
            <div key={label} className={`rounded-lg border ${surface} p-1.5 flex flex-col items-center gap-0.5`}>
              <Icon className="h-3 w-3" style={{ color }} />
              <div className="text-[11px] font-bold" style={{ color }}>{val}</div>
              <div className={`text-[7px] ${sub}`}>{label}</div>
            </div>
          ))}
      </div>
      <div className={`rounded-lg border ${surface} p-2`}>
        <div className={`text-[8px] font-semibold ${text} mb-1.5`}>7-day activity</div>
        <div className="flex items-end gap-1 h-8">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <motion.div className="w-full rounded-sm" style={{ background: "linear-gradient(180deg,#4ade80,#16a34a)", minHeight: 2 }}
                initial={{ height: 2 }} animate={{ height: animate ? `${h}%` : 2 }} transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }} />
              <span className={`text-[7px] ${sub}`}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewExport({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2400);
    const t4 = setTimeout(() => setStep(0), 4500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const surface = isDark ? "bg-white/6 border-white/8" : "bg-white/80 border-black/8";
  const text = isDark ? "text-white/65" : "text-black/60";
  const sub = isDark ? "text-white/35" : "text-black/30";

  return (
    <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
      <motion.div className={`w-full rounded-xl border ${surface} p-3 flex items-center gap-3`}
        animate={{ borderColor: step >= 2 ? "#facc1580" : undefined }}>
        <motion.div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#facc1522", border: "1px solid #facc1544" }}
          animate={{ scale: step >= 1 ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.4 }}>
          <Package className="h-5 w-5" style={{ color: "#facc15" }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-bold ${text}`}>Cell Biology Deck</div>
          <div className={`text-[8px] ${sub}`}>24 cards · 3 visual</div>
          <motion.div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#facc15,#f59e0b)" }}
              initial={{ width: "0%" }} animate={{ width: step >= 2 ? "100%" : "0%" }} transition={{ duration: 0.9, ease: "easeOut" }} />
          </motion.div>
        </div>
      </motion.div>
      {step >= 3 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold"
          style={{ background: "#facc1522", border: "1px solid #facc1560", color: "#facc15" }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          cell_biology.apkg ready — import to Anki!
        </motion.div>
      )}
    </div>
  );
}

function PreviewMindMapExport({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    const t4 = setTimeout(() => setStep(0), 4500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 500);
    return () => clearTimeout(t);
  }, [step]);

  const mapBg = isDark ? "bg-white/6 border-white/8" : "bg-white/80 border-black/8";
  const text = isDark ? "text-white/65" : "text-black/60";
  const btnBase = isDark ? "border-white/15 bg-white/8 text-white/60" : "border-black/12 bg-black/5 text-black/55";
  const nodes = [
    { x: 50, y: 50, r: 10, color: "#a78bfa" },
    { x: 18, y: 22, r: 7,  color: "#818cf8" },
    { x: 80, y: 22, r: 7,  color: "#a78bfa" },
    { x: 18, y: 76, r: 7,  color: "#c4b5fd" },
    { x: 80, y: 76, r: 7,  color: "#8b5cf6" },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-2 justify-center">
      <div className={`rounded-lg border ${mapBg} overflow-hidden`} style={{ height: 82 }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {nodes.slice(1).map((n, i) => (
            <motion.line key={i} x1="50" y1="50" x2={n.x} y2={n.y}
              stroke={n.color} strokeWidth="0.8" strokeOpacity="0.5"
              initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }} />
          ))}
          {nodes.map((n, i) => (
            <motion.circle key={i} cx={n.x} cy={n.y} r={n.r}
              fill={n.color} fillOpacity="0.75"
              initial={{ scale: 0 }} animate={{ scale: step >= 1 ? 1 : 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: i * 0.06 }} />
          ))}
        </svg>
      </div>
      <motion.div className="flex gap-1.5"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 5 }}
        transition={{ duration: 0.3 }}>
        {[{ fmt: "SVG", active: false }, { fmt: "PNG", active: step >= 3 }].map(({ fmt, active }) => (
          <motion.div key={fmt}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-semibold ${btnBase}`}
            animate={active ? { borderColor: "#2dd4bf80", color: "#2dd4bf" } : {}}
            transition={{ duration: 0.3 }}>
            <FileImage className="h-3 w-3" />{fmt}
          </motion.div>
        ))}
      </motion.div>
      {step >= 3 && (
        <motion.div className="text-center text-[9px] font-medium" style={{ color: "#2dd4bf" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          ✓ mind_map.png ready — paste into your notes!
        </motion.div>
      )}
    </div>
  );
}

function PreviewFeedback({ isDark }: { isDark: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2400);
    const t4 = setTimeout(() => setStep(0), 5000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 600);
    return () => clearTimeout(t);
  }, [step]);

  const surface = isDark ? "bg-white/6 border-white/8" : "bg-white/80 border-black/8";
  const text = isDark ? "text-white/65" : "text-black/60";
  const sub = isDark ? "text-white/40" : "text-black/35";
  const types = [{ e: "🐛", l: "Bug" }, { e: "💡", l: "Idea" }, { e: "🙏", l: "Praise" }, { e: "💬", l: "Other" }];

  return (
    <div className="w-full h-full flex flex-col gap-1.5 justify-center">
      <div className="grid grid-cols-4 gap-1">
        {types.map((t, i) => (
          <motion.div key={t.l}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[8px] font-medium ${sub} ${surface}`}
            animate={step >= 1 && i === 1 ? { borderColor: "#e879f980", backgroundColor: "#e879f910", color: "#e879f9" } : {}}
            transition={{ duration: 0.35 }}>
            <span className="text-sm leading-none">{t.e}</span>{t.l}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3, 4, 5].map(n => (
          <motion.div key={n}
            initial={{ scale: 0.8 }}
            animate={{ scale: step >= 2 && n <= 4 ? 1.15 : 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: n * 0.04 }}>
            <Star style={{ width: 18, height: 18 }}
              fill={step >= 2 && n <= 4 ? "#f59e0b" : "transparent"}
              stroke={step >= 2 && n <= 4 ? "#f59e0b" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)"} />
          </motion.div>
        ))}
      </div>
      <div className={`rounded-lg border ${surface} px-2 py-1.5`}>
        <div className={`text-[8px] ${sub} mb-0.5`}>Your message</div>
        <motion.div className={`text-[9px] ${text}`}
          initial={{ opacity: 0 }} animate={{ opacity: step >= 2 ? 1 : 0 }} transition={{ duration: 0.4 }}>
          {step >= 2 ? "Love the mind map export! 🎉" : ""}
        </motion.div>
      </div>
      {step >= 3 && (
        <motion.div className="flex items-center justify-center gap-1.5 text-[9px] font-semibold"
          style={{ color: "#e879f9" }}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}>
          <CheckCircle2 className="h-3 w-3" /> Sent! We read every response.
        </motion.div>
      )}
    </div>
  );
}

// ─── Feature definitions ────────────────────────────────────────────────────

const FEATURE_PREVIEWS = [
  PreviewGeneration, PreviewVisualDetection, PreviewStudyMode, PreviewMCQ,
  PreviewQBank, PreviewMindMap, PreviewDashboard, PreviewExport,
  PreviewMindMapExport, PreviewFeedback,
];

const FEATURES = [
  { icon: Sparkles, color: "#34d399", glow: "hsl(152 72% 55% / 0.5)", label: "AI Flashcard Generation", desc: "Upload PDFs, slides, or images. AI reads your material and creates perfectly structured flashcards in seconds.", accent: "from-emerald-400 to-teal-500", bgDark: "from-emerald-500/10 via-teal-500/5 to-transparent", bgLight: "from-emerald-500/8 via-teal-500/4 to-transparent" },
  { icon: Image, color: "#818cf8", glow: "hsl(239 84% 68% / 0.5)", label: "Visual Card Detection", desc: "AI detects diagrams, flowcharts, radiology images & figures — generating rich visual cards from what it sees.", accent: "from-indigo-400 to-violet-500", bgDark: "from-indigo-500/10 via-violet-500/5 to-transparent", bgLight: "from-indigo-500/8 via-violet-500/4 to-transparent" },
  { icon: BookOpen, color: "#38bdf8", glow: "hsl(199 89% 60% / 0.5)", label: "Immersive Study Mode", desc: "Flip cards, use keyboard shortcuts, track \"Got it\" vs \"Still learning\", and review at your own pace.", accent: "from-sky-400 to-cyan-500", bgDark: "from-sky-500/10 via-cyan-500/5 to-transparent", bgLight: "from-sky-500/8 via-cyan-500/4 to-transparent" },
  { icon: Target, color: "#fb923c", glow: "hsl(24 95% 60% / 0.5)", label: "MCQ Practice Mode", desc: "AI generates exam-style multiple choice questions with distractors tailored to your deck content.", accent: "from-orange-400 to-amber-500", bgDark: "from-orange-500/10 via-amber-500/5 to-transparent", bgLight: "from-orange-500/8 via-amber-500/4 to-transparent" },
  { icon: FlaskConical, color: "#f472b6", glow: "hsl(330 82% 65% / 0.5)", label: "Question Banks", desc: "Medical-grade QBanks with detailed AI explanations for every answer — perfect for licensing exams.", accent: "from-pink-400 to-rose-500", bgDark: "from-pink-500/10 via-rose-500/5 to-transparent", bgLight: "from-pink-500/8 via-rose-500/4 to-transparent" },
  { icon: Network, color: "#a78bfa", glow: "hsl(263 68% 67% / 0.5)", label: "AI Mind Maps", desc: "Study with a live mind map on the side. AI builds a topic hierarchy of your deck and highlights your current card.", accent: "from-violet-400 to-purple-500", bgDark: "from-violet-500/10 via-purple-500/5 to-transparent", bgLight: "from-violet-500/8 via-purple-500/4 to-transparent" },
  { icon: LayoutDashboard, color: "#4ade80", glow: "hsl(142 70% 56% / 0.5)", label: "Progress Dashboard", desc: "Study streaks, 7-day activity charts, deck progress bars, and recent session history — all at a glance.", accent: "from-green-400 to-emerald-500", bgDark: "from-green-500/10 via-emerald-500/5 to-transparent", bgLight: "from-green-500/8 via-emerald-500/4 to-transparent" },
  { icon: Download, color: "#facc15", glow: "hsl(48 96% 55% / 0.5)", label: "Export & Desktop App", desc: "Export any deck as an Anki .apkg file, or download the native app to study offline, anytime.", accent: "from-yellow-400 to-amber-400", bgDark: "from-yellow-500/10 via-amber-500/5 to-transparent", bgLight: "from-yellow-500/8 via-amber-500/4 to-transparent" },
  { icon: FileImage, color: "#2dd4bf", glow: "hsl(180 72% 50% / 0.5)", label: "Mind Map Export", desc: "Download any mind map as a crisp 2× PNG or scalable SVG — paste straight into Notion, Obsidian, or your slides.", accent: "from-teal-400 to-cyan-500", bgDark: "from-teal-500/10 via-cyan-500/5 to-transparent", bgLight: "from-teal-500/8 via-cyan-500/4 to-transparent" },
  { icon: MessageSquarePlus, color: "#e879f9", glow: "hsl(292 94% 73% / 0.5)", label: "Feedback & Support", desc: "Send bug reports, feature ideas, or kind words right from the app. We read every response and ship improvements fast.", accent: "from-fuchsia-400 to-pink-500", bgDark: "from-fuchsia-500/10 via-pink-500/5 to-transparent", bgLight: "from-fuchsia-500/8 via-pink-500/4 to-transparent" },
];

// ─── Main export ─────────────────────────────────────────────────────────────

export function FeaturesShowcase() {
  const [dark] = useDarkMode();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goTo = (i: number) => { setDir(i > idx ? 1 : -1); setIdx(i); };
  const goPrev = () => { if (idx > 0) { setDir(-1); setIdx(i => i - 1); } };
  const goNext = () => { if (idx < FEATURES.length - 1) { setDir(1); setIdx(i => i + 1); } };

  const feature = FEATURES[idx];
  const FeatureIcon = feature.icon;
  const FeaturePreview = FEATURE_PREVIEWS[idx];

  const cardBorder = dark ? "border-white/10" : "border-black/8";
  const cardBg = dark ? feature.bgDark : feature.bgLight;
  const navBtn = dark ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/90" : "border-black/8 bg-black/4 hover:bg-black/8 text-black/40 hover:text-black/70";
  const descText = dark ? "text-white/60" : "text-muted-foreground";
  const shimmer = dark
    ? "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)"
    : "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)";
  const dotDone = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
  const dotPending = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const stripActive = dark ? "border-white/20 bg-white/10 text-white" : "border-black/15 bg-black/8 text-black/80";
  const stripDone = dark ? "border-white/8 bg-white/5 text-white/40" : "border-black/6 bg-black/4 text-black/35";
  const stripPending = dark ? "border-white/5 bg-white/3 text-white/25" : "border-black/4 bg-black/3 text-black/20";

  return (
    <section className="border-t border-border/40 pt-8 space-y-4">
      {/* Section heading */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">What AnkiGen can do</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Every tool you need to study smarter — in one place.</p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
        {/* Feature card with animated preview */}
        <div className="relative w-full h-72">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              className={`absolute inset-0 rounded-2xl border ${cardBorder} bg-gradient-to-br ${cardBg} backdrop-blur-sm overflow-hidden`}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 50, scale: 0.96 }),
                center: { opacity: 1, x: 0, scale: 1 },
                exit: (d: number) => ({ opacity: 0, x: -d * 50, scale: 0.96 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow orb */}
              <motion.div
                className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: feature.glow, filter: "blur(50px)", opacity: dark ? 0.5 : 0.25 }}
                animate={{ scale: [1, 1.15, 1], opacity: dark ? [0.4, 0.65, 0.4] : [0.2, 0.35, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative h-full flex flex-col p-4 gap-3">
                {/* Live preview */}
                <div className="flex-1 min-h-0">
                  <FeaturePreview isDark={dark} />
                </div>

                {/* Divider */}
                <div className={`w-full h-px ${dark ? "bg-white/8" : "bg-black/6"}`} />

                {/* Label + description */}
                <div className="flex items-start gap-3 shrink-0">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl shadow-md shrink-0"
                    style={{ background: `${feature.color}22`, border: `1px solid ${feature.color}44` }}>
                    <FeatureIcon className="h-5 w-5" style={{ color: feature.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold bg-gradient-to-r ${feature.accent} bg-clip-text text-transparent leading-tight`}>
                        {feature.label}
                      </h3>
                      <span className="text-[10px] font-mono tabular-nums shrink-0 text-muted-foreground/50">
                        {String(idx + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed mt-0.5 ${descText}`}>{feature.desc}</p>
                  </div>
                </div>
              </div>

              {/* Shimmer sweep */}
              <motion.div className="absolute inset-0 pointer-events-none" style={{ background: shimmer }}
                animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot nav + prev/next */}
        <div className="flex items-center gap-3 w-full justify-center">
          <motion.button onClick={goPrev} disabled={idx === 0} aria-label="Previous"
            className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${navBtn} disabled:opacity-20 disabled:cursor-not-allowed`}
            whileHover={idx > 0 ? { scale: 1.1 } : {}} whileTap={idx > 0 ? { scale: 0.9 } : {}}>
            <ChevronLeft className="h-4 w-4" />
          </motion.button>

          <div className="flex items-center gap-1.5">
            {FEATURES.map((_, i) => (
              <motion.button key={i} onClick={() => goTo(i)} aria-label={`Feature ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{ width: i === idx ? 20 : 6, height: 6, background: i < idx ? dotDone : i === idx ? feature.color : dotPending }}
                whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.85 }} />
            ))}
          </div>

          <motion.button onClick={goNext} disabled={idx === FEATURES.length - 1} aria-label="Next"
            className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${navBtn} disabled:opacity-20 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Mini feature strip */}
        <div className="w-full grid grid-cols-4 gap-1.5">
          {FEATURES.map((f, i) => {
            const FIcon = f.icon;
            const active = i === idx;
            const done = i < idx;
            return (
              <motion.button key={i} onClick={() => goTo(i)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${active ? stripActive : done ? stripDone : stripPending}`}
                style={active ? { borderColor: `${f.color}50` } : {}}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                <FIcon className="h-3 w-3 shrink-0" style={{ color: active ? f.color : undefined }} />
                <span className="truncate">{f.label.split(" ")[0]}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
