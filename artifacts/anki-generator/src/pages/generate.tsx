import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, FileText, ImageIcon, Layers, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateForm } from "@/components/generate-form";

const features = [
  {
    icon: FileText,
    title: "From PDFs & text",
    desc: "Drop a file or paste notes — we'll turn them into smart cards.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: ImageIcon,
    title: "Visual cards",
    desc: "PDFs with diagrams become visual flashcards automatically.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Layers,
    title: "Organized library",
    desc: "Group cards into topics, subdecks, and study sessions.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default function Generate() {
  const [, setLocation] = useLocation();

  return (
    <div className="relative min-h-[60vh] pb-12">
      {/* Animated background */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(150 60% 55% / 0.18) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 right-1/4 h-[360px] w-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(140 70% 50% / 0.16) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + (i % 3) * 3,
              height: 4 + (i % 3) * 3,
              background:
                i % 2
                  ? "hsl(150 50% 55% / 0.35)"
                  : "hsl(140 70% 50% / 0.35)",
              left: `${(i * 73) % 100}%`,
              top: `${10 + ((i * 47) % 70)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto pt-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1.4, 0.36, 1] }}
          className="relative inline-flex"
        >
          <motion.div
            className="absolute -inset-3 rounded-2xl"
            style={{
              background:
                "conic-gradient(from 0deg, hsl(150 60% 55%), hsl(95 65% 50%), hsl(160 60% 40%), hsl(150 60% 55%))",
              filter: "blur(12px)",
              opacity: 0.5,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-5 font-serif text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary via-emerald-500 to-lime-500 bg-clip-text text-transparent"
        >
          Generate Flashcards
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-3 text-muted-foreground text-base md:text-lg"
        >
          Turn any PDF, text, or topic into a polished study deck in seconds.
        </motion.p>
      </div>

      {/* Feature highlights — 2x2 grid */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {features.map(({ icon: Icon, title, desc, color, bg }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.4 + idx * 0.1,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="h-full aspect-square border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-background/70 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-5 h-full flex flex-col">
                <div
                  className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="font-semibold text-sm sm:text-base">{title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">
                  {desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Build with AI — 4th tile in 2x2 */}
        <motion.button
          type="button"
          onClick={() => {
            const el = document.getElementById("generate-form-section");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97 }}
          className="relative aspect-square rounded-xl overflow-hidden text-left group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-500 to-lime-500" />
          <motion.div
            aria-hidden
            className="absolute -inset-8 opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, hsl(150 60% 55% / 0.4), transparent 60%, hsl(95 65% 50% / 0.4), transparent)",
              filter: "blur(10px)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative h-full flex flex-col p-4 sm:p-5 text-white">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="font-semibold text-sm sm:text-base">Build with AI</p>
            <p className="text-xs sm:text-sm text-white/85 mt-1 leading-snug">
              Tap to start — upload, paste, generate.
            </p>
            <div className="mt-auto inline-flex items-center gap-1 text-xs font-semibold opacity-90 group-hover:opacity-100">
              Start
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Inline generation form */}
      <motion.div
        id="generate-form-section"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 max-w-2xl mx-auto scroll-mt-20"
      >
        <Card className="border-border/60 shadow-md bg-card/85 backdrop-blur-md overflow-hidden">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-lg font-semibold leading-tight truncate">
                    Build with AI
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload files, paste notes, or both.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setLocation("/decks?new=1")}
              >
                <Plus className="h-3.5 w-3.5" />
                Empty deck
              </Button>
            </div>

            <GenerateForm
              variant="page"
              animated
              onDone={() => setLocation("/decks")}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
