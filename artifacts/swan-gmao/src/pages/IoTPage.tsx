import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, WifiOff, Plus, Trash2, Pencil, Play, Pause, RefreshCw,
  Activity, AlertTriangle, Zap, Settings2, Database, ChevronRight,
  Cpu, Signal, Radio, Globe, Server, Layers, X, Check, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const API = "/api";

type Protocol = "mqtt" | "modbus_tcp" | "modbus_rtu" | "opc_ua" | "rest" | "lorawan" | "custom";
type DeviceStatus = "online" | "offline" | "error";
type RuleAction = "alert" | "create_wo" | "alert_and_wo";
type RuleCondition = "above" | "below";

interface IoTDevice {
  id: number;
  name: string;
  deviceId: string;
  protocol: Protocol;
  assetId: number | null;
  assetName: string | null;
  status: DeviceStatus;
  ipAddress: string | null;
  port: number | null;
  mqttTopic: string | null;
  modbusSlaveId: number | null;
  opcuaNodeId: string | null;
  webhookUrl: string | null;
  description: string | null;
  firmwareVersion: string | null;
  lastSeen: string | null;
  createdAt: string;
  lastMetric: { metric: string; value: number; unit: string | null; ts: string } | null;
}

interface IoTRule {
  id: number;
  deviceId: number;
  name: string;
  metric: string;
  condition: RuleCondition;
  threshold: number;
  unit: string | null;
  durationMinutes: number;
  action: RuleAction;
  actionCreateWoPriority: string | null;
  enabled: boolean;
  lastFiredAt: string | null;
  createdAt: string;
}

interface IoTEvent {
  id: number;
  deviceId: number;
  metric: string;
  value: number;
  unit: string | null;
  quality: string;
  thresholdStatus: string;
  ts: string;
}

interface IoTStats {
  totalDevices: number;
  online: number;
  offline: number;
  totalRules: number;
  activeRules: number;
  recentAlerts: number;
  eventsByMetric: Record<string, number>;
}

const PROTOCOLS: { value: Protocol; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "mqtt",       label: "MQTT",       icon: <Radio className="h-4 w-4" />,   desc: "Capteurs IoT modernes, topics hiérarchiques" },
  { value: "modbus_tcp", label: "Modbus TCP", icon: <Cpu className="h-4 w-4" />,    desc: "Automates PLC via Ethernet" },
  { value: "modbus_rtu", label: "Modbus RTU", icon: <Cpu className="h-4 w-4" />,    desc: "Automates PLC via RS485" },
  { value: "opc_ua",     label: "OPC-UA",     icon: <Layers className="h-4 w-4" />, desc: "SCADA, HMI, systèmes haute précision" },
  { value: "rest",       label: "REST",       icon: <Globe className="h-4 w-4" />,   desc: "HTTP push/pull, cloud IoT" },
  { value: "lorawan",    label: "LoRaWAN",    icon: <Signal className="h-4 w-4" />,  desc: "Longue portée, faible consommation" },
  { value: "custom",     label: "Custom",     icon: <Server className="h-4 w-4" />,  desc: "Driver JS personnalisé" },
];

const METRICS = ["temperature", "vibration", "pressure", "current", "hours_run", "rpm", "humidity", "custom"];
const METRIC_UNITS: Record<string, string[]> = {
  temperature: ["°C", "°F", "K"],
  vibration:   ["mm/s", "g"],
  pressure:    ["bar", "PSI", "kPa"],
  current:     ["A", "mA"],
  hours_run:   ["h"],
  rpm:         ["rpm"],
  humidity:    ["%"],
  custom:      [""],
};

