import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetPreventivePlans, useCreatePreventivePlan, useUpdatePreventivePlan, useDeletePreventivePlan,
  useGetAssets, getGetPreventivePlansQueryKey, getGetWorkOrdersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle, CalendarClock, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  annually: "Annuel",
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground border-border" },
  overdue: { label: "En retard", className: "bg-red-500/10 text-red-400 border-red-500/30" },
};

type PlanFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "annually";

interface PlanFormData {
  name: string;
  description?: string;
  assetId?: number;
  frequency: PlanFrequency;
  nextDue?: string;
  estimatedDuration?: number;
}

export default function PreventivePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useGetPreventivePlans();
  const { data: assets } = useGetAssets();
  const createPlan = useCreatePreventivePlan();
  const updatePlan = useUpdatePreventivePlan();
  const deletePlan = useDeletePreventivePlan();

  const form = useForm<PlanFormData>({
    defaultValues: { name: "", frequency: "monthly" }
  });

  const openCreate = () => {
    setEditPlan(null);
    form.reset({ name: "", frequency: "monthly" });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditPlan(plan);
    form.reset({
      name: plan.name, description: plan.description, assetId: plan.assetId,
      frequency: plan.frequency, nextDue: plan.nextDue, estimatedDuration: plan.estimatedDuration,
    });
    setDialogOpen(true);
  };

  const executePlan = async (plan: any) => {
    setExecutingId(plan.id);
    try {
      const res = await fetch(`/api/preventive/${plan.id}/execute`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast({
        title: "Intervention planifiée",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: getGetPreventivePlansQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
    } catch {
      toast({ title: "Erreur lors de l'exécution", variant: "destructive" });
    } finally {
      setExecutingId(null);
    }
  };

  const onSubmit = (data: PlanFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetPreventivePlansQueryKey() });
    const body = { ...data, assetId: data.assetId || undefined };
    if (editPlan) {
      updatePlan.mutate({ id: editPlan.id, data: body }, {
        onSuccess: () => { toast({ title: "Plan mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    } else {
      createPlan.mutate({ data: body as any }, {
        onSuccess: () => { toast({ title: "Plan créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deletePlan.mutate({ id: deleteConfirm.id }, {
      onSuccess: () => {
        toast({ title: "Plan supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetPreventivePlansQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const overdueCount = plans?.filter(p => p.status === "overdue").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Maintenance préventive</h1>
          <p className="text-sm text-muted-foreground mt-1">Plans de maintenance périodique</p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="button-create-plan">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouveau plan
        </Button>
      </div>

      {overdueCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span><span className="font-semibold">{overdueCount} plan{overdueCount > 1 ? "s" : ""}</span> en retard — cliquez sur <span className="font-semibold">Exécuter</span> pour lancer l'intervention.</span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/60 rounded-2xl overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Plan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Équipement</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Fréquence</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Prochaine date</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Durée est.</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Statut</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {plans && plans.length > 0 ? plans.map((plan, idx) => {
                const status = STATUS_MAP[plan.status] || STATUS_MAP.inactive;
                const isExecuting = executingId === plan.id;
                return (
                  <motion.tr
                    key={plan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                    data-testid={`row-plan-${plan.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${plan.status === "overdue" ? "bg-amber-500/15" : "bg-primary/10"}`}>
                          <CalendarClock className={`h-4 w-4 ${plan.status === "overdue" ? "text-amber-400" : "text-primary"}`} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{plan.name}</div>
                          {plan.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{plan.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{plan.assetName || "—"}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                        {FREQUENCY_LABELS[plan.frequency] || plan.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {plan.nextDue ? (
                        <span className={plan.status === "overdue" ? "text-amber-400 font-medium" : ""}>
                          {new Date(plan.nextDue).toLocaleDateString("fr-DZ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {plan.estimatedDuration ? `${plan.estimatedDuration}h` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          onClick={() => executePlan(plan)}
                          disabled={isExecuting}
                          data-testid={`button-execute-plan-${plan.id}`}
                        >
                          <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {isExecuting ? "..." : "Exécuter"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(plan)} data-testid={`button-delete-plan-${plan.id}`}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Aucun plan trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editPlan ? "Modifier le plan" : "Nouveau plan préventif"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" rules={{ required: "Requis" }} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du plan</FormLabel>
                  <FormControl><Input data-testid="input-plan-name" placeholder="Ex: Révision annuelle compresseur" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea data-testid="input-plan-description" placeholder="Tâches à effectuer..." rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="assetId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipement</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-plan-asset"><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {assets?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="frequency" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-plan-frequency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="quarterly">Trimestriel</SelectItem>
                        <SelectItem value="annually">Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nextDue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prochaine date</FormLabel>
                    <FormControl><Input type="date" data-testid="input-plan-next-due" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimatedDuration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée estimée (h)</FormLabel>
                    <FormControl><Input type="number" step="0.5" data-testid="input-plan-duration" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending} data-testid="button-submit-plan">
                  {editPlan ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer le plan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePlan.isPending} data-testid="button-confirm-delete-plan">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
