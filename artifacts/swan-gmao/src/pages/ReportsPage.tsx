import { motion } from "framer-motion";
import { useGetKpiReport, useGetCostReport } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { TrendingUp, Clock, Gauge, PieChart as PieIcon, AlertCircle } from "lucide-react";

function KpiMetric({ label, value, unit, color, subtitle }: {
  label: string; value: string | number; unit?: string; color: string; subtitle?: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6" data-testid={`kpi-metric-${label.replace(/\s/g, '-').toLowerCase()}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { data: kpis, isLoading: kpisLoading } = useGetKpiReport();
  const { data: costs, isLoading: costsLoading } = useGetCostReport();

  const availColor = kpis
    ? kpis.availabilityRate >= 95 ? "#22C55E" : kpis.availabilityRate >= 85 ? "#F59E0B" : "#EF4444"
    : "#E6EDF3";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rapports & KPIs</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicateurs de performance de la maintenance</p>
      </div>

      {/* KPI Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {kpisLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : kpis ? (
          <>
            <KpiMetric label="MTBF" value={kpis.mtbf.toFixed(0)} unit="heures" color="#0A6DFF" subtitle="Temps moyen entre pannes" />
            <KpiMetric label="MTTR" value={kpis.mttr.toFixed(1)} unit="heures" color="#F59E0B" subtitle="Temps moyen de réparation" />
            <KpiMetric label="Taux de disponibilité" value={`${kpis.availabilityRate.toFixed(1)}%`} color={availColor} subtitle={kpis.availabilityRate >= 95 ? "Excellent" : kpis.availabilityRate >= 85 ? "Acceptable" : "Critique"} />
            <KpiMetric label="Taux de maintenance réussie" value={`${kpis.maintenanceCostRatio.toFixed(0)}%`} color="#22C55E" subtitle="OT complétés / total" />
            <KpiMetric label="Préventif / Correctif" value={`${kpis.plannedVsUnplanned.toFixed(0)}%`} color="#38BDF8" subtitle="Part de maintenance planifiée" />
          </>
        ) : null}
      </motion.div>

      {/* Top failing assets */}
      {kpis && kpis.topFailingAssets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/60 rounded-2xl p-6"
          data-testid="top-failing-assets"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-foreground">Équipements les plus défaillants</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Basé sur les interventions correctives</p>
          <div className="space-y-3">
            {kpis.topFailingAssets.map((item, idx) => (
              <div key={item.assetName} className="flex items-center gap-4" data-testid={`failing-asset-${idx}`}>
                <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-medium">{item.assetName}</span>
                    <span className="text-xs text-muted-foreground">{item.failures} panne{item.failures > 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((item.failures / (kpis.topFailingAssets[0]?.failures || 1)) * 100, 100)}%`,
                        background: idx === 0 ? "#EF4444" : idx === 1 ? "#F59E0B" : "#0A6DFF"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cost breakdown chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border/60 rounded-2xl p-6"
        data-testid="cost-chart"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1">Coûts de maintenance par mois</h3>
        <p className="text-xs text-muted-foreground mb-6">Main d'oeuvre, pièces et arrêts de production (DZD)</p>
        {costsLoading ? (
          <Skeleton className="h-64" />
        ) : costs ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costs.byMonth} barCategoryGap={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#0F1C2E", border: "1px solid #1E293B", borderRadius: "8px", color: "#E6EDF3" }}
                cursor={{ fill: "#0A6DFF08" }}
                formatter={(v: number, name: string) => [`${v.toLocaleString("fr-DZ")} DA`, name === "labor" ? "Main d'oeuvre" : name === "parts" ? "Pièces" : "Arrêts"]}
              />
              <Bar dataKey="labor" name="labor" fill="#0A6DFF" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="parts" name="parts" fill="#38BDF8" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="downtime" name="downtime" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </motion.div>

      {/* Cost totals */}
      {costs && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          data-testid="cost-totals"
        >
          {[
            { label: "Main d'oeuvre", value: costs.totalLaborCost, color: "#0A6DFF" },
            { label: "Pièces", value: costs.totalPartsCost, color: "#38BDF8" },
            { label: "Arrêts production", value: costs.totalDowntimeCost, color: "#EF4444" },
            { label: "Coût total", value: costs.totalCost, color: "#E6EDF3" },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-2 tracking-tight" style={{ color: item.color }}>
                {item.value.toLocaleString("fr-DZ")} <span className="text-sm font-normal text-muted-foreground">DA</span>
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
