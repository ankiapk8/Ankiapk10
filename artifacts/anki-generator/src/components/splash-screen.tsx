import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Image,
  Brain,
  Target,
  FlaskConical,
  Network,
  LayoutDashboard,
  Download,
  ChevronRight,
} from "lucide-react";

const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;

const FEATURES = [
  {
    icon: Sparkles,
    color: "#34d399",
    glow: "hsl(152 72% 55% / 0.5)",
    label: "AI Flashcard Generation",
    desc: "Upload PDFs, slides, or images. AI reads your material and creates perfectly structured flashcards in seconds.",
    accent: "from-emerald-400 to-teal-500",
    bg: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  {
    icon: Image,
    color: "#818cf8",
    glow: "hsl(239 84% 68% / 0.5)",
    label: "Visual Card Detection",
    desc: "AI detects diagrams, flowcharts, radiology images & figures — generating rich visual cards from what it sees.",
    accent: "from-indigo-400 to-violet-500",
    bg: "from-indigo-500/10 via-violet-500/5 to-transparent",
  },
  {
    icon: BookOpen,
    color: "#38bdf8",
    glow: "hsl(199 89% 60% / 0.5)",
    label: "Immersive Study Mode",
    desc: "Flip cards, use keyboard shortcuts, track \"Got it\" vs \"Still learning\", and review at your own pace.",
    accent: "from-sky-400 to-cyan-500",
    bg: "from-sky-500/10 via-cyan-500/5 to-transparent",
  },
  {
    icon: Target,
    color: "#fb923c",
    glow: "hsl(24 95% 60% / 0.5)",
    label: "MCQ Practice Mode",
    desc: "AI generates exam-style multiple choice questions with distractors tailored to your deck content.",
    accent: "from-orange-400 to-amber-500",
    bg: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  {
    icon: FlaskConical,
    color: "#f472b6",
    glow: "hsl(330 82% 65% / 0.5)",
    label: "Question Banks",
    desc: "Medical-grade QBanks with detailed AI explanations for every answer — perfect for licensing exams.",
    accent: "from-pink-400 to-rose-500",
    bg: "from-pink-500/10 via-rose-500/5 to-transparent",
  },
  {
    icon: Network,
    color: "#a78bfa",
    glow: "hsl(263 68% 67% / 0.5)",
    label: "AI Mind Maps",
    desc: "Study with a live mind map on the side. AI builds a topic hierarchy of your deck and highlights your current card.",
    accent: "from-violet-400 to-purple-500",
    bg: "from-violet-500/10 via-purple-500/5 to-transparent",
  },
  {
    icon: LayoutDashboard,
    color: "#4ade80",
    glow: "hsl(142 70% 56% / 0.5)",
    label: "Progress Dashboard",
    desc: "Study streaks, 7-day activity charts, deck progress bars, and recent session history — all at a glance.",
    accent: "from-green-400 to-emerald-500",
    bg: "from-green-500/10 via-emerald-500/5 to-transparent",
  },
  {
    icon: Download,
    color: "#facc15",
    glow: "hsl(48 96% 55% / 0.5)",
    label: "Export & Desktop App",
    desc: "Export any deck as an Anki .apkg file, or download the native Mac app to study offline, anytime.",
    accent: "from-yellow-400 to-amber-400",
    bg: "from-yellow-500/10 via-amber-500/5 to-transparent",
  },
];

const FEATURE_DURATION = 1600; // ms per feature
const LOGO_PHASE_MS = 1200;    // time for logo intro before features start

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"logo" | "features" | "done">("logo");
  const [featureIndex, setFeatureIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setPhase("done");
    setTimeout(() => setDismissed(true), 700);
  }, []);

  // Logo phase → features phase
  useEffect(() => {
    const t = setTimeout(() => setPhase("features"), LOGO_PHASE_MS);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance features
  useEffect(() => {
    if (phase !== "features") return;
    if (featureIndex >= FEATURES.length - 1) {
      const t = setTimeout(dismiss, FEATURE_DURATION + 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setFeatureIndex((i) => i + 1),
      FEATURE_DURATION
    );
    return () => clearTimeout(t);
  }, [phase, featureIndex, dismiss]);

  const show = !dismissed;
  const feature = FEATURES[featureIndex];
  const FeatureIcon = feature.icon;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
            style={{
              background:
                "radial-gradient(ellipse at 20% 30%, hsl(150 40% 8%) 0%, hsl(220 30% 6%) 55%, hsl(150 20% 4%) 100%)",
            }}
          >
            {/* Ambient floating orbs */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 120 + (i % 4) * 80,
                  height: 120 + (i % 4) * 80,
                  left: `${(i * 79) % 90}%`,
                  top: `${(i * 53) % 85}%`,
                  background:
                    i % 3 === 0
                      ? "hsl(150 60% 50% / 0.04)"
                      : i % 3 === 1
                      ? "hsl(220 60% 60% / 0.04)"
                      : "hsl(280 60% 60% / 0.04)",
                  filter: "blur(40px)",
                }}
                animate={{
                  x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 3), 0],
                  y: [0, (i % 3 === 0 ? 1 : -1) * (15 + i * 2), 0],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}

            {/* Particle field */}
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={`p${i}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 2 + (i % 2),
                  height: 2 + (i % 2),
                  left: `${(i * 83) % 100}%`,
                  top: `${(i * 47) % 100}%`,
                  background:
                    i % 2 === 0
                      ? "hsl(150 70% 65% / 0.6)"
                      : "hsl(220 70% 70% / 0.5)",
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.9, 0],
                  y: [0, -40 - i * 4],
                  scale: [0.5, 1.2, 0],
                }}
                transition={{
                  duration: 3 + (i % 3) * 0.8,
                  delay: i * 0.12,
                  repeat: Infinity,
                  repeatDelay: (i % 4) * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Skip button */}
            {phase === "features" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={dismiss}
                className="absolute top-5 right-5 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
              >
                Skip <ChevronRight className="h-3 w-3" />
              </motion.button>
            )}

            {/* PHASE: Logo */}
            <AnimatePresence>
              {phase === "logo" && (
                <motion.div
                  key="logo-phase"
                  className="flex flex-col items-center gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1.4, 0.36, 1] }}
                  >
                    <motion.div
                      className="absolute -inset-5 rounded-3xl"
                      style={{
                        background:
                          "conic-gradient(from 0deg, hsl(150 60% 55%), hsl(95 65% 50%), hsl(220 70% 60%), hsl(150 60% 55%))",
                        filter: "blur(18px)",
                        opacity: 0.6,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl">
                      <img src={LOGO_URL} alt="AnkiGen" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </motion.div>

                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                  >
                    <h1 className="font-serif text-4xl font-bold bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                      AnkiGen
                    </h1>
                    <p className="mt-2 text-sm text-white/40 tracking-widest uppercase font-mono">
                      Smart flashcards, instantly
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PHASE: Features showcase */}
            <AnimatePresence>
              {phase === "features" && (
                <motion.div
                  key="features-phase"
                  className="flex flex-col items-center gap-6 w-full max-w-lg px-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Mini logo badge */}
                  <motion.div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <img src={LOGO_URL} alt="" className="w-4 h-4 rounded-sm" draggable={false} />
                    <span className="text-xs font-semibold text-white/60 tracking-wide">AnkiGen</span>
                  </motion.div>

                  {/* Feature card */}
                  <div className="relative w-full h-52">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={featureIndex}
                        className={`absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br ${feature.bg} backdrop-blur-sm overflow-hidden`}
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -40, scale: 0.96 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Glow orb behind icon */}
                        <motion.div
                          className="absolute top-0 left-0 w-48 h-48 rounded-full"
                          style={{ background: feature.glow, filter: "blur(50px)", opacity: 0.5 }}
                          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Card content */}
                        <div className="relative h-full flex flex-col justify-between p-6">
                          {/* Icon + feature number */}
                          <div className="flex items-start justify-between">
                            <motion.div
                              className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
                              style={{ background: `${feature.color}22`, border: `1px solid ${feature.color}44` }}
                              initial={{ scale: 0.5, rotate: -15 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.1, duration: 0.55, ease: "backOut" }}
                            >
                              <FeatureIcon className="h-7 w-7" style={{ color: feature.color }} />
                            </motion.div>

                            <span className="text-[11px] font-mono text-white/30 tabular-nums">
                              {String(featureIndex + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                            </span>
                          </div>

                          {/* Text */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          >
                            <h2
                              className={`text-xl font-bold bg-gradient-to-r ${feature.accent} bg-clip-text text-transparent leading-tight mb-2`}
                            >
                              {feature.label}
                            </h2>
                            <p className="text-sm text-white/60 leading-relaxed">
                              {feature.desc}
                            </p>
                          </motion.div>
                        </div>

                        {/* Animated shimmer */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)",
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{
                            duration: 1.8,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatDelay: 0.4,
                          }}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5">
                    {FEATURES.map((_, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setFeatureIndex(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === featureIndex ? 20 : 6,
                          height: 6,
                          background:
                            i < featureIndex
                              ? "rgba(255,255,255,0.4)"
                              : i === featureIndex
                              ? feature.color
                              : "rgba(255,255,255,0.12)",
                        }}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.85 }}
                        aria-label={`Feature ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-[2px] rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: feature.color }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      key={`bar-${featureIndex}`}
                      transition={{ duration: FEATURE_DURATION / 1000, ease: "linear" }}
                    />
                  </div>

                  {/* Feature list mini-strip */}
                  <motion.div
                    className="w-full grid grid-cols-4 gap-1.5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {FEATURES.map((f, i) => {
                      const FIcon = f.icon;
                      const active = i === featureIndex;
                      const done = i < featureIndex;
                      return (
                        <motion.button
                          key={i}
                          onClick={() => setFeatureIndex(i)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : done
                              ? "border-white/8 bg-white/5 text-white/40"
                              : "border-white/5 bg-white/3 text-white/25"
                          }`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          style={active ? { borderColor: `${f.color}50` } : {}}
                        >
                          <FIcon
                            className="h-3 w-3 shrink-0"
                            style={{ color: active ? f.color : done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}
                          />
                          <span className="truncate hidden xs:block">{f.label.split(" ")[0]}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ visibility: show ? "hidden" : "visible" }}>
        {children}
      </div>
    </>
  );
}
