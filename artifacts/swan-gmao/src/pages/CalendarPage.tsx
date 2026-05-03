import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetWorkOrders, useGetPreventivePlans } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, CalendarDays, Wrench, CalendarClock,
  Clock, User, MapPin, AlertTriangle, CheckCircle2, Circle
} from "lucide-react";

const MONTH_NAMES_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];
const DAY_NAMES_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

type CalEventType = "wo" | "preventive";
type ViewMode = "month" | "week";

interface CalEvent {
  id: string;
  type: CalEventType;
  title: string;
  date: Date;
  status: string;
  priority?: string;
  technician?: string;
  asset?: string;
  color: string;
  raw: any;
}

const WO_STATUS_COLOR: Record<string, string> = {
  open: "#0A6DFF",
  in_progress: "#38BDF8",
  completed: "#22C55E",
  cancelled: "#64748B",
  on_hold: "#F59E0B",
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#38BDF8",
  low: "#64748B",
};
const WO_STATUS_FR: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  on_hold: "En attente",
};
const WO_TYPE_FR: Record<string, string> = {
  corrective: "Corrective",
  preventive: "Préventive",
  predictive: "Prédictive",
  inspection: "Inspection",
};
const PRIORITY_FR: Record<string, string> = {
  critical: "Critique",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const weeks: (Date | null)[][] = [];
  let current: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    current.push(new Date(year, month, d));
    if (current.length === 7) { weeks.push(current); current = []; }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function EventChip({ event, onClick }: { event: CalEvent; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate transition-opacity hover:opacity-80"
      style={{ background: event.color + "22", color: event.color, borderLeft: `2px solid ${event.color}` }}
    >
      {event.title}
    </button>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [filterType, setFilterType] = useState<"all" | "wo" | "preventive">("all");
  const [weekDate, setWeekDate] = useState(today);

  const { data: workOrders = [] } = useGetWorkOrders({});
  const { data: plans = [] } = useGetPreventivePlans({});

  const events: CalEvent[] = useMemo(() => {
    const woEvents: CalEvent[] = (workOrders as any[])
      .filter(wo => wo.scheduledDate)
      .map(wo => ({
        id: `wo-${wo.id}`,
        type: "wo" as const,
        title: wo.title,
        date: new Date(wo.scheduledDate),
        status: wo.status,
        priority: wo.priority,
        technician: wo.technicianName,
        asset: wo.assetName,
        color: WO_STATUS_COLOR[wo.status] || "#0A6DFF",
        raw: wo,
      }));

    const planEvents: CalEvent[] = (plans as any[])
      .filter(p => p.nextDue)
      .map(p => ({
        id: `plan-${p.id}`,
        type: "preventive" as const,
        title: p.name,
        date: new Date(p.nextDue),
        status: p.status,
        color: p.status === "overdue" ? "#EF4444" : "#22C55E",
        asset: p.assetName,
        raw: p,
      }));

    return [...woEvents, ...planEvents].filter(e => {
      if (filterType === "wo") return e.type === "wo";
      if (filterType === "preventive") return e.type === "preventive";
      return true;
    });
  }, [workOrders, plans, filterType]);

  const eventsForDay = (day: Date) => events.filter(e => isSameDay(e.date, day));

  const monthStats = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthEvents = events.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month);
    const woCount = monthEvents.filter(e => e.type === "wo").length;
    const planCount = monthEvents.filter(e => e.type === "preventive").length;
    const overdueCount = monthEvents.filter(e => e.status === "overdue").length;
    return { total: monthEvents.length, woCount, planCount, overdueCount };
  }, [events, viewDate]);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const prevWeek = () => setWeekDate(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd; });
  const nextWeek = () => setWeekDate(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd; });

  const grid = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth());
  const weekDays = getWeekDays(weekDate);

  const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 - 17:00

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Planification</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendrier de maintenance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Suivi et planification des interventions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {(["all","wo","preventive"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterType === f ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f === "all" ? "Tout" : f === "wo" ? "OT" : "Préventive"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {(["month","week"] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === v ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {v === "month" ? "Mois" : "Semaine"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total ce mois", value: monthStats.total, color: "#0A6DFF", icon: CalendarDays },
          { label: "Ordres de travail", value: monthStats.woCount, color: "#38BDF8", icon: Wrench },
          { label: "Préventives", value: monthStats.planCount, color: "#22C55E", icon: CalendarClock },
          { label: "En retard", value: monthStats.overdueCount, color: "#EF4444", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: color + "15" }}>
              <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/60 rounded-3xl overflow-hidden"
      >
        {/* Navigation Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={viewMode === "month" ? prevMonth : prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground min-w-40 text-center">
              {viewMode === "month"
                ? `${MONTH_NAMES_FR[viewDate.getMonth()]} ${viewDate.getFullYear()}`
                : `Semaine du ${weekDays[0].toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })}`
              }
            </h2>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={viewMode === "month" ? nextMonth : nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
              setWeekDate(today);
            }}
          >
            Aujourd'hui
          </Button>
        </div>

        {viewMode === "month" ? (
          <>
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-border/60">
              {DAY_NAMES_FR.map(day => (
                <div key={day} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  {day}
                </div>
              ))}
            </div>
            {/* Month Grid */}
            <div>
              {grid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-border/40 last:border-0">
                  {week.map((day, di) => {
                    const dayEvents = day ? eventsForDay(day) : [];
                    const isToday = day && isSameDay(day, today);
                    const isCurrentMonth = day && day.getMonth() === viewDate.getMonth();
                    return (
                      <div
                        key={di}
                        className={`min-h-[100px] p-2 border-r border-border/40 last:border-r-0 ${
                          !isCurrentMonth ? "opacity-40" : ""
                        } ${isToday ? "bg-primary/5" : ""}`}
                      >
                        {day && (
                          <>
                            <div className={`text-xs font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday ? "bg-primary text-white" : "text-muted-foreground"
                            }`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 3).map(ev => (
                                <EventChip key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-muted-foreground pl-1 cursor-pointer hover:text-foreground">
                                  +{dayEvents.length - 3} autres
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Week View */
          <>
            <div className="grid grid-cols-8 border-b border-border/60">
              <div className="px-3 py-2" />
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <div key={i} className={`px-2 py-2 text-center border-l border-border/40 ${isToday ? "bg-primary/5" : ""}`}>
                    <div className="text-xs text-muted-foreground">{DAY_NAMES_FR[i]}</div>
                    <div className={`text-sm font-semibold mt-0.5 mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-white" : "text-foreground"
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/20 min-h-[60px]">
                  <div className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day, di) => {
                    const dayEvts = eventsForDay(day);
                    return (
                      <div key={di} className="border-l border-border/40 p-1 space-y-0.5">
                        {di === 0 && dayEvts.map(ev => (
                          <EventChip key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* All-day events for week view */}
            </div>
            {/* Show events below the hour grid for week view */}
            <div className="grid grid-cols-8 bg-background/40">
              <div className="px-3 py-2 text-xs text-muted-foreground">Interventions</div>
              {weekDays.map((day, di) => {
                const dayEvts = eventsForDay(day);
                return (
                  <div key={di} className="border-l border-border/40 p-1.5 space-y-1">
                    {dayEvts.map(ev => (
                      <EventChip key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                    ))}
                    {dayEvts.length === 0 && <div className="h-6" />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Légende:</span>
        {Object.entries(WO_STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span>OT {WO_STATUS_FR[status]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Préventive planifiée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span>En retard</span>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: selectedEvent.color }}
                  />
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full border"
                    style={{
                      background: selectedEvent.color + "20",
                      color: selectedEvent.color,
                      borderColor: selectedEvent.color + "50",
                    }}
                  >
                    {selectedEvent.type === "wo"
                      ? WO_STATUS_FR[selectedEvent.status] || selectedEvent.status
                      : selectedEvent.status === "overdue" ? "En retard" : "Planifiée"
                    }
                  </span>
                  {selectedEvent.priority && (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full border"
                      style={{
                        background: PRIORITY_COLOR[selectedEvent.priority] + "20",
                        color: PRIORITY_COLOR[selectedEvent.priority],
                        borderColor: PRIORITY_COLOR[selectedEvent.priority] + "50",
                      }}
                    >
                      {PRIORITY_FR[selectedEvent.priority]}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{selectedEvent.date.toLocaleDateString("fr-DZ", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                  </div>
                  {selectedEvent.asset && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Wrench className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span>{selectedEvent.asset}</span>
                    </div>
                  )}
                  {selectedEvent.technician && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span>{selectedEvent.technician}</span>
                    </div>
                  )}
                  {selectedEvent.type === "wo" && selectedEvent.raw.estimatedHours && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                      <span>{selectedEvent.raw.estimatedHours}h estimées</span>
                    </div>
                  )}
                  {selectedEvent.type === "wo" && selectedEvent.raw.description && (
                    <div className="bg-background/60 rounded-lg p-3 text-muted-foreground text-xs leading-relaxed border border-border/40 mt-2">
                      {selectedEvent.raw.description}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
