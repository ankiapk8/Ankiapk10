import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";

const SPLASH_KEY = "ankigen_splash_seen_v1";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (seen) {
      setShow(false);
      return;
    }
    setShow(true);
    const t = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setShow(false);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  if (show === null) return null;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, hsl(150 40% 96%) 0%, hsl(0 0% 100%) 45%, hsl(25 50% 97%) 100%)",
            }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6 + (i % 3) * 4,
                  height: 6 + (i % 3) * 4,
                  background:
                    i % 2
                      ? "hsl(150 50% 55% / 0.45)"
                      : "hsl(20 90% 60% / 0.45)",
                  left: `${(i * 83) % 100}%`,
                  top: `${(i * 47) % 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.6],
                  y: [0, -40 - i * 5, -80],
                }}
                transition={{
                  duration: 1.8,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}

            <motion.div
              className="absolute rounded-full"
              style={{
                width: 320,
                height: 320,
                background:
                  "radial-gradient(circle, hsl(150 60% 55% / 0.18) 0%, transparent 65%)",
                filter: "blur(10px)",
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 0.9, 0.7] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />

            <div className="relative flex flex-col items-center gap-5">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1.4, 0.36, 1],
                }}
                className="relative"
              >
                <motion.div
                  className="absolute -inset-4 rounded-3xl"
                  style={{
                    background:
                      "conic-gradient(from 0deg, hsl(150 60% 55%), hsl(20 90% 60%), hsl(150 60% 55%))",
                    filter: "blur(14px)",
                    opacity: 0.45,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center border border-primary/10">
                  <BookOpen className="h-12 w-12 text-primary" strokeWidth={2.2} />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "backOut" }}
                  >
                    <Sparkles className="h-5 w-5 text-orange-500 fill-orange-500/30" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-center"
              >
                <h1 className="font-serif text-4xl font-bold tracking-tight bg-gradient-to-br from-primary via-emerald-600 to-orange-500 bg-clip-text text-transparent">
                  AnkiGen
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="mt-2 text-sm text-muted-foreground tracking-wide"
                >
                  Smart flashcards, instantly.
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 1.4, ease: "easeInOut" }}
                style={{ originX: 0 }}
                className="h-[3px] w-40 rounded-full overflow-hidden bg-muted"
              >
                <motion.div
                  className="h-full w-1/3 bg-gradient-to-r from-primary to-orange-500 rounded-full"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 0 : 1 }}
        transition={{ duration: 0.5, delay: show ? 0 : 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
