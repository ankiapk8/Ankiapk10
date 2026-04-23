import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Monitor, Sparkles, Check } from "lucide-react";

const STORAGE_KEY = "ankigen-appearance";
type Appearance = "mobile" | "desktop";

function applyAppearance(value: Appearance) {
  document.documentElement.setAttribute("data-appearance", value);
}

export function getStoredAppearance(): Appearance | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "mobile" || v === "desktop" ? v : null;
  } catch {
    return null;
  }
}

export function AppearanceChooser({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Appearance | null>(() => getStoredAppearance());
  const [confirming, setConfirming] = useState<Appearance | null>(null);

  useEffect(() => {
    if (choice) applyAppearance(choice);
  }, [choice]);

  const handlePick = (value: Appearance) => {
    if (confirming) return;
    setConfirming(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    applyAppearance(value);
    window.setTimeout(() => setChoice(value), 850);
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {!choice && (
          <motion.div
            key="appearance-chooser"
            className="fixed inset-0 z-[80] flex items-center justify-center px-5 py-8 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(ellipse at top, #16A34A 0%, #15803D 45%, #064E3B 100%)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Choose appearance"
          >
            {/* Floating ambient blobs */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(167,243,208,0.45), transparent 70%)" }}
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(74,222,128,0.35), transparent 70%)" }}
              animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Sparkle particles */}
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.div
                key={i}
                aria-hidden
                className="pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-white/70"
                style={{
                  left: `${(i * 73) % 100}%`,
                  top: `${(i * 37) % 100}%`,
                  filter: "blur(0.5px)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -40, -80] }}
                transition={{
                  duration: 3 + (i % 4) * 0.4,
                  repeat: Infinity,
                  delay: (i * 0.18) % 2.5,
                  ease: "easeInOut",
                }}
              />
            ))}

            <div className="relative w-full max-w-3xl flex flex-col items-center text-center text-white">
              <motion.div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold uppercase tracking-wider mb-5"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                One quick choice
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.25)" }}
              >
                How would you like AnkiGen to look?
              </motion.h1>
              <motion.p
                className="text-white/85 text-base sm:text-lg max-w-xl mb-8 sm:mb-10"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                Pick the layout that feels right for you. You can change this anytime later.
              </motion.p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 w-full">
                <ChoiceCard
                  value="mobile"
                  title="Mobile"
                  subtitle="Compact, phone-style layout"
                  icon={<Smartphone className="w-12 h-12" strokeWidth={1.8} />}
                  delay={0.55}
                  confirming={confirming === "mobile"}
                  disabled={confirming !== null && confirming !== "mobile"}
                  onPick={() => handlePick("mobile")}
                  preview={<MobilePreview />}
                />
                <ChoiceCard
                  value="desktop"
                  title="Desktop"
                  subtitle="Spacious, full-width layout"
                  icon={<Monitor className="w-12 h-12" strokeWidth={1.8} />}
                  delay={0.7}
                  confirming={confirming === "desktop"}
                  disabled={confirming !== null && confirming !== "desktop"}
                  onPick={() => handlePick("desktop")}
                  preview={<DesktopPreview />}
                />
              </div>

              <motion.p
                className="text-white/70 text-xs mt-7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                Tip: mobile mode pins the content to a phone-friendly width, even on big screens.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChoiceCard({
  value,
  title,
  subtitle,
  icon,
  preview,
  delay,
  confirming,
  disabled,
  onPick,
}: {
  value: Appearance;
  title: string;
  subtitle: string;
  icon: ReactNode;
  preview: ReactNode;
  delay: number;
  confirming: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className="group relative overflow-hidden rounded-3xl bg-white/95 hover:bg-white text-slate-800 p-6 sm:p-7 text-left shadow-2xl border border-white/40 backdrop-blur disabled:opacity-60 disabled:cursor-not-allowed"
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={disabled ? undefined : { y: -6, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      data-testid={`appearance-${value}`}
      aria-label={`Use ${title.toLowerCase()} appearance`}
    >
      {/* Hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(34,197,94,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg"
          whileHover={disabled ? undefined : { rotate: [0, -6, 6, 0] }}
          transition={{ duration: 0.6 }}
        >
          {icon}
        </motion.div>
        <AnimatePresence>
          {confirming && (
            <motion.div
              key="check"
              className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
            >
              <Check className="w-5 h-5" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <div className="text-xl sm:text-2xl font-bold mb-1">{title}</div>
        <div className="text-sm text-slate-600 mb-5">{subtitle}</div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-green-50 border border-emerald-100 h-32 sm:h-36 flex items-center justify-center overflow-hidden">
          {preview}
        </div>
      </div>

      {/* Confirm wash overlay */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            key="wash"
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/90 to-green-600/90 flex flex-col items-center justify-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
              className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mb-3"
            >
              <Check className="w-9 h-9" strokeWidth={3} />
            </motion.div>
            <div className="font-semibold text-lg">Setting up {title}…</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function MobilePreview() {
  return (
    <motion.div
      className="relative w-16 h-28 rounded-[14px] bg-slate-900 shadow-md p-1"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-full h-full rounded-[10px] bg-white overflow-hidden flex flex-col">
        <div className="h-3 bg-emerald-500" />
        <div className="flex-1 p-1 flex flex-col gap-1">
          <div className="h-1.5 bg-emerald-100 rounded-sm" />
          <div className="h-1.5 bg-emerald-100 rounded-sm w-3/4" />
          <div className="h-3 bg-emerald-200 rounded-sm mt-1" />
          <div className="h-3 bg-emerald-200 rounded-sm" />
        </div>
      </div>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-slate-700" />
    </motion.div>
  );
}

function DesktopPreview() {
  return (
    <motion.div
      className="relative w-36 h-24 flex flex-col items-center"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
    >
      <div className="w-full h-20 rounded-md bg-slate-900 p-1 shadow-md">
        <div className="w-full h-full rounded-sm bg-white overflow-hidden flex">
          <div className="w-8 bg-emerald-500" />
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            <div className="h-1.5 bg-emerald-100 rounded-sm w-2/3" />
            <div className="flex gap-1 flex-1">
              <div className="flex-1 bg-emerald-200 rounded-sm" />
              <div className="flex-1 bg-emerald-200 rounded-sm" />
              <div className="flex-1 bg-emerald-200 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
      <div className="w-10 h-1 bg-slate-700 rounded-b-md" />
      <div className="w-16 h-0.5 bg-slate-600 rounded-full mt-0.5" />
    </motion.div>
  );
}
