import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  useGetTechnicians, useCreateTechnician, useUpdateTechnician, useDeleteTechnician,
  getGetTechniciansQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, AlertTriangle, Star, Briefcase, KeyRound, Eye, EyeOff,
  CheckCircle2, UserX, Users, TrendingUp, Award, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Phone, Mail, ChevronDown, ChevronUp, Upload, X, Camera
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useRBAC } from "@/context/RBACContext";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell
} from "recharts";

const easeOut = "easeOut" as const;

const STATUS_MAP: Record<string, { label: string; dot: string; color: string }> = {
  available: { label: "Disponible", dot: "bg-green-400", color: "#22C55E" },
  busy: { label: "Occupé", dot: "bg-yellow-400", color: "#F59E0B" },
  off: { label: "Absent", dot: "bg-slate-400", color: "#94A3B8" },
  leave: { label: "En congé", dot: "bg-blue-400", color: "#38BDF8" },
};

interface TechFormData {
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  skills?: string;
  status: "available" | "busy" | "off" | "leave";
  photoUrl?: string;
}

function TechAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-base" : "h-12 w-12 text-sm";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  if (photoUrl) {
    return (
      <div className={`${dims} rounded-2xl overflow-hidden border border-border/40 shrink-0`}>
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div className={`${dims} rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0`}>
      {initials}
    </div>
  );
}

interface PwDialogState {
  techName: string;
  techEmail: string;
  techRole?: string;
  techId?: number;
}

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className="h-3 w-3"
          strokeWidth={1.5}
          style={{
            fill: i < Math.round(rating) ? "#F59E0B" : "transparent",
            color: i < Math.round(rating) ? "#F59E0B" : "#475569",
          }}
        />
      ))}
    </div>
  );
}

