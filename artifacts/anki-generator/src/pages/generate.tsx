import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, FileText, ImageIcon, Layers, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateSheet } from "@/components/generate-sheet";

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
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSheetOpen(true), 350);
    return () => clearTimeout(t);
  }, []);

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setTimeout(() => setLocation("/"), 200);
    }
  };

  const handleDone = () => {
    setSheetOpen(false);
    setTimeout(() => setLocation("/decks"), 200);
  };

  return (
    <div className="relative min-h-[60vh] pb-12">
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
      </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex items-center justify-center gap-3 flex-wrap"
        >
          <Button
            size="lg"
            className="gap-2 shadow-md shadow-primary/20"
            onClick={() => setSheetOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            Start Generating
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/decks")}
          >
            Browse Library
          </Button>
        </motion.div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {features.map(({ icon: Icon, title, desc, color, bg }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5 + idx * 0.1,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="h-full border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div
                  className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <GenerateSheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        onDone={handleDone}
      />
    </div>
  );
}
