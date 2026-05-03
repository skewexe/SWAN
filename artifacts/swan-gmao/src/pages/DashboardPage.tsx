import { motion } from "framer-motion";
import { useGetDashboardStats, useGetDashboardActivity, useGetDashboardChartData, useGetWorkOrders, useGetPreventivePlans } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import {
  Activity, AlertTriangle, Package, Wrench, Clock, TrendingUp, CalendarCheck, Gauge, CalendarDays, ChevronRight
} from "lucide-react";

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

const CHART_COLORS = ["#0A6DFF", "#38BDF8", "#22C55E", "#F59E0B", "#EF4444", "#94A3B8"];

function KpiCard({
  label, value, unit, icon: Icon, color, delay
}: {
  label: string; value: string | number; unit?: string; icon: any; color: string; delay: number;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4"
      data-testid={`kpi-card-${label.replace(/\s/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center`} style={{ background: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
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
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>{label}</span>;
}

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

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: chartData, isLoading: chartLoading } = useGetDashboardChartData();
  const { data: allWOs, isLoading: wosLoading } = useGetWorkOrders({});
  const { data: preventivePlans } = useGetPreventivePlans({});

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const upcomingWOs = (allWOs || []).filter(wo => {
    if (wo.status === "completed" || wo.status === "cancelled") return false;
    if (!wo.scheduledDate) return false;
    const d = new Date(wo.scheduledDate);
    return d >= today && d <= weekEnd;
  }).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()).slice(0, 6);

  const overduePlans = (preventivePlans || []).filter(p => p.status === "overdue");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1 text-sm">Vue d'ensemble opérationnelle en temps réel</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : stats ? (
          <>
            <KpiCard label="Équipements totaux" value={stats.totalAssets} icon={Wrench} color="#0A6DFF" delay={0} />
            <KpiCard label="Ordres de travail actifs" value={stats.activeWorkOrders} icon={Activity} color="#38BDF8" delay={0.05} />
            <KpiCard label="Alertes critiques" value={stats.criticalAlerts} icon={AlertTriangle} color="#EF4444" delay={0.1} />
            <KpiCard label="Taux de disponibilité" value={`${stats.availabilityRate.toFixed(1)}%`} icon={Gauge} color="#22C55E" delay={0.15} />
            <KpiCard label="MTBF moyen" value={stats.mtbf.toFixed(0)} unit="heures" icon={TrendingUp} color="#0A6DFF" delay={0.2} />
            <KpiCard label="MTTR moyen" value={stats.mttr.toFixed(1)} unit="heures" icon={Clock} color="#F59E0B" delay={0.25} />
            <KpiCard label="Stock en alerte" value={stats.lowStockItems} icon={Package} color="#EF4444" delay={0.3} />
            <KpiCard label="Maintenance planifiée" value={stats.plannedMaintenanceThisMonth} unit="ce mois" icon={CalendarCheck} color="#22C55E" delay={0.35} />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance by month */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6"
          data-testid="chart-maintenance-by-month"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Interventions par mois</h3>
          <p className="text-xs text-muted-foreground mb-6">Corrective vs préventive</p>
          {chartLoading ? (
            <Skeleton className="h-48" />
          ) : chartData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.maintenanceByMonth} barCategoryGap={8} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "#0F1C2E", border: "1px solid #1E293B", borderRadius: "8px", color: "#E6EDF3" }}
                  cursor={{ fill: "#0A6DFF08" }}
                />
                <Bar dataKey="corrective" name="Corrective" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="preventive" name="Préventive" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </motion.div>

        {/* Assets by category */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.45 }}
          className="bg-card border border-border/60 rounded-2xl p-6"
          data-testid="chart-assets-by-category"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Équipements par catégorie</h3>
          <p className="text-xs text-muted-foreground mb-4">Répartition du parc</p>
          {chartLoading ? (
            <Skeleton className="h-48" />
          ) : chartData ? (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={chartData.assetsByCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                    {chartData.assetsByCategory.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0F1C2E", border: "1px solid #1E293B", borderRadius: "8px", color: "#E6EDF3" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2">
                {chartData.assetsByCategory.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.category}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Agenda de la semaine + Plans en retard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming WOs */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.48 }}
          className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6"
          data-testid="upcoming-workorders"
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-foreground">Agenda de la semaine</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Interventions planifiées dans les 7 prochains jours</p>
          {wosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
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
                    className="flex items-center gap-4 bg-background/50 border border-border/40 rounded-xl px-4 py-3"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: dotColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{wo.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{wo.assetName || "—"} · {wo.technicianName || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
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

        {/* Overdue plans */}
        <motion.div
          variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.52 }}
          className="bg-card border border-border/60 rounded-2xl p-6"
          data-testid="overdue-plans"
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
                  className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3"
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
        data-testid="activity-feed"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1">Activité récente</h3>
        <p className="text-xs text-muted-foreground mb-6">Derniers événements sur la plateforme</p>
        {activityLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-4 py-3 border-b border-border/40 last:border-0"
                data-testid={`activity-item-${item.id}`}
              >
                <div className="mt-0.5 h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: SEVERITY_COLORS[item.severity] || "#94A3B8" }} />
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
