import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Activity, MessageSquarePlus,
  FileImage, Cpu, Network, FlaskConical,
  Target, LayoutDashboard, Download, BookOpen,
  Image, Check,
} from "lucide-react";
import { useDarkMode } from "@/hooks/use-dark-mode";

// ─── Versioned changelog ─────────────────────────────────────────────────────
// Bump APP_VERSION whenever you ship a new release. The banner will show once
// for any user who hasn't seen this version yet.

export const APP_VERSION = "1.4";

interface ChangelogEntry {
  icon: React.ElementType;
  color: string;
  title: string;
  desc: string;
  badge?: string;
}

const CHANGELOG: Record<string, { headline: string; entries: ChangelogEntry[] }> = {
  "1.4": {
    headline: "Prodrome Study & Smarter Feedback",
    entries: [
      {
        icon: Activity,
        color: "#f87171",
        title: "Prodrome Study",
        desc: "Master early warning signs before disease onset — AI generates prodrome flashcards with mnemonics for USMLE & licensing exams.",
        badge: "New",
      },
      {
        icon: MessageSquarePlus,
        color: "#e879f9",
        title: "Feedback & Support",
        desc: "Send bug reports, feature ideas, or kind words right from the app. Every response is read and actioned.",
        badge: "New",
      },
      {
        icon: Cpu,
        color: "#38bdf8",
        title: "Model Status Badge",
        desc: "Dev builds now show the active AI model and FREE / PAID tier at a glance in the dashboard.",
        badge: "Dev",
      },
    ],
  },
  "1.3": {
    headline: "Mind Map Export & Desktop App",
    entries: [
      {
        icon: FileImage,
        color: "#2dd4bf",
        title: "Mind Map Export",
        desc: "Download any mind map as a crisp 2× PNG or scalable SVG.",
      },
      {
        icon: LayoutDashboard,
        color: "#4ade80",
        title: "Progress Dashboard",
        desc: "Study streaks, 7-day activity charts, and deck progress bars — all at a glance.",
      },
      {
        icon: Download,
        color: "#facc15",
        title: "Export & Desktop App",
        desc: "Export decks as .apkg or download the native Mac app for offline study.",
      },
    ],
  },
  "1.2": {
    headline: "AI Mind Maps",
    entries: [
      {
        icon: Network,
        color: "#a78bfa",
        title: "AI Mind Maps",
        desc: "Study with a live mind map. AI builds a topic hierarchy and highlights your current card.",
      },
    ],
  },
  "1.1": {
    headline: "MCQ & Question Banks",
    entries: [
      {
        icon: Target,
        color: "#fb923c",
        title: "MCQ Practice Mode",
        desc: "Exam-style multiple choice questions with AI-generated distractors.",
      },
      {
        icon: FlaskConical,
        color: "#f472b6",
        title: "Question Banks",
        desc: "Medical-grade QBanks with detailed AI explanations for every answer.",
      },
    ],
  },
  "1.0": {
    headline: "Welcome to AnkiGen",
    entries: [
      {
        icon: Sparkles,
        color: "#34d399",
        title: "AI Flashcard Generation",
        desc: "Upload PDFs, slides, or images. AI creates perfectly structured flashcards in seconds.",
      },
      {
        icon: Image,
        color: "#818cf8",
        title: "Visual Card Detection",
        desc: "AI detects diagrams, radiology images & figures — generating rich visual cards.",
      },
      {
        icon: BookOpen,
        color: "#38bdf8",
        title: "Immersive Study Mode",
        desc: "Flip cards, track progress, and review at your own pace.",
      },
    ],
  },
};

const STORAGE_KEY = "ankigen-whats-new-seen";

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsNewBanner() {
  const [isDark] = useDarkMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== APP_VERSION) {
        const t = setTimeout(() => setVisible(true), 600);
        cleanup = () => clearTimeout(t);
      }
    } catch {
      /* localStorage blocked */
    }
    return cleanup;
  }, []);

  // Keyboard dismiss
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch { /* ignore */ }
    setVisible(false);
  };

  const changelog = CHANGELOG[APP_VERSION];
  if (!changelog) return null;

  const overlayBg = isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.40)";
  const cardBg = isDark
    ? "bg-zinc-900 border-white/10"
    : "bg-white border-black/8";
  const headingColor = isDark ? "text-white" : "text-zinc-900";
  const subColor = isDark ? "text-white/50" : "text-zinc-500";
  const divider = isDark ? "bg-white/8" : "bg-black/6";
  const entryBg = isDark ? "bg-white/4 hover:bg-white/7" : "bg-black/3 hover:bg-black/5";
  const entryDesc = isDark ? "text-white/55" : "text-zinc-500";

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="whats-new-backdrop"
            className="fixed inset-0 z-[200]"
            style={{ background: overlayBg, backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            key="whats-new-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="What's New"
            className={`fixed left-1/2 -translate-x-1/2 z-[201] w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #f87171 0%, #e879f9 40%, #38bdf8 80%, #34d399 100%)",
              }}
            />

            <div className="px-4 pt-4 pb-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl shadow shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #f87171 0%, #e879f9 100%)",
                    }}
                  >
                    <Sparkles className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-sm font-bold leading-tight ${headingColor}`}>
                        What&apos;s New
                      </h2>
                      <span
                        className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(248,113,113,0.12)",
                          color: "#f87171",
                          border: "1px solid rgba(248,113,113,0.25)",
                        }}
                      >
                        v{APP_VERSION}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-tight mt-0.5 ${subColor}`}>
                      {changelog.headline}
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isDark ? "hover:bg-white/10 text-white/40 hover:text-white/70" : "hover:bg-black/6 text-black/35 hover:text-black/60"
                  }`}
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Divider */}
              <div className={`h-px w-full mb-3 ${divider}`} />

              {/* Feature entries */}
              <div className="flex flex-col gap-1.5">
                {changelog.entries.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <motion.div
                      key={entry.title}
                      className={`flex items-start gap-3 px-2.5 py-2 rounded-xl transition-colors ${entryBg}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                        style={{
                          background: `${entry.color}18`,
                          border: `1px solid ${entry.color}35`,
                        }}
                      >
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: entry.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[12px] font-semibold leading-tight ${headingColor}`}
                          >
                            {entry.title}
                          </span>
                          {entry.badge && (
                            <span
                              className="text-[9px] font-bold px-1 py-0.5 rounded-md"
                              style={{
                                background: `${entry.color}18`,
                                color: entry.color,
                                border: `1px solid ${entry.color}30`,
                              }}
                            >
                              {entry.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10.5px] leading-snug mt-0.5 ${entryDesc}`}>
                          {entry.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Dismiss button */}
              <motion.button
                onClick={dismiss}
                className="mt-3 w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(120deg, #f87171 0%, #e879f9 60%, #a78bfa 100%)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Check className="h-4 w-4" />
                Got it
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
