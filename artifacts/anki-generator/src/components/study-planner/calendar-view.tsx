import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Camera, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type SubjectGroup, type Topic,
  computeSchedule, isoDate, PARENT_DOT_COLORS, STATUS_COLORS, PRIORITY_COLORS,
  writeStudyActivity,
} from "@/lib/study-planner/topics";
import { useStudyTopicsContext } from "@/context/study-topics-context";

interface Props {
  groups: SubjectGroup[];
  topicsMap: Record<string, Topic[]>;
  startDate: Date;
  endDate: Date;
  spacing: number;
  weightByDifficulty: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function CalendarView({ groups, topicsMap, startDate, endDate, spacing, weightByDifficulty }: Props) {
  const { upsertTopics } = useStudyTopicsContext();
  const calRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(0);

  const scheduled = useMemo(
    () => computeSchedule(groups, topicsMap, startDate, endDate, spacing, weightByDifficulty),
    [groups, topicsMap, startDate, endDate, spacing, weightByDifficulty],
  );

  const byDay = useMemo(() => {
    const map: Record<string, typeof scheduled> = {};
    for (const item of scheduled) {
      const k1 = isoDate(item.firstDate);
      const k2 = isoDate(item.secondDate);
      if (!map[k1]) map[k1] = [];
      map[k1].push(item);
      if (k2 !== k1) {
        if (!map[k2]) map[k2] = [];
        map[k2].push(item);
      }
    }
    return map;
  }, [scheduled]);

  // Build list of months to render
  const months = useMemo(() => {
    const list: Date[] = [];
    const start = startOfMonth(startDate);
    const end = startOfMonth(endDate);
    let cur = new Date(start);
    while (cur <= end) {
      list.push(new Date(cur));
      cur = addMonths(cur, 1);
    }
    return list;
  }, [startDate, endDate]);

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver for sticky month tab
  useEffect(() => {
    if (months.length <= 1) return;
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-month-idx") ?? "0", 10);
            setVisibleMonth(idx);
          }
        }
      },
      { threshold: 0.3 },
    );
    monthRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [months.length]);

  const scrollToMonth = (idx: number) => {
    monthRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToToday = () => {
    const todayIdx = months.findIndex(m =>
      m.getFullYear() === new Date().getFullYear() && m.getMonth() === new Date().getMonth()
    );
    if (todayIdx >= 0) scrollToMonth(todayIdx);
  };

  const saveAsImage = async () => {
    if (!calRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(calRef.current, { scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = "study-calendar.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const todayStr = isoDate(new Date());
  const selectedItems = selectedDay ? (byDay[selectedDay] ?? []) : [];

  const cycleStatus = (item: typeof scheduled[0]) => {
    const statuses = ["Not Started", "In Progress", "Done", "Revised"] as const;
    const topics = topicsMap[item.storageKey] ?? [];
    const t = topics.find(x => x.id === item.topic.id);
    if (!t) return;
    const idx = (statuses.indexOf(t.status) + 1) % statuses.length;
    const newStatus = statuses[idx];
    upsertTopics(item.storageKey, topics.map(x => x.id === t.id ? { ...x, status: newStatus } : x));
    if (newStatus === "Done" || newStatus === "Revised") writeStudyActivity();
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={scrollToToday} className="h-8 text-xs gap-1">
          <CalendarIcon className="h-3.5 w-3.5" /> Today
        </Button>
        <Button variant="outline" size="sm" onClick={saveAsImage} className="h-8 text-xs gap-1">
          <Camera className="h-3.5 w-3.5" /> Save as Image
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {scheduled.length} topics scheduled
        </span>
      </div>

      {/* Month tab strip */}
      {months.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {months.map((m, i) => (
            <button
              key={i}
              onClick={() => scrollToMonth(i)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                i === visibleMonth
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {MONTHS_SHORT[m.getMonth()]} {m.getFullYear() !== startDate.getFullYear() ? m.getFullYear() : ""}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div ref={calRef} className="space-y-6">
        {months.map((month, mi) => {
          const firstDay = month.getDay();
          const totalDays = daysInMonth(month);
          const cells = Array(firstDay).fill(null).concat(
            Array.from({ length: totalDays }, (_, i) => i + 1)
          );

          return (
            <div key={mi} ref={el => { monthRefs.current[mi] = el; }} data-month-idx={mi}>
              {/* Month header */}
              {mi > 0 && <div className="flex items-center gap-2 mb-3"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground font-semibold">{MONTHS[month.getMonth()].toUpperCase()} {month.getFullYear()}</span><div className="h-px flex-1 bg-border" /></div>}
              {mi === 0 && <h3 className="text-sm font-semibold text-center mb-3">{MONTHS[month.getMonth()].toUpperCase()} {month.getFullYear()}</h3>}

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, ci) => {
                  if (!day) return <div key={ci} />;
                  const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayItems = byDay[dateStr] ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDay;

                  return (
                    <button
                      key={ci}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-start pt-1 transition-colors text-xs ${
                        isSelected ? "bg-primary/15 border border-primary/40" :
                        isToday ? "bg-primary/8 border border-primary/20" :
                        "hover:bg-accent"
                      }`}
                    >
                      <span className={`font-medium text-[11px] leading-none ${
                        isToday ? "text-primary font-bold" :
                        isSelected ? "text-primary" :
                        "text-foreground/70"
                      }`}>
                        {day}
                      </span>
                      {dayItems.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                          {dayItems.slice(0, 3).map((item, di) => (
                            <div
                              key={di}
                              className={`w-1.5 h-1.5 rounded-full ${PARENT_DOT_COLORS[item.parentLabel] ?? "bg-gray-400"}`}
                            />
                          ))}
                          {dayItems.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayItems.length - 3}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{selectedDay}</h3>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item, i) => {
                const live = (topicsMap[item.storageKey] ?? []).find(t => t.id === item.topic.id) ?? item.topic;
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg border bg-background p-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${PARENT_DOT_COLORS[item.parentLabel] ?? "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{live.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.subjectLabel}</p>
                    </div>
                    <button
                      onClick={() => cycleStatus(item)}
                      className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${STATUS_COLORS[live.status]}`}
                    >
                      {live.status}
                    </button>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${PRIORITY_COLORS[live.priority]}`}>
                      {live.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
