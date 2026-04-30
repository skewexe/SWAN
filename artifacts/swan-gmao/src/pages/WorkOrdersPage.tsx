import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder,
  useGetAssets, useGetTechnicians, getGetWorkOrdersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type WOType = "corrective" | "preventive" | "predictive" | "inspection";
type WOPriority = "low" | "medium" | "high" | "critical";
type WOStatus = "open" | "in_progress" | "completed" | "cancelled" | "on_hold";

const TYPE_LABELS: Record<WOType, { label: string; className: string }> = {
  corrective: { label: "Corrective", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  preventive: { label: "Préventive", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  predictive: { label: "Prédictive", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  inspection: { label: "Inspection", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
};

const PRIORITY_LABELS: Record<WOPriority, { label: string; className: string }> = {
  low: { label: "Faible", className: "bg-muted text-muted-foreground border-border" },
  medium: { label: "Moyenne", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  high: { label: "Élevée", className: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  critical: { label: "Critique", className: "bg-red-500/10 text-red-400 border-red-500/30" },
};

const STATUS_LABELS: Record<WOStatus, { label: string; className: string }> = {
  open: { label: "Ouvert", className: "bg-primary/10 text-primary border-primary/30" },
  in_progress: { label: "En cours", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  completed: { label: "Terminé", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  cancelled: { label: "Annulé", className: "bg-muted text-muted-foreground border-border" },
  on_hold: { label: "En attente", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
};

interface WOFormData {
  title: string;
  description?: string;
  type: WOType;
  priority: WOPriority;
  status: WOStatus;
  assetId?: number;
  technicianId?: number;
  estimatedHours?: number;
  scheduledDate?: string;
}

export default function WorkOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWO, setEditWO] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  };

  const { data: workOrders, isLoading } = useGetWorkOrders(params, {
    query: { queryKey: getGetWorkOrdersQueryKey(params) }
  });

  const { data: assets } = useGetAssets();
  const { data: technicians } = useGetTechnicians();

  const createWO = useCreateWorkOrder();
  const updateWO = useUpdateWorkOrder();
  const deleteWO = useDeleteWorkOrder();

  const form = useForm<WOFormData>({
    defaultValues: { title: "", type: "corrective", priority: "medium", status: "open" }
  });

  const openCreate = () => {
    setEditWO(null);
    form.reset({ title: "", type: "corrective", priority: "medium", status: "open" });
    setDialogOpen(true);
  };

  const openEdit = (wo: any) => {
    setEditWO(wo);
    form.reset({
      title: wo.title, description: wo.description, type: wo.type, priority: wo.priority,
      status: wo.status, assetId: wo.assetId, technicianId: wo.technicianId,
      estimatedHours: wo.estimatedHours, scheduledDate: wo.scheduledDate,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: WOFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
    const body = { ...data, assetId: data.assetId || undefined, technicianId: data.technicianId || undefined };
    if (editWO) {
      updateWO.mutate({ params: { id: editWO.id }, data: body }, {
        onSuccess: () => { toast({ title: "OT mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    } else {
      createWO.mutate({ data: body }, {
        onSuccess: () => { toast({ title: "OT créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteWO.mutate({ params: { id: deleteConfirm.id } }, {
      onSuccess: () => {
        toast({ title: "OT supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Ordres de travail</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des interventions de maintenance</p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="button-create-workorder">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouvel OT
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" data-testid="select-wo-status"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="on_hold">En attente</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-44" data-testid="select-wo-priority"><SelectValue placeholder="Priorité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44" data-testid="select-wo-type"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="corrective">Corrective</SelectItem>
            <SelectItem value="preventive">Préventive</SelectItem>
            <SelectItem value="predictive">Prédictive</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Titre</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Priorité</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Statut</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Équipement</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Technicien</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Date prévue</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {workOrders && workOrders.length > 0 ? workOrders.map((wo, idx) => {
                const type = TYPE_LABELS[wo.type as WOType];
                const priority = PRIORITY_LABELS[wo.priority as WOPriority];
                const status = STATUS_LABELS[wo.status as WOStatus];
                return (
                  <motion.tr
                    key={wo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                    data-testid={`row-workorder-${wo.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground max-w-xs truncate">{wo.title}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${type?.className}`}>{type?.label}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${priority?.className}`}>{priority?.label}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status?.className}`}>{status?.label}</span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{wo.assetName || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{wo.technicianName || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString("fr-DZ") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(wo)} data-testid={`button-edit-wo-${wo.id}`}>
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(wo)} data-testid={`button-delete-wo-${wo.id}`}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Aucun ordre de travail trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editWO ? "Modifier l'OT" : "Nouvel ordre de travail"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" rules={{ required: "Requis" }} render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl><Input data-testid="input-wo-title" placeholder="Ex: Remplacement joint pompe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea data-testid="input-wo-description" placeholder="Détails de l'intervention..." rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-wo-type-form"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="preventive">Préventive</SelectItem>
                        <SelectItem value="predictive">Prédictive</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-wo-priority-form"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-wo-status-form"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Ouvert</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="on_hold">En attente</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimatedHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heures estimées</FormLabel>
                    <FormControl><Input type="number" step="0.5" data-testid="input-wo-hours" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="assetId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipement</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-wo-asset"><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {assets?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="technicianId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technicien</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-wo-technician"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {technicians?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Date planifiée</FormLabel>
                    <FormControl><Input type="date" data-testid="input-wo-date" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createWO.isPending || updateWO.isPending} data-testid="button-submit-wo">
                  {editWO ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer l'OT
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.title}"</span> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteWO.isPending} data-testid="button-confirm-delete-wo">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
