import { motion } from "framer-motion";
import { useGetDashboardStats, useGetDashboardActivity, useGetDashboardChartData } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import {
  Activity, AlertTriangle, Package, Wrench, Clock, TrendingUp, CalendarCheck, Gauge
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

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: chartData, isLoading: chartLoading } = useGetDashboardChartData();

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

      {/* Activity Feed */}
      <motion.div
        variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5, delay: 0.5 }}
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