function KpiCard({
  label, value, unit, icon: Icon, color, trend, subtitle
}: {
  label: string; value: string | number; unit?: string; icon: any;
  color: string; trend?: number; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/60 bg-background/50">
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
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
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ color }}>{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

export default function TechniciansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTech, setEditTech] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [pwDialog, setPwDialog] = useState<PwDialogState | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: rbacUser } = useRBAC();
  const { setPasswordForUser, allUsers, refreshUsers } = useAuth();
  const isAdmin = rbacUser.role === "admin";

  const { data: technicians, isLoading } = useGetTechnicians();
  const createTech = useCreateTechnician();
  const updateTech = useUpdateTechnician();
  const deleteTech = useDeleteTechnician();

  const form = useForm<TechFormData>({
    defaultValues: { name: "", email: "", specialization: "", status: "available" }
  });

  const openCreate = () => {
    setEditTech(null);
    form.reset({ name: "", email: "", specialization: "", status: "available" });
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditTech(t);
    form.reset({
      name: t.name, email: t.email, phone: t.phone, specialization: t.specialization,
      skills: t.skills?.join(", ") || "", status: t.status, photoUrl: t.photoUrl || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: TechFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetTechniciansQueryKey() });
    const body = {
      ...data,
      skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      photoUrl: data.photoUrl || undefined,
    };
    if (editTech) {
      updateTech.mutate({ id: editTech.id, data: body }, {
        onSuccess: () => { toast({ title: "Technicien mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    } else {
      createTech.mutate({ data: body }, {
        onSuccess: () => { toast({ title: "Technicien créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteTech.mutate({ id: deleteConfirm.id }, {
      onSuccess: () => {
        toast({ title: "Technicien supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetTechniciansQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const openPwDialog = (tech: any) => {
    setPwDialog({ techName: tech.name, techEmail: tech.email, techId: tech.id });
    setNewPw("");
    setConfirmPw("");
    setShowPw(false);
  };

  const handleSetPassword = () => {
    if (!pwDialog) return;
    if (newPw.length < 4) {
      toast({ title: "Mot de passe trop court", description: "Minimum 4 caractères.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    const result = setPasswordForUser(pwDialog.techEmail, newPw, {
      name: pwDialog.techName, role: "technicien",
      team: "Équipe maintenance", site: "Usine Centrale",
      technicianId: pwDialog.techId,
    });
    if (result.success) {
      toast({ title: "Mot de passe enregistré", description: `Compte de ${pwDialog.techName} mis à jour.` });
      setPwDialog(null);
      refreshUsers();
    } else {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
    }
  };

  const hasAccount = (email: string) => allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

  const techStats = useMemo(() => technicians ?? [], [technicians]);
  const totalTechs = techStats.length;
  const availableTechs = techStats.filter(t => t.status === "available").length;
  const busyTechs = techStats.filter(t => t.status === "busy").length;
  const totalActiveOTs = techStats.reduce((s, t) => s + (t.activeWorkOrders ?? 0), 0);
  const ratedTechs = techStats.filter(t => (t.avgRating ?? 0) > 0);
  const avgRating = ratedTechs.length > 0
    ? ratedTechs.reduce((s, t) => s + (t.avgRating ?? 0), 0) / ratedTechs.length
    : 0;
  const topTech = [...techStats].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))[0];
  const maxOTs = Math.max(...techStats.map(t => t.activeWorkOrders ?? 0), 1);

  const rankingData = [...techStats]
    .filter(t => (t.avgRating ?? 0) > 0)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 6)
    .map(t => ({
      name: t.name.split(" ")[0],
      note: t.avgRating ?? 0,
    }));

  const statusData = [
    { label: "Disponible", count: availableTechs, color: "#22C55E" },
    { label: "Occupé", count: busyTechs, color: "#F59E0B" },
    { label: "Absent/Congé", count: totalTechs - availableTechs - busyTechs, color: "#94A3B8" },
  ].filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Ressources humaines</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Personnel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Évaluation & charge de l'équipe de maintenance</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-full" data-testid="button-create-tech">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouveau technicien
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Effectif total" value={totalTechs} icon={Users} color="#0A6DFF" trend={0} subtitle="techniciens actifs" />
        <KpiCard label="Disponibles" value={availableTechs} unit={`/ ${totalTechs}`} icon={CheckCircle2} color="#22C55E" trend={2} subtitle="prêts à intervenir" />
        <KpiCard label="OT en charge" value={totalActiveOTs} icon={Activity} color="#F59E0B" trend={-5} subtitle="ordres de travail actifs" />
        <KpiCard label="Note moyenne" value={avgRating ? avgRating.toFixed(1) : "—"} unit={avgRating ? "/ 5" : ""} icon={Star} color="#F59E0B" trend={3} subtitle={`${ratedTechs.length} techniciens évalués`} />
      </div>

      {/* Analytics Row */}
      {techStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Performer + Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: easeOut }}
            className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-foreground">Classement par note d'évaluation</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Score moyen sur les OT complétés</p>
            {rankingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rankingData} layout="vertical" barSize={16} margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    cursor={{ fill: "#0A6DFF08" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
                          <div className="font-semibold text-foreground mb-1">{payload[0]?.payload?.name}</div>
                          <div className="text-muted-foreground">Note: <span className="text-foreground font-semibold">{Number(payload[0]?.value).toFixed(1)} / 5</span></div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="note" radius={[0, 4, 4, 0]}>
                    {rankingData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? "#F59E0B" : idx === 1 ? "#0A6DFF" : "#38BDF8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Aucune évaluation enregistrée</div>
            )}
          </motion.div>

          {/* Status Distribution + Top */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: easeOut }}
            className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-5"
          >
            {topTech && (topTech.avgRating ?? 0) > 0 && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-400" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Meilleur technicien</span>
                </div>
                <div className="flex items-center gap-3">
                  {(topTech as any).photoUrl ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-yellow-500/40 shrink-0">
                      <img src={(topTech as any).photoUrl} alt={topTech.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                      {topTech.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground text-sm">{topTech.name}</div>
                    <div className="text-xs text-muted-foreground">{topTech.specialization}</div>
                    <div className="mt-1"><StarDisplay rating={topTech.avgRating ?? 0} /></div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-yellow-400">{(topTech.avgRating ?? 0).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">/ 5</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Répartition des statuts</h3>
              <div className="space-y-2.5">
                {statusData.map(d => (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-semibold text-foreground">{d.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalTechs > 0 ? (d.count / totalTechs) * 100 : 0}%` }}
                        transition={{ duration: 0.7, ease: easeOut }}
                        style={{ background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Workload table */}
      {techStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ease: easeOut }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-foreground">Charge opérationnelle</h3>
            <span className="text-xs text-muted-foreground ml-1">— OT actifs par technicien</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Technicien</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Spécialisation</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Charge</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Note</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Statut</th>
              </tr>
            </thead>
            <tbody>
              {[...techStats].sort((a, b) => (b.activeWorkOrders ?? 0) - (a.activeWorkOrders ?? 0)).map((tech, idx) => {
                const status = STATUS_MAP[tech.status] || STATUS_MAP.off;
                const pct = maxOTs > 0 ? ((tech.activeWorkOrders ?? 0) / maxOTs) * 100 : 0;
                const barColor = pct > 75 ? "#EF4444" : pct > 40 ? "#F59E0B" : "#22C55E";
                return (
                  <motion.tr
                    key={tech.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <TechAvatar name={tech.name} photoUrl={(tech as any).photoUrl} size="sm" />
                        <span className="font-medium text-foreground text-sm">{tech.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{tech.specialization}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05, ease: easeOut }}
                            style={{ background: barColor }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground w-8 text-right">{tech.activeWorkOrders ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(tech.avgRating ?? 0) > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <StarDisplay rating={tech.avgRating ?? 0} />
                          <span className="text-xs text-muted-foreground">{(tech.avgRating ?? 0).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
                        <span className="text-xs text-muted-foreground">{status.label}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Tech Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-4">Fiches personnel</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians && technicians.length > 0 ? technicians.map((tech, idx) => {
              const status = STATUS_MAP[tech.status] || STATUS_MAP.off;
              const accountExists = hasAccount(tech.email);
              const isExpanded = expandedCard === tech.id;
              const pct = maxOTs > 0 ? ((tech.activeWorkOrders ?? 0) / maxOTs) * 100 : 0;
              const barColor = pct > 75 ? "#EF4444" : pct > 40 ? "#F59E0B" : "#22C55E";
              return (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border/60 rounded-3xl overflow-hidden hover:border-primary/30 transition-colors"
                  data-testid={`card-technician-${tech.id}`}
                >
                  <div className="p-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <TechAvatar name={tech.name} photoUrl={(tech as any).photoUrl} size="md" />
                        <div>
                          <div className="font-semibold text-foreground leading-tight">{tech.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{tech.specialization}</div>
                          {(tech.avgRating ?? 0) > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <StarDisplay rating={tech.avgRating ?? 0} />
                              <span className="text-xs text-muted-foreground">{(tech.avgRating ?? 0).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ background: status.color }} />
                          <span className="text-xs text-muted-foreground">{status.label}</span>
                        </div>
                        {isAdmin && accountExists && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {tech.skills && tech.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tech.skills.slice(0, 4).map((skill: string) => (
                          <span key={skill} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {skill}
                          </span>
                        ))}
                        {tech.skills.length > 4 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{tech.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Workload bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Charge de travail</span>
                        <span className="font-semibold text-foreground">{tech.activeWorkOrders ?? 0} OT actifs</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 + 0.2, ease: easeOut }}
                          style={{ background: barColor }}
                        />
                      </div>
                    </div>

                    {/* Expandable contact info */}
                    <button
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1"
                      onClick={() => setExpandedCard(isExpanded ? null : tech.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Moins de détails" : "Plus de détails"}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 border-t border-border/30 pt-3"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                          <span>{tech.email}</span>
                        </div>
                        {tech.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                            <span>{tech.phone}</span>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-1 pt-1">
                            {accountExists ? (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle2 className="h-3 w-3" /> Compte actif
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                <UserX className="h-3 w-3" /> Sans compte
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center gap-1 px-4 py-3 bg-muted/20 border-t border-border/30">
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openPwDialog(tech)} title="Compte utilisateur">
                        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(tech)} data-testid={`button-edit-tech-${tech.id}`}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(tech)} data-testid={`button-delete-tech-${tech.id}`}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {tech.email}
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">Aucun technicien trouvé</div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editTech ? "Modifier le technicien" : "Nouveau technicien"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl><Input data-testid="input-tech-name" placeholder="Ex: Karim Boudaoud" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" data-testid="input-tech-email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl><Input data-testid="input-tech-phone" placeholder="+213..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="specialization" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialisation</FormLabel>
                    <FormControl><Input data-testid="input-tech-specialization" placeholder="Ex: Mécanique industrielle" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-tech-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="busy">Occupé</SelectItem>
                        <SelectItem value="off">Absent</SelectItem>
                        <SelectItem value="leave">En congé</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Compétences (séparées par des virgules)</FormLabel>
                    <FormControl><Input data-testid="input-tech-skills" placeholder="Ex: Hydraulique, Pneumatique, Soudure" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="photoUrl" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      Photo du technicien
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {field.value ? (
                            <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-border/40 shrink-0">
                              <img src={field.value} alt="preview" className="h-full w-full object-cover" />
                              <button type="button" onClick={() => field.onChange("")} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" strokeWidth={2} />
                              </button>
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/50 shrink-0">
                              <Camera className="h-5 w-5" strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="tech-photo-upload"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = ev => field.onChange(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }}
                            />
                            <label htmlFor="tech-photo-upload">
                              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-8 cursor-pointer w-full" asChild>
                                <span><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />Choisir une photo</span>
                              </Button>
                            </label>
                            <p className="text-[11px] text-muted-foreground">JPG, PNG · La photo sera stockée avec le profil</p>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createTech.isPending || updateTech.isPending} data-testid="button-submit-tech">
                  {editTech ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Password dialog */}
      <Dialog open={!!pwDialog} onOpenChange={() => setPwDialog(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Compte utilisateur
            </DialogTitle>
          </DialogHeader>
          {pwDialog && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground mb-0.5">Profil</div>
                <div className="font-medium text-foreground">{pwDialog.techName}</div>
                <div className="text-sm text-muted-foreground">{pwDialog.techEmail}</div>
                {hasAccount(pwDialog.techEmail) ? (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Compte existant — modification du mot de passe
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                    <KeyRound className="h-3.5 w-3.5" />
                    Création d'un nouveau compte
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="Minimum 4 caractères" value={newPw} onChange={e => setNewPw(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                  <Input type="password" placeholder="Répéter le mot de passe" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  {confirmPw && newPw !== confirmPw && <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialog(null)}>Annuler</Button>
            <Button onClick={handleSetPassword} disabled={!newPw || newPw !== confirmPw} className="gap-2">
              <KeyRound className="h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer le technicien
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteTech.isPending} data-testid="button-confirm-delete-tech">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
