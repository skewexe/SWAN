import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetDashboardStats, useGetDashboardActivity, useGetDashboardChartData, useGetWorkOrders, useGetPreventivePlans } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, Legend
} from "recharts";
import {
  Activity, AlertTriangle, Package, Wrench, Clock, TrendingUp,
  CalendarCheck, Gauge, CalendarDays, ChevronRight, X, Filter,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const STATUS_COLORS: Record<string, string> = {
  open: "#0A6DFF",
  in_progress: "#38BDF8",
  completed: "#22C55E",
  cancelled: "#94A3B8",
  on_hold: "#F59E0B",
};
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  warning: "#F59E0B",
  info: "#38BDF8",
  success: "#22C55E",
};
const CHART_COLORS = ["#0A6DFF", "#38BDF8", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];
const WO_STATUS_MAP: Record<string, { label: string; bg: string }> = {
  open: { label: "Ouvert", bg: "bg-primary/10 text-primary border-primary/30" },
  in_progress: { label: "En cours", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  completed: { label: "Terminé", bg: "bg-green-500/10 text-green-400 border-green-500/30" },
  cancelled: { label: "Annulé", bg: "bg-muted text-muted-foreground border-border" },
  on_hold: { label: "En attente", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
};
const PRIORITY_DOT: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#38BDF8",
  low: "#94A3B8",
};

interface ActiveFilters {
  category: string | null;
  status: string | null;
  month: string | null;
  priority: string | null;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30"
    >
      <Filter className="h-3 w-3" strokeWidth={2} />
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </motion.span>
  );
}

function KpiCard({
  label, value, unit, icon: Icon, color, delay, trend
}: {
  label: string; value: string | number; unit?: string; icon: any; color: string; delay: number; trend?: number;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</span>
          {unit && <span className="text-xs text-muted-foreground pb-0.5">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${
            trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-muted-foreground"
          }`}>
            {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}60, ${color}10)` }} />
    </motion.div>
  );
}

function ActivitySeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    critical: { label: "Critique", className: "bg-destructive/10 text-destructive border-destructive/30" },
    warning: { label: "Attention", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
    info: { label: "Info", className: "bg-primary/10 text-primary border-primary/30" },
    success: { label: "Succès", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  };
  const { label, className } = map[severity] || map.info;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`}>{label}</span>;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
      <div className="font-semibold text-foreground mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
      <div className="font-semibold text-foreground">{payload[0].name}</div>
      <div className="text-muted-foreground mt-0.5">{payload[0].value} équipements</div>
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: chartData, isLoading: chartLoading } = useGetDashboardChartData();
  const { data: allWOs, isLoading: wosLoading } = useGetWorkOrders({});
  const { data: preventivePlans } = useGetPreventivePlans({});

  const [filters, setFilters] = useState<ActiveFilters>({
    category: null,
    status: null,
    month: null,
    priority: null,
  });

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const setFilter = (key: keyof ActiveFilters, value: string | null) =>
    setFilters(f => ({ ...f, [key]: f[key] === value ? null : value }));

  const clearAllFilters = () => setFilters({ category: null, status: null, month: null, priority: null });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Filtered WOs
  const filteredWOs = useMemo(() => {
    return (allWOs || []).filter(wo => {
      if (filters.status && wo.status !== filters.status) return false;
      if (filters.priority && wo.priority !== filters.priority) return false;
      if (filters.month && wo.scheduledDate) {
        const m = new Date(wo.scheduledDate).toLocaleDateString("fr-DZ", { month: "short" });
        if (m !== filters.month) return false;
      }
      return true;
    });
  }, [allWOs, filters]);

  // Upcoming WOs (filtered)
  const upcomingWOs = useMemo(() =>
    filteredWOs.filter(wo => {
      if (wo.status === "completed" || wo.status === "cancelled") return false;
      if (!wo.scheduledDate) return false;
      const d = new Date(wo.scheduledDate);
      return d >= today && d <= weekEnd;
    }).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()).slice(0, 6),
    [filteredWOs, today, weekEnd]
  );

  const overduePlans = useMemo(() =>
    (preventivePlans || []).filter(p => p.status === "overdue"),
    [preventivePlans]
  );

  const filteredStats = useMemo(() => {
    if (!stats) return null;
    const workOrders = filteredWOs;
    const activeWorkOrders = workOrders.filter(wo => wo.status === "open" || wo.status === "in_progress").length;
    const criticalAlerts = workOrders.filter(wo => wo.priority === "critical" && wo.status !== "completed").length;
    const plannedMaintenanceThisMonth = workOrders.filter(wo => {
      if (!wo.scheduledDate) return false;
      const date = new Date(wo.scheduledDate);
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }).length;
    const lowStockItems = stats.lowStockItems;
    return {
      ...stats,
      activeWorkOrders,
      criticalAlerts,
      plannedMaintenanceThisMonth,
      lowStockItems,
    };
  }, [stats, filteredWOs, today]);

  // Filtered chart data
  const filteredChartData = useMemo(() => {
    if (!chartData) return null;
    return {
      ...chartData,
      assetsByCategory: chartData.assetsByCategory.map(item => ({
        ...item,
        selected: filters.category === item.category,
      })),
      maintenanceByMonth: chartData.maintenanceByMonth.map(item => ({
        ...item,
        selected: filters.month === item.month,
      })),
    };
  }, [chartData, filters]);

  // Cross-filter: status breakdown driven by priority+month filters (not status itself)
  const woStatusBreakdown = useMemo(() => {
    const wos = (allWOs || []).filter(wo => {
      if (filters.priority && wo.priority !== filters.priority) return false;
      if (filters.month && wo.scheduledDate) {
        const m = new Date(wo.scheduledDate).toLocaleDateString("fr-DZ", { month: "short" });
        if (m !== filters.month) return false;
      }
      return true;
    });
    const counts: Record<string, number> = {};
    wos.forEach(wo => { counts[wo.status] = (counts[wo.status] || 0) + 1; });
    const total = wos.length;
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [allWOs, filters.priority, filters.month]);

  // Cross-filter: priority breakdown driven by status+month filters (not priority itself)
  const woPriorityBreakdown = useMemo(() => {
    const wos = (allWOs || []).filter(wo => {
      if (filters.status && wo.status !== filters.status) return false;
      if (filters.month && wo.scheduledDate) {
        const m = new Date(wo.scheduledDate).toLocaleDateString("fr-DZ", { month: "short" });
        if (m !== filters.month) return false;
      }
      return true;
    });
    const counts: Record<string, number> = {};
    wos.forEach(wo => { counts[wo.priority] = (counts[wo.priority] || 0) + 1; });
    const total = wos.length;
    return Object.entries(counts)
      .map(([priority, count]) => ({ priority, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [allWOs, filters.status, filters.month]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Vue d'ensemble</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Opérations en temps réel — cliquez sur les graphiques pour filtrer</p>
        </div>
        {activeFilterCount > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-1.5 text-xs h-8">
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Réinitialiser ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-muted-foreground font-medium">Filtres actifs:</span>
            {filters.category && <FilterChip label={`Catégorie: ${filters.category}`} onRemove={() => setFilter("category", null)} />}
            {filters.status && <FilterChip label={`Statut: ${WO_STATUS_MAP[filters.status]?.label || filters.status}`} onRemove={() => setFilter("status", null)} />}
            {filters.month && <FilterChip label={`Mois: ${filters.month}`} onRemove={() => setFilter("month", null)} />}
            {filters.priority && <FilterChip label={`Priorité: ${filters.priority}`} onRemove={() => setFilter("priority", null)} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : filteredStats ? (
          <>
            <KpiCard label="Équipements" value={filteredStats.totalAssets} icon={Wrench} color="#0A6DFF" delay={0} trend={2} />
            <KpiCard label="OT actifs" value={filteredStats.activeWorkOrders} icon={Activity} color="#38BDF8" delay={0.05} trend={-5} />
            <KpiCard label="Alertes critiques" value={filteredStats.criticalAlerts} icon={AlertTriangle} color="#EF4444" delay={0.1} trend={0} />
            <KpiCard label="Disponibilité" value={`${filteredStats.availabilityRate.toFixed(1)}%`} icon={Gauge} color="#22C55E" delay={0.15} trend={1} />
            <KpiCard label="MTBF moyen" value={filteredStats.mtbf.toFixed(0)} unit="h" icon={TrendingUp} color="#0A6DFF" delay={0.2} trend={8} />
            <KpiCard label="MTTR moyen" value={filteredStats.mttr.toFixed(1)} unit="h" icon={Clock} color="#F59E0B" delay={0.25} trend={-3} />
            <KpiCard label="Stock en alerte" value={filteredStats.lowStockItems} icon={Package} color="#EF4444" delay={0.3} />
            <KpiCard label="Planifié ce mois" value={filteredStats.plannedMaintenanceThisMonth} icon={CalendarCheck} color="#22C55E" delay={0.35} />
          </>
        ) : null}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Bar Chart */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Interventions par mois</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Corrective vs préventive{filters.month ? ` · Filtre: ${filters.month}` : " · Cliquez pour filtrer"}</p>
            </div>
          </div>
          {chartLoading ? (
            <Skeleton className="h-52 mt-4" />
          ) : filteredChartData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filteredChartData.maintenanceByMonth} barCategoryGap={12} barGap={4} onClick={(data) => {
                if (data?.activeLabel) setFilter("month", data.activeLabel);
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#0A6DFF08" }} />
                <Legend
                  formatter={(value) => <span style={{ color: "#94A3B8", fontSize: 11 }}>{value}</span>}
                  iconType="circle" iconSize={8}
                />
                <Bar
                  dataKey="corrective" name="Corrective" radius={[4, 4, 0, 0]} maxBarSize={22}
                  cursor="pointer"
                >
                  {filteredChartData.maintenanceByMonth.map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={entry.selected ? "#EF4444" : "#EF444480"}
                      stroke={entry.selected ? "#EF4444" : "none"}
                      strokeWidth={entry.selected ? 2 : 0}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="preventive" name="Préventive" radius={[4, 4, 0, 0]} maxBarSize={22}
                  cursor="pointer"
                >
                  {filteredChartData.maintenanceByMonth.map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={entry.selected ? "#22C55E" : "#22C55E80"}
                      stroke={entry.selected ? "#22C55E" : "none"}
                      strokeWidth={entry.selected ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.45 }}
          className="bg-card border border-border/60 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Par catégorie</h3>
          <p className="text-xs text-muted-foreground mb-4">Cliquez pour filtrer</p>
          {chartLoading ? (
            <Skeleton className="h-52" />
          ) : filteredChartData ? (
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={filteredChartData.assetsByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%" cy="50%"
                    innerRadius={38} outerRadius={65}
                    strokeWidth={0}
                    cursor="pointer"
                    onClick={(data) => setFilter("category", data.category)}
                  >
                    {filteredChartData.assetsByCategory.map((entry: any, idx: number) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        opacity={entry.selected || !filters.category ? 1 : 0.35}
                        stroke={entry.selected ? "#fff" : "none"}
                        strokeWidth={entry.selected ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5">
                {filteredChartData.assetsByCategory.map((item: any, idx: number) => (
                  <button
                    key={item.category}
                    onClick={() => setFilter("category", item.category)}
                    className={`w-full flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-colors ${
                      filters.category === item.category
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span>{item.category}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Status + Priority Cross-Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WO Status Distribution */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.48 }}
          className="bg-card border border-border/60 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Statut des ordres de travail</h3>
          <p className="text-xs text-muted-foreground mb-4">Cliquez pour filtrer les interventions</p>
          {wosLoading ? <Skeleton className="h-24" /> : (
            <div className="space-y-2">
              {woStatusBreakdown.map(({ status, count, pct }) => {
                const info = WO_STATUS_MAP[status];
                const color = STATUS_COLORS[status] || "#94A3B8";
                const isActive = filters.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter("status", status)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                      isActive ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium text-foreground flex-1">{info?.label || status}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card border border-border/60 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Priorité des ordres de travail</h3>
          <p className="text-xs text-muted-foreground mb-4">Cliquez pour filtrer par priorité</p>
          {wosLoading ? <Skeleton className="h-24" /> : (
            <div className="space-y-2">
              {woPriorityBreakdown.map(({ priority, count, pct }) => {
                const color = PRIORITY_DOT[priority] || "#94A3B8";
                const labels: Record<string, string> = { critical: "Critique", high: "Élevée", medium: "Moyenne", low: "Faible" };
                const isActive = filters.priority === priority;
                return (
                  <button
                    key={priority}
                    onClick={() => setFilter("priority", priority)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                      isActive ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium text-foreground flex-1">{labels[priority] || priority}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Availability Trend */}
      <motion.div
        variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.51 }}
        className="bg-card border border-border/60 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tendance de disponibilité</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Taux de disponibilité estimé · 6 derniers mois</p>
          </div>
          {filteredStats && (
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums" style={{ color: "#22C55E" }}>
                {filteredStats.availabilityRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Actuel</div>
            </div>
          )}
        </div>
        {chartLoading ? (
          <Skeleton className="h-36" />
        ) : filteredChartData ? (() => {
          const trendData = filteredChartData.maintenanceByMonth.map((item: any) => {
            const total = item.corrective + item.preventive;
            const corrRatio = total > 0 ? item.corrective / total : 0;
            const avail = Math.max(72, Math.min(99, 96 - corrRatio * 28 + item.preventive * 0.4));
            return { month: item.month, disponibilite: Math.round(avail * 10) / 10, objectif: 95 };
          });
          return (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAvail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradObj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A6DFF" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#0A6DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
                        <div className="font-semibold text-foreground mb-2">{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex items-center gap-2 py-0.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: p.stroke }} />
                            <span className="text-muted-foreground">{p.name === "disponibilite" ? "Disponibilité" : "Objectif"}:</span>
                            <span className="font-semibold text-foreground">{p.value}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="objectif" stroke="#0A6DFF" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gradObj)" dot={false} name="objectif" />
                <Area type="monotone" dataKey="disponibilite" stroke="#22C55E" strokeWidth={2} fill="url(#gradAvail)" dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} name="disponibilite" />
              </AreaChart>
            </ResponsiveContainer>
          );
        })() : null}
      </motion.div>

      {/* Agenda + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.52 }}
          className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-foreground">Agenda de la semaine</h3>
            </div>
            <Link href="/calendar">
              <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Interventions planifiées dans les 7 prochains jours
            {activeFilterCount > 0 && <span className="text-primary ml-1">(filtrées)</span>}
          </p>
          {wosLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : upcomingWOs.length > 0 ? (
            <div className="space-y-2">
              {upcomingWOs.map((wo, idx) => {
                const statusInfo = WO_STATUS_MAP[wo.status] || WO_STATUS_MAP.open;
                const dotColor = PRIORITY_DOT[wo.priority] || "#94A3B8";
                const date = new Date(wo.scheduledDate!);
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <motion.div
                    key={wo.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-4 bg-background/50 border border-border/40 rounded-xl px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: dotColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{wo.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{wo.assetName || "—"} · {wo.technicianName || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>{statusInfo.label}</span>
                      <span className={`text-xs font-medium tabular-nums ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                        {isToday ? "Aujourd'hui" : date.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground border border-border/30 rounded-xl bg-background/30">
              <CalendarDays className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" strokeWidth={1} />
              Aucune intervention planifiée cette semaine
            </div>
          )}
        </motion.div>

        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.55 }}
          className="bg-card border border-border/60 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-foreground">Plans en retard</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Maintenances préventives dépassées</p>
          {overduePlans.length > 0 ? (
            <div className="space-y-2">
              {overduePlans.slice(0, 5).map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 hover:border-yellow-500/40 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground leading-snug truncate">{plan.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Prévu: <span className="text-yellow-400 font-medium">
                      {plan.nextDue ? new Date(plan.nextDue).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" }) : "—"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground border border-border/30 rounded-xl bg-background/30">
              <CalendarCheck className="h-6 w-6 mx-auto mb-2 text-green-400/50" strokeWidth={1} />
              <span className="text-green-400 font-medium">Tout est à jour</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.58 }}
        className="bg-card border border-border/60 rounded-2xl p-6"
      >
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">CMMS premium 2026</p>
          <h3 className="text-sm font-semibold text-foreground">Suite maintenance complète</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gestion technique, gammes opératoires, OT, stocks, planning, KPI, coût ABC et historique.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 mb-5">
          {[
            { label: "Interventions", value: "OT en cours", icon: Wrench, onClick: () => setFilter("status", "in_progress") },
            { label: "Préventif", value: "Plans à suivre", icon: CalendarCheck, onClick: () => setFilter("type", "preventive") },
            { label: "Stocks", value: "Pièces critiques", icon: Package, onClick: () => setFilter("category", "inventory") },
          ].map(({ label, value, icon: Icon, onClick }) => (
            <button key={label} onClick={onClick} className="text-left rounded-2xl border border-border/60 bg-background/50 p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">{label}</div>
                  <div className="text-sm font-medium text-foreground">{value}</div>
                </div>
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </div>
        {activityLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-0">
            {activity.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-start gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20 px-2 rounded-lg -mx-2 transition-colors"
              >
                <div className="mt-2 h-2 w-2 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[item.severity] || "#94A3B8" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.timestamp).toLocaleString("fr-DZ", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <ActivitySeverityBadge severity={item.severity} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
        )}
      </motion.div>
    </div>
  );
}