const THRESHOLD_TIPS: Record<string, string> = {
  temperature: "ISO 13273 : >85°C critique pour moteurs électriques",
  vibration:   "ISO 10816 : >4.5 mm/s avertissement, >7.1 mm/s critique",
  pressure:    "Dépend des specs équipement",
  current:     "Alerte si déviation > 15% de la baseline",
  hours_run:   "Déclenchement préventif à X heures",
  rpm:         "Alerte sur surrégime ou sous-vitesse",
  humidity:    ">70% critique pour armoires électriques",
  custom:      "",
};

function StatusDot({ status }: { status: DeviceStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "online" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === "online" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-zinc-500"}`} />
    </span>
  );
}

function ProtocolBadge({ protocol }: { protocol: Protocol }) {
  const colors: Record<Protocol, string> = {
    mqtt:       "bg-orange-500/15 text-orange-400 border-orange-500/20",
    modbus_tcp: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    modbus_rtu: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    opc_ua:     "bg-purple-500/15 text-purple-400 border-purple-500/20",
    rest:       "bg-teal-500/15 text-teal-400 border-teal-500/20",
    lorawan:    "bg-green-500/15 text-green-400 border-green-500/20",
    custom:     "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[protocol] || colors.custom}`}>
      {protocol.toUpperCase().replace("_", " ")}
    </span>
  );
}

function ThresholdStatusBadge({ status }: { status: string }) {
  if (status === "normal") return <span className="text-[10px] text-emerald-400 font-medium">Normal</span>;
  if (status === "warning") return <span className="text-[10px] text-amber-400 font-medium">⚠ Alerte</span>;
  return <span className="text-[10px] text-red-400 font-medium">✕ Critique</span>;
}

