import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGetQbank, useListQbankQuestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Check, X, ChevronRight, ChevronLeft, Trophy,
  RotateCcw, Stethoscope, BookOpen, Target, Sparkles,
} from "lucide-react";
import { saveSession } from "@/lib/study-stats";
import type { Question } from "@workspace/api-client-react";

const LETTER = ["A", "B", "C", "D", "E", "F"];

const LETTER_BG: Record<string, string> = {
  A: "bg-sky-500", B: "bg-orange-500", C: "bg-purple-500",
  D: "bg-pink-500", E: "bg-teal-500", F: "bg-amber-500",
};

function getGrade(pct: number) {
  if (pct >= 0.9) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" };
  if (pct >= 0.75) return { label: "Good", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" };
  if (pct >= 0.6) return { label: "Fair", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" };
  return { label: "Needs Work", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" };
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

type Answer = { questionIndex: number; selectedIndex: number; correct: boolean };

const cardVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 72 : -72, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 340, damping: 30 } },
  exit: (dir: number) => ({ x: dir < 0 ? 72 : -72, opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: "easeIn" as const } }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const fadeUp = { hidden: { y: 22, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 26 } } };

function ResultsView({
  questions,
  answers,
  qbankName,
  qbankId,
  onReset,
}: {
  questions: Question[];
  answers: Answer[];
  qbankName: string;
  qbankId: number;
  onReset: () => void;
}) {
  const correct = answers.filter(a => a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? correct / total : 0;
  const grade = getGrade(pct);
  const ringOffset = RING_C * (1 - pct);

  useEffect(() => {
    if (pct >= 0.75) {
      const burst = (x: number) => confetti({
        particleCount: pct >= 0.9 ? 90 : 55,
        spread: 72,
        startVelocity: 42,
        origin: { x, y: 0.55 },
        colors: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ede9fe"],
        scalar: 1.05,
        ticks: 220,
      });
      setTimeout(() => burst(0.25), 300);
      setTimeout(() => burst(0.75), 460);
      if (pct >= 0.9) setTimeout(() => burst(0.5), 650);
    }
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Link href={`/qbanks/${qbankId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope className="h-4 w-4 text-violet-500 shrink-0" />
          <span className="font-semibold text-sm truncate">{qbankName}</span>
        </div>
        <Badge className="ml-auto shrink-0 bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">
          Results
        </Badge>
      </div>

      <div className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pt-2">
            <div className="relative">
              <svg viewBox="0 0 120 120" width={148} height={148}>
                <circle cx={60} cy={60} r={RING_R} fill="none" stroke="currentColor" strokeWidth={9} className="text-muted/25" />
                <motion.circle
                  cx={60} cy={60} r={RING_R}
                  fill="none" stroke="currentColor" strokeWidth={9} strokeLinecap="round"
                  strokeDasharray={RING_C}
                  initial={{ strokeDashoffset: RING_C }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 }}
                  transform="rotate(-90 60 60)"
                  className={grade.bg.replace("bg-", "text-")}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold font-serif text-foreground leading-none"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                >
                  {Math.round(pct * 100)}%
                </motion.span>
                <span className="text-xs text-muted-foreground mt-0.5">{correct}/{total}</span>
              </div>
            </div>
            <div className="text-center space-y-0.5">
              <p className={`text-xl font-bold font-serif ${grade.color}`}>{grade.label}</p>
              <p className="text-sm text-muted-foreground">
                {correct} correct · {total - correct} wrong · {total} questions
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { label: "Correct", value: correct, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50" },
              { label: "Wrong", value: total - correct, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-200 dark:border-rose-800/50" },
              { label: "Accuracy", value: `${Math.round(pct * 100)}%`, color: grade.color, bg: "bg-muted/40 border-border/60" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-3.5 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2 h-11" onClick={onReset}>
              <RotateCcw className="h-4 w-4" /> Practice Again
            </Button>
            <Link href={`/qbanks/${qbankId}`} className="flex-1">
              <Button className="w-full gap-2 h-11 bg-violet-600 hover:bg-violet-700 text-white">
                <BookOpen className="h-4 w-4" /> Back to QBank
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-2">
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Question Review</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {answers.map((ans, i) => {
              const q = questions[ans.questionIndex];
              if (!q) return null;
              const choices = q.choices ?? [];
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`rounded-xl border p-3.5 ${
                    ans.correct
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/5"
                      : "border-rose-200 dark:border-rose-800/50 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      ans.correct ? "bg-emerald-500" : "bg-rose-500"
                    }`}>
                      {ans.correct
                        ? <Check className="h-3 w-3 text-white stroke-[3]" />
                        : <X className="h-3 w-3 text-white stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{q.front}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {!ans.correct && choices[ans.selectedIndex] && (
                          <span className="text-xs text-rose-600 dark:text-rose-400">
                            Your answer: {LETTER[ans.selectedIndex]}. {choices[ans.selectedIndex]}
                          </span>
                        )}
                        {choices[(q.correctIndex ?? 0)] && (
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">
                            Correct: {LETTER[q.correctIndex ?? 0]}. {choices[q.correctIndex ?? 0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                      ans.correct
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    }`}>Q{i + 1}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PracticeSession({
  questions,
  qbankName,
  qbankId,
  onDone,
}: {
  questions: Question[];
  qbankName: string;
  qbankId: number;
  onDone: (answers: Answer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);

  const current = questions[index];
  const choices = current?.choices ?? [];
  const correctIndex = current?.correctIndex ?? 0;
  const total = questions.length;
  const progress = (index / total) * 100;
  const correctSoFar = answers.filter(a => a.correct).length;
  const wrongSoFar = answers.filter(a => !a.correct).length;
  const isCurrentCorrect = revealed && (answers[index]?.correct === true);

  const handleSelect = useCallback((i: number) => {
    if (revealed) return;
    setSelected(i);
  }, [revealed]);

  const handleConfirm = useCallback(() => {
    if (selected === null || revealed) return;
    const isCorrect = selected === correctIndex;
    setRevealed(true);
    setAnswers(prev => [...prev, { questionIndex: index, selectedIndex: selected, correct: isCorrect }]);
    if (!isCorrect) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 700);
    }
  }, [selected, revealed, correctIndex, index]);

  const handleNext = useCallback(() => {
    const newAnswers = answers;
    if (index + 1 >= total) {
      onDone(newAnswers);
      return;
    }
    setDirection(1);
    setIndex(i => i + 1);
    setSelected(null);
    setRevealed(false);
    setWrongFlash(false);
  }, [index, total, answers, onDone]);

  const handlePrev = useCallback(() => {
    if (index === 0) return;
    setDirection(-1);
    setIndex(i => i - 1);
    setSelected(answers[index - 1]?.selectedIndex ?? null);
    setRevealed(index - 1 < answers.length);
  }, [index, answers]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "6") {
        const i = parseInt(e.key) - 1;
        if (i < choices.length) handleSelect(i);
      }
      if ((e.key === "Enter" || e.key === " ") && !revealed && selected !== null) {
        e.preventDefault(); handleConfirm();
      }
      if ((e.key === "Enter" || e.key === " ") && revealed) {
        e.preventDefault(); handleNext();
      }
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [choices.length, selected, revealed, handleSelect, handleConfirm, handleNext, handlePrev]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href={`/qbanks/${qbankId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Stethoscope className="h-4 w-4 text-violet-500 shrink-0" />
            <span className="font-semibold text-sm truncate">{qbankName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <Check className="h-3 w-3 stroke-[2.5]" /> {correctSoFar}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
              <X className="h-3 w-3 stroke-[2.5]" /> {wrongSoFar}
            </span>
          </div>
        </div>
        <div className="relative h-1.5 bg-muted/40">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-violet-400 rounded-r-full"
            initial={false}
            animate={{ width: `${revealed ? ((index + 1) / total) * 100 : progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="px-4 pt-5 pb-2 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Question {index + 1}
          </span>
          <span className="text-xs text-muted-foreground">of {total}</span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < answers.length
                  ? answers[i]?.correct ? "bg-emerald-500 w-4" : "bg-rose-500 w-4"
                  : i === index ? "bg-violet-500 w-4" : "bg-muted w-2"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-32 max-w-lg mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
          >
            {/* 3D Flip question card */}
            <div style={{ perspective: "1100px" }}>
              <motion.div
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d", position: "relative" }}
              >
                {/* Front face — question */}
                <div
                  className={`rounded-2xl border bg-card shadow-sm p-5 transition-all duration-300 ${
                    wrongFlash ? "border-rose-400/60 shadow-rose-500/10 shadow-lg" : "border-border/50"
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {current?.pageNumber != null && (
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium">Page {current.pageNumber}</p>
                  )}
                  <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                    {current?.front}
                  </p>
                </div>
                {/* Back face — result verdict */}
                <div
                  className={`absolute inset-0 rounded-2xl border p-5 flex items-center justify-center gap-4 ${
                    isCurrentCorrect
                      ? "bg-emerald-500/10 border-emerald-400/60 dark:bg-emerald-950/20"
                      : "bg-rose-500/10 border-rose-400/60 dark:bg-rose-950/20"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                    isCurrentCorrect ? "bg-emerald-500 shadow-emerald-500/30" : "bg-rose-500 shadow-rose-500/30"
                  }`}>
                    {isCurrentCorrect
                      ? <Check className="h-6 w-6 text-white stroke-[3]" />
                      : <X className="h-6 w-6 text-white stroke-[3]" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-xl font-serif leading-tight ${
                      isCurrentCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                    }`}>
                      {isCurrentCorrect ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {LETTER[correctIndex]}. {choices[correctIndex]}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <ul className="space-y-2.5">
              {choices.map((choice, i) => {
                const isCorrect = i === correctIndex;
                const isSelected = selected === i;
                const letter = LETTER[i] ?? String(i + 1);

                let cardCls = "border-border/50 bg-background hover:border-violet-400/50 hover:bg-violet-500/5";
                let letterBg = LETTER_BG[letter] ?? "bg-slate-500";
                let textCls = "text-foreground";
                let icon: React.ReactNode = null;

                if (revealed) {
                  if (isCorrect) {
                    cardCls = "border-emerald-400/70 bg-emerald-500/8 dark:bg-emerald-950/30 shadow-sm";
                    letterBg = "bg-emerald-500";
                    textCls = "text-emerald-900 dark:text-emerald-100";
                    icon = <Check className="h-3.5 w-3.5 text-white stroke-[3]" />;
                  } else if (isSelected) {
                    cardCls = "border-rose-400/70 bg-rose-500/8 dark:bg-rose-950/30";
                    letterBg = "bg-rose-500";
                    textCls = "text-rose-900 dark:text-rose-100";
                    icon = <X className="h-3.5 w-3.5 text-white stroke-[3]" />;
                  } else {
                    cardCls = "border-border/30 bg-muted/30";
                    textCls = "text-muted-foreground";
                    letterBg = "bg-muted-foreground/20";
                  }
                } else if (isSelected) {
                  cardCls = "border-violet-500/60 bg-violet-500/8 shadow-sm shadow-violet-500/10";
                  letterBg = "bg-violet-600";
                  textCls = "text-violet-900 dark:text-violet-100";
                }

                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, type: "spring", stiffness: 320, damping: 26 }}
                  >
                    <motion.button
                      type="button"
                      disabled={revealed}
                      onClick={() => handleSelect(i)}
                      whileTap={!revealed ? { scale: 0.985 } : undefined}
                      animate={
                        wrongFlash && isSelected && !isCorrect
                          ? { x: [-5, 5, -4, 4, -2, 2, 0] }
                          : revealed && isCorrect
                          ? { scale: [1, 1.015, 1] }
                          : {}
                      }
                      transition={
                        wrongFlash && isSelected
                          ? { duration: 0.45, ease: "easeInOut" }
                          : revealed && isCorrect
                          ? { duration: 0.4, delay: 0.1 }
                          : undefined
                      }
                      className={`w-full flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${cardCls} ${revealed ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white transition-colors duration-200 ${letterBg}`}>
                        {icon ?? letter}
                      </span>
                      <span className={`flex-1 text-sm sm:text-base leading-relaxed font-medium transition-colors duration-200 ${textCls}`}>
                        {choice}
                      </span>
                    </motion.button>
                  </motion.li>
                );
              })}
            </ul>

            <AnimatePresence>
              {revealed && current?.back && (
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  className="rounded-2xl border p-4 relative overflow-hidden"
                  style={{ background: "rgba(167,139,250,0.05)", borderColor: "rgba(167,139,250,0.25)" }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)" }} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.35)" }}>
                        <Sparkles className="h-3 w-3" style={{ color: "#a78bfa" }} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Explanation</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{current.back}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/50 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {!revealed ? (
            <motion.div layout>
              <Button
                className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-40"
                disabled={selected === null}
                onClick={handleConfirm}
              >
                <Target className="h-4 w-4" />
                {selected === null ? "Select an answer" : "Confirm Answer"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex gap-3"
            >
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl flex-1 ${
                answers[answers.length - 1]?.correct
                  ? "bg-emerald-500/12 border border-emerald-300/50 dark:border-emerald-700/50"
                  : "bg-rose-500/10 border border-rose-300/50 dark:border-rose-700/50"
              }`}>
                {answers[answers.length - 1]?.correct ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Correct!</span>
                  </>
                ) : (
                  <>
                    <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                      <X className="h-3.5 w-3.5 text-white stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">Incorrect</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {index > 0 && (
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  className="gap-2 px-6 h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/20"
                  onClick={handleNext}
                >
                  {index + 1 >= total ? (
                    <><Trophy className="h-4 w-4" /> See Results</>
                  ) : (
                    <>Next <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          <p className="text-center text-[10px] text-muted-foreground/50 hidden sm:block">
            {!revealed
              ? selected !== null ? "Press Space or Enter to confirm" : "Press 1–4 to select"
              : "Press Space or Enter to continue"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PracticeQbank() {
  const [, params] = useRoute("/practice-qbank/:id");
  const id = Number(params?.id);

  const { data: qbank, isLoading: loadingQbank } = useGetQbank(id);
  const { data: rawQuestions, isLoading: loadingQuestions } = useListQbankQuestions(id);

  const questions = useMemo(() => {
    return (rawQuestions ?? []).filter(
      q => Array.isArray(q.choices) && q.choices.length >= 2 && typeof q.correctIndex === "number"
    );
  }, [rawQuestions]);

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [done, setDone] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (questions.length > 0) {
      setShuffledQuestions([...questions]);
    }
  }, [questions]);

  const handleDone = useCallback((answers: Answer[]) => {
    setFinalAnswers(answers);
    setDone(true);
    if (qbank && answers.length > 0) {
      saveSession({
        deckId: id,
        deckName: qbank.name,
        total: answers.length,
        known: answers.filter(a => a.correct).length,
        unknown: answers.filter(a => !a.correct).length,
        completedAt: new Date().toISOString(),
      });
    }
  }, [qbank, id]);

  const handleReset = useCallback(() => {
    setFinalAnswers([]);
    setDone(false);
    const arr = [...questions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledQuestions(arr);
  }, [questions]);

  const qbankName = qbank?.name ?? "Question Bank";

  if (loadingQbank || loadingQuestions) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-2 rounded-full" />
        <Skeleton className="h-32 rounded-2xl" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  if (!qbank) {
    return (
      <div className="text-center py-20">
        <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground mb-3 opacity-40" />
        <p className="font-medium text-muted-foreground">Question bank not found</p>
        <Link href="/decks">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
          <Stethoscope className="h-7 w-7 text-violet-600" />
        </div>
        <p className="text-lg font-serif font-semibold">No MCQ questions yet</p>
        <p className="text-muted-foreground text-sm">
          This question bank has no multiple-choice questions to practice.
        </p>
        <Link href={`/qbanks/${id}`}>
          <Button variant="outline" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" /> Back to QBank
          </Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <ResultsView
        questions={shuffledQuestions}
        answers={finalAnswers}
        qbankName={qbankName}
        qbankId={id}
        onReset={handleReset}
      />
    );
  }

  if (shuffledQuestions.length === 0) return null;

  return (
    <PracticeSession
      questions={shuffledQuestions}
      qbankName={qbankName}
      qbankId={id}
      onDone={handleDone}
    />
  );
}
