import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListDecks, useListQbanks } from "@workspace/api-client-react";
import { format, isThisWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers, FileText, Sparkles, TrendingUp, ChevronRight, PlusCircle,
  Clock, Flame, Brain, CheckCircle2, BookOpen, Stethoscope, CalendarClock,
} from "lucide-react";
import {
  getSessions,
  getStudyStreak,
  getLast7Days,
  getDeckStats,
  getTodayStats,
} from "@/lib/study-stats";
import { getTotalScheduledDueCount } from "@/lib/srs";
import type { Qbank } from "@workspace/api-client-react";
import { AppDownloads } from "@/components/app-downloads";
import { FeaturesShowcase } from "@/components/features-showcase";
import { ModelBadge } from "@/components/model-badge";

export default function Dashboard() {
  const { data: decks, isLoading } = useListDecks();
  const { data: qbanks } = useListQbanks();

  const sessions = useMemo(() => getSessions(), []);
  const streak = useMemo(() => getStudyStreak(sessions), [sessions]);
  const last7 = useMemo(() => getLast7Days(), []);
  const deckStats = useMemo(() => getDeckStats(sessions), [sessions]);
  const todayStats = useMemo(() => getTodayStats(sessions), [sessions]);

  const totalDecks = (decks ?? []).filter((d: { kind?: string }) => (d.kind ?? "deck") !== "qbank").length;
  const totalCards = (decks ?? []).filter((d: { kind?: string }) => (d.kind ?? "deck") !== "qbank").reduce((sum, d) => sum + d.cardCount, 0);
  const thisWeekDecks = (decks ?? []).filter((d: { kind?: string; createdAt: string }) => (d.kind ?? "deck") !== "qbank" && isThisWeek(new Date(d.createdAt))).length;
  const totalQbanks = (qbanks as Qbank[] | undefined)?.filter((q: Qbank) => !(q as Qbank & { parentId?: number | null }).parentId).length ?? 0;
  const totalQuestions = (qbanks as Qbank[] | undefined)?.reduce((sum: number, q: Qbank) => sum + (q.questionCount ?? 0), 0) ?? 0;

  const totalSessionCards = sessions.reduce((sum, s) => sum + s.total, 0);
  const totalKnown = sessions.reduce((sum, s) => sum + s.known, 0);
  const overallPct = totalSessionCards > 0 ? Math.round((totalKnown / totalSessionCards) * 100) : 0;
  const dueNowCount = useMemo(() => getTotalScheduledDueCount(), []);

  const maxDay = Math.max(...last7.map(d => d.total), 1);

  const recentDecks = [...(decks ?? [])].filter((d: { kind?: string }) => (d.kind ?? "deck") !== "qbank").sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const deckStatsList = [...deckStats.entries()]
    .map(([id, s]) => ({ id, ...s, pct: s.total > 0 ? Math.round((s.known / s.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentSessions = sessions.slice(0, 5);

  const hasStudied = sessions.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your study progress at a glance.</p>
          {import.meta.env.DEV && (
            <div className="mt-2">
              <ModelBadge />
            </div>
          )}
        </div>
        <Link href="/generate">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Generate Cards
          </Button>
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Flashcard Decks", value: totalDecks, icon: Layers, hexColor: "#34d399", bgClass: "bg-emerald-500/10", glowRgb: "52,211,153" },
          { label: "Total Cards", value: totalCards, icon: FileText, hexColor: "#38bdf8", bgClass: "bg-sky-500/10", glowRgb: "56,189,248" },
          { label: "Question Banks", value: totalQbanks, icon: Stethoscope, hexColor: "#a78bfa", bgClass: "bg-violet-500/10", glowRgb: "167,139,250" },
          { label: "Study Streak", value: streak > 0 ? `${streak}d` : "—", icon: Flame, hexColor: "#fb923c", bgClass: "bg-orange-500/10", glowRgb: "251,146,60" },
        ].map(({ label, value, icon: Icon, hexColor, bgClass, glowRgb }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
          <Card className="border-border/50 shadow-sm h-full hover:shadow-md transition-shadow overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 15% 50%, rgba(${glowRgb},0.1) 0%, transparent 65%)` }} />
            <CardContent className="p-4 flex flex-col gap-3 relative">
              <div className={`h-9 w-9 rounded-xl ${bgClass} flex items-center justify-center`}>
                <Icon className="h-4 w-4" style={{ color: hexColor }} />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                )}
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Study stats section */}
      {hasStudied ? (
        <>
          {/* Today's progress + Overall */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Studied Today</p>
                </div>
                <p className="text-3xl font-bold">{todayStats.cardsStudied}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayStats.cardsStudied > 0
                    ? `${todayStats.known} known · ${todayStats.cardsStudied - todayStats.known} still learning`
                    : "No cards studied yet today"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Known</p>
                </div>
                <p className="text-3xl font-bold">{overallPct}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalKnown} of {totalSessionCards} cards across all sessions
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                </div>
                <p className="text-3xl font-bold">{sessions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalSessionCards} cards reviewed in total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 7-day activity bar chart */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">7-Day Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-28">
                {last7.map((day, idx) => {
                  const knownH = day.total > 0 ? Math.round((day.known / maxDay) * 96) : 0;
                  const unknownH = day.total > 0 ? Math.round(((day.total - day.known) / maxDay) * 96) : 0;
                  const isEmpty = day.total === 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col-reverse items-stretch gap-0" style={{ height: 96 }}>
                        {isEmpty ? (
                          <div className="w-full rounded-sm bg-border/50" style={{ height: 4 }} title="No activity" />
                        ) : (
                          <>
                            <motion.div
                              className="w-full rounded-b-sm"
                              style={{ background: "linear-gradient(180deg,#4ade80,#16a34a)", minHeight: 2 }}
                              initial={{ height: 0 }}
                              animate={{ height: knownH }}
                              transition={{ duration: 0.6, delay: 0.3 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                              title={`${day.known} known`}
                            />
                            <motion.div
                              className="w-full rounded-t-sm"
                              style={{ background: "linear-gradient(180deg,#fb923c,#ea580c)", minHeight: 2 }}
                              initial={{ height: 0 }}
                              animate={{ height: unknownH }}
                              transition={{ duration: 0.6, delay: 0.3 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                              title={`${day.total - day.known} still learning`}
                            />
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-none">{day.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-green-500/80" />
                  <span className="text-xs text-muted-foreground">Known</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-orange-500/80" />
                  <span className="text-xs text-muted-foreground">Still learning</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-deck stats */}
          {deckStatsList.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Deck Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deckStatsList.map(d => (
                  <div key={d.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[60%]">{d.deckName}</span>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {d.pct}% known · {d.total} cards
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight mb-3">Recent Sessions</h2>
              <div className="space-y-2">
                {recentSessions.map(s => (
                  <Card key={s.id} className="border-border/50 shadow-sm">
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      <div className="h-9 w-9 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.deckName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.completedAt), "MMM d 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <span className="font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md">
                          {s.known} ✓
                        </span>
                        <span className="font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {s.unknown} ✗
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No study sessions yet — show prompt */
        <Card className="border-border/50 shadow-sm">
          <CardContent className="text-center py-10">
            <Brain className="mx-auto h-10 w-10 text-muted-foreground opacity-40 mb-3" />
            <p className="font-medium text-muted-foreground">No study sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Open a deck and hit <span className="font-medium text-foreground">Study</span> to start tracking your progress.
            </p>
            <Link href="/decks">
              <Button size="sm" variant="outline" className="gap-2">
                <Layers className="h-4 w-4" />
                Browse Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Due today widget */}
      {dueNowCount > 0 && (
        <Link href="/decks">
          <Card className="border-amber-400/40 dark:border-amber-600/30 bg-amber-500/5 shadow-sm hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  {dueNowCount} card{dueNowCount !== 1 ? "s" : ""} due for review
                </p>
                <p className="text-sm text-amber-700/70 dark:text-amber-400/70">Open a deck to review scheduled cards</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/generate">
          <Card className="border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Generate New Decks</p>
                <p className="text-sm text-muted-foreground">Upload files or paste text to create flashcards</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/decks">
          <Card className="border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Layers className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Browse Library</p>
                <p className="text-sm text-muted-foreground">View, edit, and export all your decks</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent decks */}
      {recentDecks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent Decks</h2>
            {totalDecks > 5 && (
              <Link href="/decks">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {recentDecks.map((deck, idx) => (
              <Link key={deck.id} href={`/decks/${deck.id}`}>
                <Card
                  className="border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{deck.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(deck.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Features showcase */}
      <FeaturesShowcase />

      {/* Download section — shown only on this page */}
      <AppDownloads />
    </div>
  );
}