export default function IoTPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"devices" | "rules" | "events" | "twin">("devices");
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editDevice, setEditDevice] = useState<IoTDevice | null>(null);
  const [twinDeviceId, setTwinDeviceId] = useState<number | null>(null);

  const { data: devices = [], isLoading: devicesLoading } = useQuery<IoTDevice[]>({
    queryKey: ["/api/iot/devices"],
    queryFn: () => fetch(`${API}/iot/devices`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: rules = [] } = useQuery<IoTRule[]>({
    queryKey: ["/api/iot/rules"],
    queryFn: () => fetch(`${API}/iot/rules`).then(r => r.json()),
  });

  const { data: events = [] } = useQuery<IoTEvent[]>({
    queryKey: ["/api/iot/events"],
    queryFn: () => fetch(`${API}/iot/events?limit=100`).then(r => r.json()),
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery<IoTStats>({
    queryKey: ["/api/iot/stats"],
    queryFn: () => fetch(`${API}/iot/stats`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: twin } = useQuery({
    queryKey: ["/api/iot/twin", twinDeviceId],
    queryFn: () => twinDeviceId ? fetch(`${API}/iot/devices/${twinDeviceId}/twin`).then(r => r.json()) : null,
    enabled: !!twinDeviceId,
    refetchInterval: 5000,
  });

  const deleteDevice = useMutation({
    mutationFn: (id: number) => fetch(`${API}/iot/devices/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iot/devices"] }); toast({ title: "Appareil supprimé" }); },
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      fetch(`${API}/iot/rules/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iot/rules"] }),
  });

  const deleteRule = useMutation({
    mutationFn: (id: number) => fetch(`${API}/iot/rules/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iot/rules"] }); toast({ title: "Règle supprimée" }); },
  });

  const TABS = [
    { key: "devices", label: "Appareils",  icon: <Wifi className="h-4 w-4" /> },
    { key: "rules",   label: "Règles",     icon: <Zap className="h-4 w-4" /> },
    { key: "events",  label: "Événements", icon: <Activity className="h-4 w-4" /> },
    { key: "twin",    label: "Device Twin", icon: <Database className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Intégration</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">IoT & Capteurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Connectez et supervisez vos capteurs industriels en temps réel</p>
        </div>
        <Button
          onClick={() => { setEditDevice(null); setShowDeviceForm(true); }}
          className="rounded-full gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Ajouter un appareil
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Appareils",       value: stats?.totalDevices ?? "—", icon: <Wifi className="h-4 w-4" />,           color: "text-primary" },
          { label: "En ligne",        value: stats?.online ?? "—",       icon: <Signal className="h-4 w-4" />,          color: "text-emerald-400" },
          { label: "Hors ligne",      value: stats?.offline ?? "—",      icon: <WifiOff className="h-4 w-4" />,         color: "text-zinc-400" },
          { label: "Règles actives",  value: stats?.activeRules ?? "—",  icon: <Zap className="h-4 w-4" />,             color: "text-amber-400" },
          { label: "Alertes récentes",value: stats?.recentAlerts ?? "—", icon: <AlertTriangle className="h-4 w-4" />,   color: "text-red-400" },
          { label: "Protocoles",      value: [...new Set(devices.map(d => d.protocol))].length, icon: <Layers className="h-4 w-4" />, color: "text-purple-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-card border border-border/40 p-4">
            <div className={`${k.color} mb-2`}>{k.icon}</div>
            <div className="text-xl font-bold text-foreground">{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card/60 border border-border/40 rounded-2xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── DEVICES TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "devices" && (
        <div className="space-y-3">
          {devicesLoading && (
            <div className="text-center py-16 text-muted-foreground">Chargement…</div>
          )}
          {!devicesLoading && devices.length === 0 && (
            <div className="text-center py-20 rounded-3xl border border-border/40 bg-card/40">
              <Wifi className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun appareil connecté</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Ajoutez votre premier capteur pour commencer</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices.map(device => (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-card border border-border/40 p-5 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusDot status={device.status as DeviceStatus} />
                    <div>
                      <div className="font-semibold text-foreground text-sm leading-tight">{device.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{device.deviceId}</div>
                    </div>
                  </div>
                  <ProtocolBadge protocol={device.protocol as Protocol} />
                </div>

                {device.assetName && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3 bg-muted/20 rounded-lg px-2.5 py-1.5">
                    <Cpu className="h-3 w-3" />
                    <span>{device.assetName}</span>
                  </div>
                )}

                {device.lastMetric && (
                  <div className="bg-background/40 rounded-xl p-3 mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Dernière mesure</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-foreground">{device.lastMetric.value.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">{device.lastMetric.unit}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {device.lastMetric.metric} · {new Date(device.lastMetric.ts).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </div>
                  </div>
                )}

                {device.lastSeen && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    Vu le {new Date(device.lastSeen).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 h-8 text-xs rounded-xl"
                    onClick={() => { setTwinDeviceId(device.id); setActiveTab("twin"); }}
                  >
                    <Database className="h-3 w-3 mr-1" /> Twin
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 w-8 p-0 rounded-xl"
                    onClick={() => { setEditDevice(device); setShowDeviceForm(true); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 w-8 p-0 rounded-xl text-red-400 hover:text-red-300"
                    onClick={() => deleteDevice.mutate(device.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── RULES TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{rules.length} règle{rules.length !== 1 ? "s" : ""} configurée{rules.length !== 1 ? "s" : ""}</p>
            <Button onClick={() => setShowRuleForm(true)} className="rounded-full gap-2 bg-primary hover:bg-primary/90" size="sm">
              <Plus className="h-4 w-4" /> Nouvelle règle
            </Button>
          </div>

          {rules.length === 0 && (
            <div className="text-center py-20 rounded-3xl border border-border/40 bg-card/40">
              <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune règle définie</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Créez des règles no-code pour déclencher des alertes ou des OT automatiquement</p>
            </div>
          )}

          <div className="space-y-3">
            {rules.map(rule => {
              const device = devices.find(d => d.id === rule.deviceId);
              const actionColors: Record<RuleAction, string> = {
                alert:        "bg-amber-500/15 text-amber-400",
                create_wo:    "bg-blue-500/15 text-blue-400",
                alert_and_wo: "bg-red-500/15 text-red-400",
              };
              const actionLabels: Record<RuleAction, string> = {
                alert:        "Alerte uniquement",
                create_wo:    "Créer un OT",
                alert_and_wo: "Alerte + OT",
              };
              return (
                <motion.div key={rule.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card border border-border/40 p-4 flex items-center gap-4"
                >
                  <div className={`w-1 self-stretch rounded-full ${rule.enabled ? "bg-emerald-500" : "bg-zinc-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{rule.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${actionColors[rule.action as RuleAction]}`}>
                        {actionLabels[rule.action as RuleAction]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{device?.name ?? `Device #${rule.deviceId}`}</span>
                      {" · "}
                      Si <strong className="text-foreground">{rule.metric}</strong>{" "}
                      {rule.condition === "above" ? ">" : "<"}{" "}
                      <strong className="text-foreground">{rule.threshold} {rule.unit}</strong>
                      {rule.durationMinutes > 0 && <span> pendant {rule.durationMinutes} min</span>}
                    </div>
                    {rule.lastFiredAt && (
                      <div className="text-[11px] text-amber-400 mt-1">
                        Dernière activation : {new Date(rule.lastFiredAt).toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm" variant="outline"
                      className={`h-8 w-8 p-0 rounded-xl ${rule.enabled ? "text-emerald-400" : "text-zinc-500"}`}
                      onClick={() => toggleRule.mutate({ id: rule.id, enabled: !rule.enabled })}
                    >
                      {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="h-8 w-8 p-0 rounded-xl text-red-400"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EVENTS TAB ───────────────────────────────────────────────────────── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{events.length} événements récents</p>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
              onClick={() => qc.invalidateQueries({ queryKey: ["/api/iot/events"] })}
            >
              <RefreshCw className="h-3 w-3" /> Actualiser
            </Button>
          </div>

          {events.length === 0 && (
            <div className="text-center py-20 rounded-3xl border border-border/40 bg-card/40">
              <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun événement reçu</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Les mesures remontées par vos capteurs apparaîtront ici</p>
            </div>
          )}

          <div className="rounded-3xl border border-border/40 overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-background/40">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Horodatage</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Appareil</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Métrique</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Valeur</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Qualité</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const dev = devices.find(d => d.id === e.deviceId);
                  return (
                    <tr key={e.id} className={`border-b border-border/20 hover:bg-muted/10 transition-colors ${e.thresholdStatus !== "normal" ? "bg-amber-500/5" : ""}`}>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                        {new Date(e.ts).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium">{dev?.name ?? `#${e.deviceId}`}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{e.metric}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-foreground">
                        {e.value.toFixed(3)} <span className="text-muted-foreground font-normal">{e.unit}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-[10px] text-emerald-400">{e.quality}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <ThresholdStatusBadge status={e.thresholdStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DEVICE TWIN TAB ──────────────────────────────────────────────────── */}
      {activeTab === "twin" && (
        <div className="space-y-4">
          {/* Device selector */}
          <div className="flex items-center gap-3">
            <Select
              value={twinDeviceId?.toString() ?? ""}
              onValueChange={v => setTwinDeviceId(Number(v))}
            >
              <SelectTrigger className="w-64 rounded-xl border-border/40">
                <SelectValue placeholder="Sélectionner un appareil" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    <span className="flex items-center gap-2">
                      <StatusDot status={d.status as DeviceStatus} /> {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {twin && (
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
                onClick={() => qc.invalidateQueries({ queryKey: ["/api/iot/twin", twinDeviceId] })}
              >
                <RefreshCw className="h-3 w-3" /> Rafraîchir
              </Button>
            )}
          </div>

          {!twinDeviceId && (
            <div className="text-center py-20 rounded-3xl border border-border/40 bg-card/40">
              <Database className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Sélectionnez un appareil pour voir son Device Twin</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Dernier état connu de chaque métrique + historique</p>
            </div>
          )}

          {twin && twinDeviceId && (
            <div className="space-y-4">
              {/* Device info */}
              <div className="rounded-2xl bg-card border border-border/40 p-4 flex items-center gap-4">
                <StatusDot status={twin.device.status as DeviceStatus} />
                <div>
                  <div className="font-semibold text-foreground">{twin.device.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{twin.device.deviceId}</div>
                </div>
                <ProtocolBadge protocol={twin.device.protocol} />
                {twin.device.lastSeen && (
                  <div className="ml-auto text-xs text-muted-foreground">
                    Vu le {new Date(twin.device.lastSeen).toLocaleString("fr-FR")}
                  </div>
                )}
              </div>

              {/* Metrics grid */}
              {Object.keys(twin.metrics).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Aucune mesure reçue pour cet appareil</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(twin.metrics as Record<string, { value: number; unit: string | null; ts: string; thresholdStatus: string }>).map(([metric, data]) => {
                  const hist = (twin.history as Record<string, { value: number; ts: string }[]>)[metric] || [];
                  return (
                    <div key={metric} className="rounded-2xl bg-card border border-border/40 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{metric}</span>
                        <ThresholdStatusBadge status={data.thresholdStatus} />
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-3xl font-bold text-foreground">{data.value.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">{data.unit}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-3">
                        Mis à jour {new Date(data.ts).toLocaleString("fr-FR", { timeStyle: "short", dateStyle: "short" })}
                      </div>
                      {hist.length > 1 && (
                        <ResponsiveContainer width="100%" height={60}>
                          <AreaChart data={hist}>
                            <defs>
                              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0A6DFF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0A6DFF" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke="#0A6DFF" strokeWidth={1.5} fill={`url(#grad-${metric})`} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEVICE FORM DIALOG ───────────────────────────────────────────────── */}
      <DeviceFormDialog
        key={showDeviceForm ? `form-${editDevice?.id ?? 'new'}` : 'closed'}
        open={showDeviceForm}
        onClose={() => setShowDeviceForm(false)}
        initial={editDevice}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["/api/iot/devices"] }); setShowDeviceForm(false); }}
      />

      {/* ── RULE FORM DIALOG ─────────────────────────────────────────────────── */}
      <RuleFormDialog
        open={showRuleForm}
        onClose={() => setShowRuleForm(false)}
        devices={devices}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["/api/iot/rules"] }); setShowRuleForm(false); }}
      />
    </div>
  );
}

// ── Device Form ───────────────────────────────────────────────────────────────

function DeviceFormDialog({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial: IoTDevice | null; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", deviceId: "", protocol: "" as Protocol | "",
    assetId: "", ipAddress: "", port: "", mqttTopic: "",
    modbusSlaveId: "", opcuaNodeId: "", webhookUrl: "", description: "",
  });

  const resetForm = () => {
    setStep(0);
    if (initial) {
      setForm({
        name: initial.name, deviceId: initial.deviceId, protocol: initial.protocol,
        assetId: initial.assetId?.toString() ?? "", ipAddress: initial.ipAddress ?? "",
        port: initial.port?.toString() ?? "", mqttTopic: initial.mqttTopic ?? "",
        modbusSlaveId: initial.modbusSlaveId?.toString() ?? "", opcuaNodeId: initial.opcuaNodeId ?? "",
        webhookUrl: initial.webhookUrl ?? "", description: initial.description ?? "",
      });
    } else {
      setForm({ name: "", deviceId: "", protocol: "", assetId: "", ipAddress: "", port: "", mqttTopic: "", modbusSlaveId: "", opcuaNodeId: "", webhookUrl: "", description: "" });
    }
  };

  const save = async () => {
    const method = initial ? "PUT" : "POST";
    const url = initial ? `${API}/iot/devices/${initial.id}` : `${API}/iot/devices`;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast({ title: initial ? "Appareil mis à jour" : "Appareil créé" }); onSaved(); }
    else { const d = await res.json(); toast({ title: "Erreur", description: d.error, variant: "destructive" }); }
  };

  const isEdit = !!initial;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); else resetForm(); }}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'appareil" : "Ajouter un appareil IoT"}</DialogTitle>
        </DialogHeader>

        {/* Step indicator (new only) */}
        {!isEdit && (
          <div className="flex gap-2 items-center mb-2">
            {["Protocole", "Connexion", "Identité"].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                  i < step ? "bg-emerald-500 text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={`text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {/* STEP 0 — Protocol selection */}
          {(step === 0 || isEdit) && !isEdit && (
            <div className="grid grid-cols-2 gap-2">
              {PROTOCOLS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setForm(f => ({ ...f, protocol: p.value })); setStep(1); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    form.protocol === p.value ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"
                  }`}
                >
                  <span className="text-primary">{p.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 — Connection */}
          {(step === 1 || isEdit) && (
            <div className="space-y-3">
              {isEdit && (
                <div>
                  <Label>Protocole</Label>
                  <Select value={form.protocol} onValueChange={v => setForm(f => ({ ...f, protocol: v as Protocol }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROTOCOLS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {(form.protocol === "mqtt") && (
                <div>
                  <Label>Topic MQTT</Label>
                  <Input className="rounded-xl" placeholder="site/zone/equipement/mesure" value={form.mqttTopic} onChange={e => setForm(f => ({ ...f, mqttTopic: e.target.value }))} />
                </div>
              )}
              {(form.protocol === "modbus_tcp" || form.protocol === "opc_ua" || form.protocol === "rest") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Adresse IP</Label>
                    <Input className="rounded-xl" placeholder="192.168.1.100" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input className="rounded-xl" placeholder="502" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} />
                  </div>
                </div>
              )}
              {form.protocol === "modbus_tcp" && (
                <div>
                  <Label>Slave ID Modbus</Label>
                  <Input className="rounded-xl" placeholder="1" value={form.modbusSlaveId} onChange={e => setForm(f => ({ ...f, modbusSlaveId: e.target.value }))} />
                </div>
              )}
              {form.protocol === "opc_ua" && (
                <div>
                  <Label>Node ID OPC-UA</Label>
                  <Input className="rounded-xl" placeholder="ns=2;i=1001" value={form.opcuaNodeId} onChange={e => setForm(f => ({ ...f, opcuaNodeId: e.target.value }))} />
                </div>
              )}
              {form.protocol === "rest" && (
                <div>
                  <Label>Webhook URL</Label>
                  <Input className="rounded-xl" placeholder="https://api.device.com/data" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
                </div>
              )}
              {form.protocol === "lorawan" && (
                <>
                  <div>
                    <Label>Serveur ChirpStack / TTN</Label>
                    <Input className="rounded-xl" placeholder="https://chirpstack.example.com" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
                  </div>
                  <div>
                    <Label>App ID LoRaWAN</Label>
                    <Input className="rounded-xl" placeholder="my-lorawan-app" value={form.mqttTopic} onChange={e => setForm(f => ({ ...f, mqttTopic: e.target.value }))} />
                  </div>
                </>
              )}
              {form.protocol === "modbus_rtu" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Port série (COM / tty)</Label>
                      <Input className="rounded-xl" placeholder="/dev/ttyUSB0 ou COM3" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Baud rate</Label>
                      <Input className="rounded-xl" type="number" placeholder="9600" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Slave ID Modbus</Label>
                    <Input className="rounded-xl" placeholder="1" value={form.modbusSlaveId} onChange={e => setForm(f => ({ ...f, modbusSlaveId: e.target.value }))} />
                  </div>
                </>
              )}
              {form.protocol === "mqtt" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>IP Broker <span className="text-muted-foreground text-[10px]">(optionnel)</span></Label>
                    <Input className="rounded-xl" placeholder="192.168.1.10" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Port broker</Label>
                    <Input className="rounded-xl" type="number" placeholder="1883" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} />
                  </div>
                </div>
              )}
              {!isEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(0)}>
                    ← Retour
                  </Button>
                  <Button className="flex-1 rounded-xl" onClick={() => setStep(2)}>
                    Suivant <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Identity */}
          {(step === 2 || isEdit) && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nom de l'appareil *</Label>
                  <Input className="rounded-xl" placeholder="Capteur temp. A1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Identifiant unique *</Label>
                  <Input className="rounded-xl" placeholder="sensor-001" value={form.deviceId} onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input className="rounded-xl" placeholder="Capteur de température moteur principal" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {!isEdit && (
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep(1)}>
                  ← Retour
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={!form.name || !form.deviceId || !form.protocol}
                  onClick={save}
                >
                  {isEdit ? "Enregistrer" : "Créer l'appareil"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Rule Form ─────────────────────────────────────────────────────────────────

function RuleFormDialog({ open, onClose, devices, onSaved }: {
  open: boolean; onClose: () => void; devices: IoTDevice[]; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    deviceId: "", name: "", metric: "temperature", condition: "above" as RuleCondition,
    threshold: "", unit: "°C", durationMinutes: "0",
    action: "alert" as RuleAction, actionCreateWoPriority: "high",
  });

  const save = async () => {
    const res = await fetch(`${API}/iot/rules`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, threshold: Number(form.threshold), durationMinutes: Number(form.durationMinutes) }),
    });
    if (res.ok) { toast({ title: "Règle créée" }); onSaved(); }
    else { const d = await res.json(); toast({ title: "Erreur", description: d.error, variant: "destructive" }); }
  };

  const unitOptions = METRIC_UNITS[form.metric] || [""];
  const tip = THRESHOLD_TIPS[form.metric];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60">
        <DialogHeader><DialogTitle>Nouvelle règle no-code</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Appareil *</Label>
            <Select value={form.deviceId} onValueChange={v => setForm(f => ({ ...f, deviceId: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nom de la règle *</Label>
            <Input className="rounded-xl" placeholder="Surchauffe moteur principal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Métrique *</Label>
              <Select value={form.metric} onValueChange={v => { setForm(f => ({ ...f, metric: v, unit: METRIC_UNITS[v]?.[0] ?? "" })); }}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{METRICS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v as RuleCondition }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">au-dessus de</SelectItem>
                  <SelectItem value="below">en-dessous de</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unité</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u || "—"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Seuil *</Label>
              <Input className="rounded-xl" type="number" placeholder="85" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
            </div>
            <div>
              <Label>Durée avant déclenchement (min)</Label>
              <Input className="rounded-xl" type="number" placeholder="0" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
          </div>

          {tip && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
              💡 <strong>Recommandation :</strong> {tip}
            </div>
          )}

          <div>
            <Label>Action à déclencher *</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {(["alert", "create_wo", "alert_and_wo"] as RuleAction[]).map(a => {
                const labels: Record<RuleAction, string> = { alert: "Alerte", create_wo: "Créer OT", alert_and_wo: "Alerte + OT" };
                return (
                  <button key={a} onClick={() => setForm(f => ({ ...f, action: a }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      form.action === a ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"
                    }`}
                  >{labels[a]}</button>
                );
              })}
            </div>
          </div>

          {(form.action === "create_wo" || form.action === "alert_and_wo") && (
            <div>
              <Label>Priorité de l'OT créé</Label>
              <Select value={form.actionCreateWoPriority} onValueChange={v => setForm(f => ({ ...f, actionCreateWoPriority: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            className="w-full rounded-xl bg-primary hover:bg-primary/90"
            disabled={!form.deviceId || !form.name || !form.threshold}
            onClick={save}
          >
            Créer la règle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
