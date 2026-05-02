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
  ChevronLeft,
} from "lucide-react";

const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;
const LOGO_PHASE_MS = 1400;

const FEATURES = [
  {
    icon: Sparkles,
    color: "#34d399",
    glow: "hsl(152 72% 55% / 0.5)",
    label: "AI Flashcard Generation",
    desc: "Upload PDFs, slides, or images. AI reads your material and creates perfectly structured flashcards in seconds.",
    accent: "from-emerald-400 to-teal-500",
    bgDark: "from-emerald-500/10 via-teal-500/5 to-transparent",
    bgLight: "from-emerald-500/8 via-teal-500/4 to-transparent",
  },
  {
    icon: Image,
    color: "#818cf8",
    glow: "hsl(239 84% 68% / 0.5)",
    label: "Visual Card Detection",
    desc: "AI detects diagrams, flowcharts, radiology images & figures — generating rich visual cards from what it sees.",
    accent: "from-indigo-400 to-violet-500",
    bgDark: "from-indigo-500/10 via-violet-500/5 to-transparent",
    bgLight: "from-indigo-500/8 via-violet-500/4 to-transparent",
  },
  {
    icon: BookOpen,
    color: "#38bdf8",
    glow: "hsl(199 89% 60% / 0.5)",
    label: "Immersive Study Mode",
    desc: "Flip cards, use keyboard shortcuts, track \"Got it\" vs \"Still learning\", and review at your own pace.",
    accent: "from-sky-400 to-cyan-500",
    bgDark: "from-sky-500/10 via-cyan-500/5 to-transparent",
    bgLight: "from-sky-500/8 via-cyan-500/4 to-transparent",
  },
  {
    icon: Target,
    color: "#fb923c",
    glow: "hsl(24 95% 60% / 0.5)",
    label: "MCQ Practice Mode",
    desc: "AI generates exam-style multiple choice questions with distractors tailored to your deck content.",
    accent: "from-orange-400 to-amber-500",
    bgDark: "from-orange-500/10 via-amber-500/5 to-transparent",
    bgLight: "from-orange-500/8 via-amber-500/4 to-transparent",
  },
  {
    icon: FlaskConical,
    color: "#f472b6",
    glow: "hsl(330 82% 65% / 0.5)",
    label: "Question Banks",
    desc: "Medical-grade QBanks with detailed AI explanations for every answer — perfect for licensing exams.",
    accent: "from-pink-400 to-rose-500",
    bgDark: "from-pink-500/10 via-rose-500/5 to-transparent",
    bgLight: "from-pink-500/8 via-rose-500/4 to-transparent",
  },
  {
    icon: Network,
    color: "#a78bfa",
    glow: "hsl(263 68% 67% / 0.5)",
    label: "AI Mind Maps",
    desc: "Study with a live mind map on the side. AI builds a topic hierarchy of your deck and highlights your current card.",
    accent: "from-violet-400 to-purple-500",
    bgDark: "from-violet-500/10 via-purple-500/5 to-transparent",
    bgLight: "from-violet-500/8 via-purple-500/4 to-transparent",
  },
  {
    icon: LayoutDashboard,
    color: "#4ade80",
    glow: "hsl(142 70% 56% / 0.5)",
    label: "Progress Dashboard",
    desc: "Study streaks, 7-day activity charts, deck progress bars, and recent session history — all at a glance.",
    accent: "from-green-400 to-emerald-500",
    bgDark: "from-green-500/10 via-emerald-500/5 to-transparent",
    bgLight: "from-green-500/8 via-emerald-500/4 to-transparent",
  },
  {
    icon: Download,
    color: "#facc15",
    glow: "hsl(48 96% 55% / 0.5)",
    label: "Export & Desktop App",
    desc: "Export any deck as an Anki .apkg file, or download the native Mac app to study offline, anytime.",
    accent: "from-yellow-400 to-amber-400",
    bgDark: "from-yellow-500/10 via-amber-500/5 to-transparent",
    bgLight: "from-yellow-500/8 via-amber-500/4 to-transparent",
  },
];

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // Read saved theme preference so the splash matches the app's last mode.
  const [isDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("ankigen-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [phase, setPhase] = useState<"logo" | "features" | "done">("logo");
  const [featureIndex, setFeatureIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // Track swipe direction for animation
  const [direction, setDirection] = useState<1 | -1>(1);

  const dismiss = useCallback(() => {
    setPhase("done");
    setTimeout(() => setDismissed(true), 700);
  }, []);

  // Logo phase → features phase (auto-advance logo only)
  useEffect(() => {
    const t = setTimeout(() => setPhase("features"), LOGO_PHASE_MS);
    return () => clearTimeout(t);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== "features") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (featureIndex < FEATURES.length - 1) {
          setDirection(1);
          setFeatureIndex((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (featureIndex > 0) {
          setDirection(-1);
          setFeatureIndex((i) => i - 1);
        }
      } else if (e.key === "Enter" || e.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, featureIndex, dismiss]);

  const goTo = (i: number) => {
    setDirection(i > featureIndex ? 1 : -1);
    setFeatureIndex(i);
  };

  const goNext = () => {
    if (featureIndex < FEATURES.length - 1) {
      setDirection(1);
      setFeatureIndex((i) => i + 1);
    } else {
      dismiss();
    }
  };

  const goPrev = () => {
    if (featureIndex > 0) {
      setDirection(-1);
      setFeatureIndex((i) => i - 1);
    }
  };

  const show = !dismissed;
  const feature = FEATURES[featureIndex];
  const FeatureIcon = feature.icon;

  // Theme-aware tokens
  const splashBg = isDark
    ? "radial-gradient(ellipse at 20% 30%, hsl(150 40% 8%) 0%, hsl(220 30% 6%) 55%, hsl(150 20% 4%) 100%)"
    : "radial-gradient(ellipse at 20% 30%, hsl(150 30% 96%) 0%, hsl(220 25% 97%) 55%, hsl(150 20% 95%) 100%)";

  const cardBorder = isDark ? "border-white/10" : "border-black/8";
  const cardBg = isDark ? feature.bgDark : feature.bgLight;
  const backdropClass = isDark ? "bg-white/5" : "bg-black/4";
  const badgeBorder = isDark ? "border-white/10" : "border-black/8";
  const badgeBg = isDark ? "bg-white/5" : "bg-black/4";
  const badgeText = isDark ? "text-white/60" : "text-black/50";
  const skipText = isDark ? "text-white/50 hover:text-white/80 border-white/10 hover:border-white/20" : "text-black/40 hover:text-black/70 border-black/10 hover:border-black/20";
  const counterText = isDark ? "text-white/30" : "text-black/25";
  const descText = isDark ? "text-white/60" : "text-black/55";
  const shimmer = isDark
    ? "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)"
    : "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)";

  const dotDone = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
  const dotPending = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  const navBtnBase = isDark
    ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/90"
    : "border-black/8 bg-black/4 hover:bg-black/8 text-black/40 hover:text-black/70";

  const stripActive = isDark ? "border-white/20 bg-white/10 text-white" : "border-black/15 bg-black/8 text-black/80";
  const stripDone = isDark ? "border-white/8 bg-white/5 text-white/40" : "border-black/6 bg-black/4 text-black/35";
  const stripPending = isDark ? "border-white/5 bg-white/3 text-white/25" : "border-black/4 bg-black/3 text-black/20";

  const particleColorA = isDark ? "hsl(150 60% 50% / 0.04)" : "hsl(150 60% 70% / 0.12)";
  const particleColorB = isDark ? "hsl(220 60% 60% / 0.04)" : "hsl(220 60% 70% / 0.10)";
  const particleColorC = isDark ? "hsl(280 60% 60% / 0.04)" : "hsl(280 60% 70% / 0.10)";
  const dotColorA = isDark ? "hsl(150 70% 65% / 0.6)" : "hsl(150 60% 45% / 0.35)";
  const dotColorB = isDark ? "hsl(220 70% 70% / 0.5)" : "hsl(220 60% 50% / 0.30)";

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
            style={{ background: splashBg }}
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
                    i % 3 === 0 ? particleColorA : i % 3 === 1 ? particleColorB : particleColorC,
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
                  background: i % 2 === 0 ? dotColorA : dotColorB,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0], y: [0, -40 - i * 4], scale: [0.5, 1.2, 0] }}
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
                className={`absolute top-5 right-5 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-colors ${skipText}`}
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
                        opacity: isDark ? 0.6 : 0.35,
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
                    <h1 className="font-serif text-4xl font-bold bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                      AnkiGen
                    </h1>
                    <p className={`mt-2 text-sm tracking-widest uppercase font-mono ${isDark ? "text-white/40" : "text-black/35"}`}>
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
                  className="flex flex-col items-center gap-5 w-full max-w-lg px-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Mini logo badge */}
                  <motion.div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBorder} ${badgeBg} backdrop-blur-sm`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <img src={LOGO_URL} alt="" className="w-4 h-4 rounded-sm" draggable={false} />
                    <span className={`text-xs font-semibold tracking-wide ${badgeText}`}>AnkiGen</span>
                  </motion.div>

                  {/* Feature card */}
                  <div className="relative w-full h-56">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={featureIndex}
                        custom={direction}
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
                          className="absolute top-0 left-0 w-48 h-48 rounded-full"
                          style={{ background: feature.glow, filter: "blur(50px)", opacity: isDark ? 0.5 : 0.25 }}
                          animate={{ scale: [1, 1.15, 1], opacity: isDark ? [0.4, 0.65, 0.4] : [0.2, 0.35, 0.2] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Card content */}
                        <div className="relative h-full flex flex-col justify-between p-6">
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

                            <span className={`text-[11px] font-mono tabular-nums ${counterText}`}>
                              {String(featureIndex + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                            </span>
                          </div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          >
                            <h2 className={`text-xl font-bold bg-gradient-to-r ${feature.accent} bg-clip-text text-transparent leading-tight mb-2`}>
                              {feature.label}
                            </h2>
                            <p className={`text-sm leading-relaxed ${descText}`}>
                              {feature.desc}
                            </p>
                          </motion.div>
                        </div>

                        {/* Shimmer */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: shimmer }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Dot navigation + Prev/Next row */}
                  <div className="flex items-center gap-3 w-full justify-center">
                    {/* Prev button */}
                    <motion.button
                      onClick={goPrev}
                      disabled={featureIndex === 0}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${navBtnBase} disabled:opacity-20 disabled:cursor-not-allowed`}
                      whileHover={featureIndex > 0 ? { scale: 1.1 } : {}}
                      whileTap={featureIndex > 0 ? { scale: 0.9 } : {}}
                      aria-label="Previous feature"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </motion.button>

                    {/* Dots */}
                    <div className="flex items-center gap-1.5">
                      {FEATURES.map((_, i) => (
                        <motion.button
                          key={i}
                          onClick={() => goTo(i)}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: i === featureIndex ? 20 : 6,
                            height: 6,
                            background:
                              i < featureIndex
                                ? dotDone
                                : i === featureIndex
                                ? feature.color
                                : dotPending,
                          }}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.85 }}
                          aria-label={`Feature ${i + 1}`}
                        />
                      ))}
                    </div>

                    {/* Next / Get Started button */}
                    <motion.button
                      onClick={goNext}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${navBtnBase}`}
                      style={
                        featureIndex === FEATURES.length - 1
                          ? { borderColor: `${feature.color}60`, background: `${feature.color}18`, color: feature.color }
                          : {}
                      }
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={featureIndex === FEATURES.length - 1 ? "Get started" : "Next feature"}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
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
                          onClick={() => goTo(i)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                            active ? stripActive : done ? stripDone : stripPending
                          }`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          style={active ? { borderColor: `${f.color}50` } : {}}
                        >
                          <FIcon
                            className="h-3 w-3 shrink-0"
                            style={{
                              color: active
                                ? f.color
                                : done
                                ? isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"
                                : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
                            }}
                          />
                          <span className="truncate hidden xs:block">{f.label.split(" ")[0]}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {/* Keyboard hint */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className={`text-[10px] font-mono ${isDark ? "text-white/20" : "text-black/20"}`}
                  >
                    ← → arrow keys to navigate · Enter to get started
                  </motion.p>
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
