import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, Star, Phone, Mail,
  MapPin, FileText, AlertTriangle, CheckCircle, XCircle, Building2,
  Briefcase, Calendar, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRBAC } from "@/context/RBACContext";

interface Subcontractor {
  id: number;
  name: string;
  specialty: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  rating?: number;
  status: "active" | "inactive" | "suspended";
  contractStart?: string;
  contractEnd?: string;
  contractRef?: string;
  notes?: string;
  completedJobs: number;
  createdAt: string;
}

const STATUS_CFG: Record<string, { label: string; className: string; Icon: React.ComponentType<any> }> = {
  active:    { label: "Actif",      className: "bg-green-500/10 text-green-400 border-green-500/30",    Icon: CheckCircle },
  inactive:  { label: "Inactif",   className: "bg-muted text-muted-foreground border-border",            Icon: XCircle },
  suspended: { label: "Suspendu",  className: "bg-red-500/10 text-red-400 border-red-500/30",           Icon: AlertTriangle },
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  return res;
}

function StarRating({ value }: { value?: number }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} strokeWidth={1.5} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

const EMPTY: Partial<Subcontractor> = {
  name: "", specialty: "", contactName: "", phone: "", email: "", address: "", city: "",
  rating: undefined, status: "active", contractStart: "", contractEnd: "", contractRef: "", notes: "",
};

export default function SubcontractorsPage() {
  const { isReadOnly } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subcontractor | null>(null);
  const [form, setForm] = useState<Partial<Subcontractor>>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<Subcontractor | null>(null);

  const { data: items = [], isLoading } = useQuery<Subcontractor[]>({
    queryKey: ["subcontractors"],
    queryFn: async () => {
      const res = await apiFetch("/subcontractors");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Subcontractor>) =>
      apiFetch("/subcontractors", { method: "POST", body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subcontractors"] }); toast({ title: "Sous-traitant créé" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subcontractor> }) =>
      apiFetch(`/subcontractors/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subcontractors"] }); toast({ title: "Sous-traitant mis à jour" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/subcontractors/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subcontractors"] }); toast({ title: "Sous-traitant supprimé" }); setDeleteConfirm(null); },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (s: Subcontractor) => { setEditItem(s); setForm({ ...s }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (!form.name?.trim() || !form.specialty?.trim()) {
      toast({ title: "Nom et spécialité requis", variant: "destructive" }); return;
    }
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = items.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.specialty.toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isContractExpiringSoon = (s: Subcontractor) => {
    if (!s.contractEnd) return false;
    const end = new Date(s.contractEnd);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  const isContractExpired = (s: Subcontractor) => {
    if (!s.contractEnd) return false;
    return new Date(s.contractEnd) < new Date();
  };

  const stats = {
    total: items.length,
    active: items.filter(s => s.status === "active").length,
    expiringSoon: items.filter(s => isContractExpiringSoon(s)).length,
    totalJobs: items.reduce((acc, s) => acc + (s.completedJobs || 0), 0),
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Gestion</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sous-traitance</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos prestataires externes et leurs contrats</p>
        </div>
        {!isReadOnly && (
          <Button onClick={openCreate} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nouveau sous-traitant
          </Button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "#0A6DFF", Icon: Building2 },
          { label: "Actifs", value: stats.active, color: "#22C55E", Icon: CheckCircle },
          { label: "Contrats expirant", value: stats.expiringSoon, color: "#F59E0B", Icon: AlertTriangle },
          { label: "OT complétés", value: stats.totalJobs, color: "#8B5CF6", Icon: Briefcase },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-card border border-border/50 rounded-3xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input placeholder="Rechercher…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-card/50 border border-border/50 rounded-xl p-1">
          {[{ key: "all", label: "Tous" }, { key: "active", label: "Actifs" }, { key: "inactive", label: "Inactifs" }, { key: "suspended", label: "Suspendus" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border/30 rounded-3xl bg-card/30">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-medium">Aucun sous-traitant trouvé</p>
          <p className="text-xs mt-1">Créez votre premier sous-traitant pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((s, idx) => {
              const st = STATUS_CFG[s.status];
              const expiring = isContractExpiringSoon(s);
              const expired = isContractExpired(s);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border/50 rounded-3xl p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.specialty}</p>
                        {s.city && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
                            <MapPin className="h-3 w-3" strokeWidth={1.5} />
                            {s.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${st.className}`}>
                        <st.Icon className="h-3 w-3" strokeWidth={2} />
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {s.contactName && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        {s.contactName}
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        {s.phone}
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <StarRating value={s.rating} />
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {s.completedJobs} OT
                      </div>
                      {s.contractEnd && (
                        <div className={`flex items-center gap-1 ${expired ? "text-red-400" : expiring ? "text-amber-400" : ""}`}>
                          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {expired ? "Expiré" : expiring ? "Expire bientôt" : new Date(s.contractEnd).toLocaleDateString("fr-DZ")}
                        </div>
                      )}
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => setDeleteConfirm(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/60 rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier le sous-traitant" : "Nouveau sous-traitant"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom de la société *</label>
              <Input placeholder="Ex: SETIF Maintenance SARL" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Spécialité *</label>
              <Input placeholder="Ex: Électricité industrielle" value={form.specialty || ""} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
              <select
                value={form.status || "active"}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du contact</label>
              <Input placeholder="Mohamed Benali" value={form.contactName || ""} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
              <Input placeholder="+213 555 00 00 00" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input type="email" placeholder="contact@entreprise.dz" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ville</label>
              <Input placeholder="Alger" value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (1-5)</label>
              <Input type="number" min="1" max="5" step="0.1" placeholder="4.5" value={form.rating || ""} onChange={e => setForm(f => ({ ...f, rating: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Début de contrat</label>
              <Input type="date" value={form.contractStart || ""} onChange={e => setForm(f => ({ ...f, contractStart: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fin de contrat</label>
              <Input type="date" value={form.contractEnd || ""} onChange={e => setForm(f => ({ ...f, contractEnd: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Référence contrat</label>
              <Input placeholder="CONTRAT-2026-001" value={form.contractRef || ""} onChange={e => setForm(f => ({ ...f, contractRef: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <textarea
                placeholder="Notes additionnelles…"
                rows={3}
                value={form.notes || ""}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-full">
              {editItem ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border/60 rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le sous-traitant</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Êtes-vous sûr de vouloir supprimer <strong className="text-foreground">{deleteConfirm?.name}</strong> ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" className="rounded-full" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
