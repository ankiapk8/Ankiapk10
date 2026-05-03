import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/utils";
import {
  getSrsState, saveSrsState, getDefaultSrsState, computeNextState,
  getNextInterval, intervalLabel, getDueCardIds,
  type SrsRating,
} from "@/lib/srs";
import { saveSession } from "@/lib/study-stats";
import { Button } from "@/components/ui/button";
import { CalendarClock, ChevronLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import type { Card, Deck } from "@workspace/api-client-react/src/generated/api.schemas";

type DueCard = Card & { deckName: string; deckId: number };

export default function StudyDue() {
  const [flipped, setFlipped] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, known: 0 });

  const { data: decks } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    queryFn: async () => {
      const r = await fetch(apiUrl("api/decks"));
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 1000 * 60,
  });

  const allCards = useMemo<DueCard[]>(() => {
    if (!decks) return [];
    const out: DueCard[] = [];
    for (const deck of decks) {
      const d = deck as Deck & { cards?: Card[]; kind?: string };
      if ((d.kind ?? "deck") === "qbank") continue;
      const cards = d.cards ?? [];
      const dueIds = new Set(getDueCardIds(cards.map(c => c.id)));
      for (const card of cards) {
        if (dueIds.has(card.id)) {
          out.push({ ...card, deckName: d.name, deckId: d.id });
        }
      }
    }
    return out;
  }, [decks]);

  const current = allCards[cursor];
  const total = allCards.length;

  const rateCard = useCallback((rating: SrsRating) => {
    if (!current) return;
    const srsState = getSrsState(current.id) ?? getDefaultSrsState(current.id, current.deckId);
    const next = computeNextState(srsState, rating);
    saveSrsState(next);
    setSessionStats(prev => ({
      total: prev.total + 1,
      known: prev.known + (rating >= 3 ? 1 : 0),
    }));
    if (cursor + 1 >= total) {
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setCursor(c => c + 1), 80);
    }
  }, [current, cursor, total]);

  useEffect(() => {
    if (done && sessionStats.total > 0) {
      saveSession({ total: sessionStats.total, known: sessionStats.known });
    }
  }, [done, sessionStats]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      }
      if (flipped && !done) {
        if (e.key === "1") rateCard(1);
        else if (e.key === "2") rateCard(2);
        else if (e.key === "3") rateCard(3);
        else if (e.key === "4") rateCard(4);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, done, rateCard]);

  if (decks === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CalendarClock className="h-10 w-10 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Loading due cards…</p>
      </div>
    );
  }

  if (total === 0 || done) {
    const pct = sessionStats.total > 0 ? Math.round((sessionStats.known / sessionStats.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <div className="h-20 w-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-center">
            {done ? "All caught up!" : "Nothing due right now"}
          </h2>
          <p className="text-muted-foreground text-center mt-2">
            {done && sessionStats.total > 0
              ? `Reviewed ${sessionStats.total} card${sessionStats.total !== 1 ? "s" : ""} · ${pct}% known`
              : "No cards are due for review at the moment. Keep studying to build your schedule!"}
          </p>
        </motion.div>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link href="/decks">
            <Button>Browse Decks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          <span>{cursor + 1} / {total} due</span>
        </div>
      </div>

      <div className="w-full bg-muted/30 rounded-full h-1.5">
        <motion.div
          className="h-1.5 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((cursor) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>

      <div className="text-xs text-muted-foreground text-center">
        from <span className="font-medium text-foreground">{current.deckName}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${cursor}-${flipped ? "back" : "front"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 min-h-[180px] flex flex-col gap-3 cursor-pointer select-none"
          onClick={() => !flipped && setFlipped(true)}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {flipped ? "Back" : "Front — tap to reveal"}
          </p>
          <p className="text-lg leading-relaxed font-medium">
            {flipped ? current.back : current.front}
          </p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.05 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-center text-muted-foreground">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { rating: 1 as SrsRating, label: "Again", cls: "border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/12", kbd: "1" },
                  { rating: 2 as SrsRating, label: "Hard",  cls: "border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 bg-orange-500/5 hover:bg-orange-500/12", kbd: "2" },
                  { rating: 3 as SrsRating, label: "Good",  cls: "border-sky-200 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 bg-sky-500/5 hover:bg-sky-500/12", kbd: "3" },
                  { rating: 4 as SrsRating, label: "Easy",  cls: "border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/12", kbd: "4" },
                ] as Array<{ rating: SrsRating; label: string; cls: string; kbd: string }>
              ).map(({ rating, label, cls, kbd }) => {
                const srsState = getSrsState(current.id);
                const days = getNextInterval(rating, srsState);
                const lbl = intervalLabel(days);
                return (
                  <motion.button
                    key={rating}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all font-semibold text-sm ${cls}`}
                    onClick={() => rateCard(rating)}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-medium opacity-60">{lbl}</span>
                    <span className="text-[9px] opacity-35 font-normal">{kbd}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <div className="text-center text-xs text-muted-foreground">
          Space or F to flip · 1–4 to rate after flipping
        </div>
      )}
    </div>
  );
}
