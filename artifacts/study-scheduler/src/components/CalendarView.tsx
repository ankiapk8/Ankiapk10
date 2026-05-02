import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpsertTopics, getGetAllTopicsQueryKey } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ScheduledItem, Topic, Status, Priority } from "@/lib/topics";

interface CalendarViewProps {
  items: ScheduledItem[];
  allTopics: Record<string, Topic[]>;
  startDate: Date;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function priorityBg(p: Priority) {
  if (p === "High") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (p === "Low") return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
}

function statusBg(s: Status) {
  if (s === "Done") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (s === "Revised") return "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
  if (s === "In Progress") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
}

function chipColor(p: Priority) {
  if (p === "High") return "bg-red-500";
  if (p === "Low") return "bg-blue-500";
  return "bg-amber-500";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function CalendarView({ items, allTopics, startDate }: CalendarViewProps) {
  const queryClient = useQueryClient();
  const upsertTopics = useUpsertTopics();
  const { toast } = useToast();
  const calendarRef = useRef<HTMLDivElement>(null);

  const [viewMonth, setViewMonth] = useState(startDate.getMonth());
  const [viewYear, setViewYear] = useState(startDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = startOffset + lastDay.getDate();
  const numRows = Math.ceil(totalCells / 7);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function getItemsForDate(d: Date) {
    return items.filter((item) => isSameDay(item.firstDate, d) || isSameDay(item.secondDate, d));
  }

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

  async function updateTopicField(item: ScheduledItem, field: "status" | "priority", value: string) {
    const current = allTopics[item.storageKey] ?? [];
    const updated = current.map((t) =>
      t.id === item.topic.id ? { ...t, [field]: value } : t
    );
    upsertTopics.mutate(
      { storageKey: item.storageKey, data: { topics: updated } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllTopicsQueryKey() });
          toast({ title: "Updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  }

  const cells: Array<{ date: Date | null; dayItems: ScheduledItem[] }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, dayItems: [] });
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(viewYear, viewMonth, d);
    cells.push({ date, dayItems: getItemsForDate(date) });
  }

  return (
    <div ref={calendarRef}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-prev-month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid="button-next-month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}>
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`empty-${i}`} />;
          const isPast = cell.date < startDate;
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const dayItems = cell.dayItems;
          const visibleItems = dayItems.slice(0, 3);
          const overflow = dayItems.length - 3;

          return (
            <button
              key={cell.date.getTime()}
              data-testid={`cell-day-${cell.date.getDate()}`}
              onClick={() => setSelectedDate(isSelected ? null : cell.date)}
              style={{ animationDelay: `${i * 12}ms` }}
              className={[
                "min-h-[72px] p-1 border-t border-l border-border text-left transition-colors",
                "animate-in fade-in duration-300",
                isPast ? "opacity-40" : "",
                isSelected ? "bg-accent/70 ring-1 ring-primary" : "hover:bg-muted/50",
                isToday ? "ring-2 ring-primary ring-inset" : "",
                i % 7 === 6 ? "border-r" : "",
                i >= cells.length - 7 ? "border-b" : "",
              ].filter(Boolean).join(" ")}
            >
              <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"} block mb-1`}>
                {cell.date.getDate()}
              </span>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <div
                    key={item.topic.id + (isSameDay(item.firstDate, cell.date!) ? "1" : "2")}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-1 ${priorityBg(item.topic.priority)}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${chipColor(item.topic.priority)}`} />
                    <span className="truncate">{item.topic.name}</span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{overflow} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4 space-y-4" data-testid="panel-day-detail">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {DAY_NAMES[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
            </p>
            <button onClick={() => setSelectedDate(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics scheduled for this day.</p>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item) => {
                const isFirst = isSameDay(item.firstDate, selectedDate);
                return (
                  <div key={item.topic.id + (isFirst ? "1" : "2")} className="rounded-lg border border-card-border p-3 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.topic.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{isFirst ? "1st Study" : "2nd Study"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.subjectLabel} · {item.parentLabel}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.topic.filesAndMedia && (
                        <a href={item.topic.filesAndMedia} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <ExternalLink className="h-3 w-3" /> Files
                        </a>
                      )}
                      {item.topic.videoLink && (
                        <a href={item.topic.videoLink} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:opacity-80 transition-opacity">
                          <ExternalLink className="h-3 w-3" /> Video
                        </a>
                      )}
                      {item.topic.amboss && (
                        <a href={item.topic.amboss} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:opacity-80 transition-opacity">
                          <ExternalLink className="h-3 w-3" /> Amboss
                        </a>
                      )}
                    </div>

                    {item.topic.notes && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
                        {item.topic.notes}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
                        <div className="flex gap-1.5">
                          {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                            <button
                              key={p}
                              data-testid={`button-priority-${item.topic.id}-${p}`}
                              onClick={() => updateTopicField(item, "priority", p)}
                              className={[
                                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                                item.topic.priority === p
                                  ? p === "High" ? "bg-red-500 text-white border-red-500"
                                    : p === "Low" ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-amber-500 text-white border-amber-500"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                              ].join(" ")}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["Not Started", "In Progress", "Done", "Revised"] as Status[]).map((s) => (
                            <button
                              key={s}
                              data-testid={`button-status-${item.topic.id}-${s.replace(" ", "-")}`}
                              onClick={() => updateTopicField(item, "status", s)}
                              className={[
                                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                                item.topic.status === s
                                  ? `${statusBg(s)} border-transparent`
                                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                              ].join(" ")}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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
