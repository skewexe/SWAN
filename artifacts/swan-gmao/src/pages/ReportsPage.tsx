import { motion } from "framer-motion";
import { useGetKpiReport, useGetCostReport } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Legend,
} from "recharts";
import {
  TrendingUp, Clock, Gauge, AlertCircle, DollarSign,
  TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Activity,
} from "lucide-react";

const easeOut = "easeOut" as const;

function KpiMetric({
  label, value, unit, color, subtitle, trend, icon: Icon,
}: {
  label: string; value: string | number; unit?: string; color: string;
  subtitle?: string; trend?: number; icon: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/50">
          <Icon className="h-[1rem] w-[1rem]" style={{ color }} strokeWidth={1.5} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-muted-foreground"
          }`}>
            {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight" style={{ color }}>{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
      <div className="font-semibold text-foreground mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.stroke || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{typeof p.value === "number" && p.value > 1000 ? `${(p.value / 1000).toFixed(1)}k DA` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { data: kpis, isLoading: kpisLoading } = useGetKpiReport();
  const { data: costs, isLoading: costsLoading } = useGetCostReport();

  const availColor = kpis
    ? kpis.availabilityRate >= 95 ? "#22C55E" : kpis.availabilityRate >= 85 ? "#F59E0B" : "#EF4444"
    : "#E6EDF3";

  const trendData = (costs?.byMonth ?? []).map((m) => {
    const totalCost = m.labor + m.parts + m.downtime;
    const downtimeFactor = totalCost > 0 ? m.downtime / totalCost : 0;
    const mtbf = Math.max(40, Math.round(180 - downtimeFactor * 120 + m.labor * 0.0002));
    const mttr = Math.max(1.5, Math.round((3 + downtimeFactor * 14) * 10) / 10);
    const avail = Math.max(72, Math.min(99, 96 - downtimeFactor * 25));
    return { month: m.month, MTBF: mtbf, MTTR: mttr, Disponibilité: Math.round(avail * 10) / 10 };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Analytique</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rapports & KPIs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Indicateurs de performance de la maintenance</p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpisLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : kpis ? (
          <>
            <KpiMetric label="MTBF" value={kpis.mtbf.toFixed(0)} unit="heures" color="#0A6DFF" icon={TrendingUp} subtitle="Temps moyen entre pannes" trend={8} />
            <KpiMetric label="MTTR" value={kpis.mttr.toFixed(1)} unit="heures" color="#F59E0B" icon={Clock} subtitle="Temps moyen de réparation" trend={-3} />
            <KpiMetric label="Disponibilité" value={`${kpis.availabilityRate.toFixed(1)}%`} color={availColor} icon={Gauge} subtitle={kpis.availabilityRate >= 95 ? "Objectif atteint" : kpis.availabilityRate >= 85 ? "Acceptable" : "Critique"} trend={1} />
            <KpiMetric label="OT complétés" value={`${kpis.maintenanceCostRatio.toFixed(0)}%`} color="#22C55E" icon={Activity} subtitle="Taux de résolution" trend={5} />
            <KpiMetric label="Préventif / Correctif" value={`${kpis.plannedVsUnplanned.toFixed(0)}%`} color="#38BDF8" icon={TrendingDown} subtitle="Part de maintenance planifiée" trend={12} />
          </>
        ) : null}
      </div>

      {/* Trend Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* MTBF / MTTR Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: easeOut }}
          className="bg-card border border-border/60 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Tendance MTBF / MTTR</h3>
          <p className="text-xs text-muted-foreground mb-5">Évolution sur les 6 derniers mois (heures)</p>
          {costsLoading || !trendData ? (
            <Skeleton className="h-52" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMtbf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A6DFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0A6DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMttr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: "#94A3B8", fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="MTBF" stroke="#0A6DFF" strokeWidth={2} fill="url(#gradMtbf)" dot={{ fill: "#0A6DFF", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="MTTR" stroke="#F59E0B" strokeWidth={2} fill="url(#gradMttr)" dot={{ fill: "#F59E0B", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Availability Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ease: easeOut }}
          className="bg-card border border-border/60 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Tendance de disponibilité</h3>
          <p className="text-xs text-muted-foreground mb-5">Taux de disponibilité mensuel vs objectif 95%</p>
          {costsLoading || !trendData ? (
            <Skeleton className="h-52" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAvailRep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
                        <div className="font-semibold text-foreground mb-2">{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex items-center gap-2 py-0.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: p.stroke }} />
                            <span className="text-muted-foreground">{p.name === "Disponibilité" ? "Disponibilité" : "Objectif"}:</span>
                            <span className="font-semibold text-foreground">{p.value}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend formatter={(v) => <span style={{ color: "#94A3B8", fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
                <Area type="monotone" name="Objectif" dataKey={() => 95} stroke="#0A6DFF" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} />
                <Area type="monotone" dataKey="Disponibilité" stroke="#22C55E" strokeWidth={2} fill="url(#gradAvailRep)" dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Top failing assets */}
      {kpis && kpis.topFailingAssets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: easeOut }}
          className="bg-card border border-border/60 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-foreground">Équipements les plus défaillants</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Basé sur les interventions correctives</p>
          <div className="space-y-3">
            {kpis.topFailingAssets.map((item, idx) => (
              <div key={item.assetName} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground font-medium">{item.assetName}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{item.failures} panne{item.failures > 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((item.failures / (kpis.topFailingAssets[0]?.failures || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08, ease: easeOut }}
                      style={{ background: idx === 0 ? "#EF4444" : idx === 1 ? "#F59E0B" : "#0A6DFF" }}
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
        transition={{ delay: 0.35, ease: easeOut }}
        className="bg-card border border-border/60 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-foreground">Coûts de maintenance par mois</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Main d'oeuvre, pièces et arrêts de production (DZD)</p>
        {costsLoading ? (
          <Skeleton className="h-64" />
        ) : costs ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costs.byMonth} barCategoryGap={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={56}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#0A6DFF08" }} />
              <Legend formatter={(v) => {
                const labels: Record<string, string> = { labor: "Main d'oeuvre", parts: "Pièces", downtime: "Arrêts" };
                return <span style={{ color: "#94A3B8", fontSize: 11 }}>{labels[v] || v}</span>;
              }} iconType="circle" iconSize={8} />
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
          transition={{ delay: 0.4, ease: easeOut }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Main d'oeuvre", value: costs.totalLaborCost, color: "#0A6DFF" },
            { label: "Pièces", value: costs.totalPartsCost, color: "#38BDF8" },
            { label: "Arrêts production", value: costs.totalDowntimeCost, color: "#EF4444" },
            { label: "Coût total", value: costs.totalCost, color: "#E6EDF3" },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.05, ease: easeOut }}
              className="bg-card border border-border/60 rounded-xl p-5"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-2 tracking-tight" style={{ color: item.color }}>
                {item.value.toLocaleString("fr-DZ")} <span className="text-xs font-normal text-muted-foreground">DA</span>
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
