import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  useGetWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder,
  useGetAssets, useGetTechnicians, useGetInventoryItems,
  useGetWorkOrderParts, useAddWorkOrderPart, useRemoveWorkOrderPart,
  useGetSites, useGetZones,
  getGetWorkOrdersQueryKey, getGetWorkOrderPartsQueryKey, getGetInventoryItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle, Package, X, AlertCircle, ExternalLink, Lock, MapPin, Building2, SlidersHorizontal, Send, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { WorkOrderDetailSheet } from "@/components/WorkOrderDetailSheet";
import { useRBAC } from "@/context/RBACContext";

type WOType = "corrective" | "preventive" | "predictive" | "inspection";
type WOPriority = "low" | "medium" | "high" | "critical";
type WOStatus = "open" | "in_progress" | "completed" | "cancelled" | "on_hold";
type AssignmentMode = "by_technician" | "by_zone" | "by_machine" | "by_type";

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

const ASSIGNMENT_MODE_LABELS: Record<AssignmentMode, string> = {
  by_technician: "Par technicien",
  by_zone: "Par zone",
  by_machine: "Par machine",
  by_type: "Par type",
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
  siteId?: number;
  zoneId?: number;
  assignmentMode?: AssignmentMode;
  extraTechnicianIds?: number[];
}

function PartsDialog({
  workOrder,
  open,
  onClose,
}: {
  workOrder: any;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [noteInput, setNoteInput] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const workOrderId = workOrder?.id ?? 0;
  const { data: parts, isLoading: partsLoading } = useGetWorkOrderParts(
    workOrderId,
    { query: { queryKey: getGetWorkOrderPartsQueryKey(workOrderId), enabled: !!workOrder } }
  );

  const { data: inventoryItems } = useGetInventoryItems(
    {},
    { query: { queryKey: getGetInventoryItemsQueryKey({}) } }
  );

  const addPart = useAddWorkOrderPart();
  const removePart = useRemoveWorkOrderPart();

  const totalPartsCost = parts?.reduce((sum, p) => sum + (p.totalCost ?? 0), 0) ?? 0;

  const handleAddPart = () => {
    if (!selectedItemId || !workOrder) return;
    const qty = Number(quantityInput);
    if (qty <= 0) { toast({ title: "Quantité invalide", variant: "destructive" }); return; }

    addPart.mutate(
      { id: workOrder.id, data: { inventoryItemId: Number(selectedItemId), quantityUsed: qty, note: noteInput || undefined } },
      {
        onSuccess: (result) => {
          toast({ title: `${result.itemName} ajouté — stock: ${result.newStockLevel ?? "?"} restant(s)` });
          setSelectedItemId("");
          setQuantityInput("1");
          setNoteInput("");
          queryClient.invalidateQueries({ queryKey: getGetWorkOrderPartsQueryKey(workOrder.id) });
          queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey({}) });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || "Erreur lors de l'ajout";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleRemovePart = (partId: number) => {
    if (!workOrder) return;
    removePart.mutate(
      { id: workOrder.id, partId },
      {
        onSuccess: () => {
          toast({ title: "Pièce retirée — stock restauré" });
          queryClient.invalidateQueries({ queryKey: getGetWorkOrderPartsQueryKey(workOrder.id) });
          queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey({}) });
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      }
    );
  };

  const availableItems = inventoryItems?.filter(i => i.quantity > 0) ?? [];
  const selectedItem = inventoryItems?.find(i => i.id.toString() === selectedItemId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" strokeWidth={1.5} />
            Pièces & matériaux — {workOrder?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="bg-background/50 border border-border/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ajouter une pièce</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger data-testid="select-part-item" className="text-sm">
                    <SelectValue placeholder="Choisir un article du stock..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.length === 0 ? (
                      <SelectItem value="none" disabled>Aucun article disponible</SelectItem>
                    ) : (
                      availableItems.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-muted-foreground text-xs">({item.quantity} {item.unit || "unités"})</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantityInput}
                  onChange={e => setQuantityInput(e.target.value)}
                  placeholder="Qté"
                  data-testid="input-part-quantity"
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleAddPart}
                disabled={!selectedItemId || addPart.isPending}
                size="sm"
                data-testid="button-add-part"
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Ajouter
              </Button>
            </div>

            {selectedItem && (
              <div className="flex items-center gap-2 text-xs">
                {selectedItem.isLowStock ? (
                  <AlertCircle className="h-3.5 w-3.5 text-red-400" strokeWidth={1.5} />
                ) : null}
                <span className="text-muted-foreground">
                  Stock disponible: <span className={`font-semibold ${selectedItem.isLowStock ? "text-red-400" : "text-foreground"}`}>
                    {selectedItem.quantity} {selectedItem.unit || "unités"}
                  </span>
                  {selectedItem.unitCost != null && (
                    <span className="ml-2">— {selectedItem.unitCost.toLocaleString("fr-DZ")} DA/unité</span>
                  )}
                </span>
              </div>
            )}

            <Input
              placeholder="Note (optionnel)"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              data-testid="input-part-note"
              className="text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pièces utilisées ({parts?.length ?? 0})
              </p>
              {totalPartsCost > 0 && (
                <span className="text-xs text-muted-foreground">
                  Coût total pièces: <span className="font-semibold text-foreground">{totalPartsCost.toLocaleString("fr-DZ")} DA</span>
                </span>
              )}
            </div>

            {partsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : parts && parts.length > 0 ? (
              <div className="space-y-2">
                {parts.map((part) => (
                  <motion.div
                    key={part.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-background/50 border border-border/40 rounded-xl px-4 py-3"
                    data-testid={`part-row-${part.id}`}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{part.itemName}</span>
                        {part.itemReference && (
                          <span className="text-xs text-muted-foreground font-mono">{part.itemReference}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Qté: <span className="font-semibold text-foreground">{part.quantityUsed} {part.itemUnit || "unités"}</span>
                        </span>
                        {part.totalCost != null && (
                          <span className="text-xs text-muted-foreground">
                            Coût: <span className="font-semibold text-foreground">{part.totalCost.toLocaleString("fr-DZ")} DA</span>
                          </span>
                        )}
                        {part.note && (
                          <span className="text-xs text-muted-foreground italic">{part.note}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePart(part.id)}
                      className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      disabled={removePart.isPending}
                      data-testid={`button-remove-part-${part.id}`}
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border border-border/30 rounded-xl bg-background/30">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                Aucune pièce ajoutée pour le moment
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWO, setEditWO] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [partsWO, setPartsWO] = useState<any>(null);
  const [detailWO, setDetailWO] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusTarget, setBulkStatusTarget] = useState<WOStatus>("completed");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [sendingTelegramId, setSendingTelegramId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isReadOnly } = useRBAC();
  const isTechnicien = user.role === "technicien";

  const params = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  };

  const { data: rawWorkOrders, isLoading } = useGetWorkOrders(params, {
    query: { queryKey: getGetWorkOrdersQueryKey(params) }
  });

  const workOrders = useMemo(() => {
    if (!rawWorkOrders) return rawWorkOrders;
    if (isTechnicien && user.technicianId) {
      return (rawWorkOrders as any[]).filter(wo => wo.technicianId === user.technicianId);
    }
    return rawWorkOrders;
  }, [rawWorkOrders, isTechnicien, user.technicianId]);

  const { data: assets } = useGetAssets();
  const { data: technicians } = useGetTechnicians();
  const { data: sites } = useGetSites();
  const { data: zones } = useGetZones({});

  const createWO = useCreateWorkOrder();
  const updateWO = useUpdateWorkOrder();
  const deleteWO = useDeleteWorkOrder();

  const form = useForm<WOFormData>({
    defaultValues: { title: "", type: "corrective", priority: "medium", status: "open" }
  });

  const watchedSiteId = form.watch("siteId");
  const filteredZones = useMemo(() =>
    zones?.filter(z => !watchedSiteId || z.siteId === watchedSiteId) ?? [],
    [zones, watchedSiteId]
  );

  const openCreate = () => {
    setEditWO(null);
    form.reset({ title: "", type: "corrective", priority: "medium", status: "open", extraTechnicianIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (wo: any) => {
    setEditWO(wo);
    form.reset({
      title: wo.title, description: wo.description, type: wo.type, priority: wo.priority,
      status: wo.status, assetId: wo.assetId, technicianId: wo.technicianId,
      estimatedHours: wo.estimatedHours, scheduledDate: wo.scheduledDate,
      siteId: wo.siteId, zoneId: wo.zoneId, assignmentMode: wo.assignmentMode,
      extraTechnicianIds: wo.extraTechnicianIds || [],
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: WOFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
    const body = {
      ...data,
      assetId: data.assetId || undefined,
      technicianId: data.technicianId || undefined,
      siteId: data.siteId || undefined,
      zoneId: data.zoneId || undefined,
      assignmentMode: data.assignmentMode || undefined,
      extraTechnicianIds: data.extraTechnicianIds || [],
    };
    if (editWO) {
      updateWO.mutate({ id: editWO.id, data: body }, {
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

  const handleSendTelegram = async (wo: any) => {
    setSendingTelegramId(wo.id);
    try {
      const res = await fetch(`/api/workorders/${wo.id}/send-telegram`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `Telegram envoyé à ${data.sent} technicien(s)` });
      } else {
        toast({ title: data.error || "Erreur Telegram", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSendingTelegramId(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!workOrders) return;
    if (selectedIds.size === workOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workOrders.map((wo: any) => wo.id)));
    }
  };

  const executeBulkStatus = async () => {
    const ids = Array.from(selectedIds);
    let success = 0;
    for (const id of ids) {
      await new Promise<void>(resolve => {
        const body: any = { status: bulkStatusTarget };
        if (bulkStatusTarget === "completed") body.completedDate = new Date().toISOString().slice(0, 10);
        updateWO.mutate({ id, data: body }, { onSuccess: () => { success++; resolve(); }, onError: () => resolve() });
      });
    }
    toast({ title: `${success} OT mis à jour → ${STATUS_LABELS[bulkStatusTarget]?.label}` });
    setSelectedIds(new Set());
    setShowBulkDialog(false);
    queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteWO.mutate({ id: deleteConfirm.id }, {
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Maintenance</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ordres de travail</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTechnicien
              ? "Mes interventions assignées"
              : "Gestion des interventions de maintenance"}
            {isTechnicien && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-yellow-400">
                <Lock className="h-3 w-3" strokeWidth={2} />
                Vue technicien
              </span>
            )}
          </p>
        </div>
        {!isReadOnly && !isTechnicien && (
          <Button onClick={openCreate} className="gap-2 rounded-full" data-testid="button-create-workorder">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Nouvel OT
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3"
        >
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} OT sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="flex-1" />
          <Select value={bulkStatusTarget} onValueChange={v => setBulkStatusTarget(v as WOStatus)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="on_hold">En attente</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowBulkDialog(true)}>
            Appliquer le statut
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
            Désélectionner
          </Button>
        </motion.div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/60 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                {!isReadOnly && !isTechnicien && (
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={!!workOrders && workOrders.length > 0 && selectedIds.size === workOrders.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </th>
                )}
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Titre</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Priorité</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Statut</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Équipement</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Technicien</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Site / Zone</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Mode</th>
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
                    className={`border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.has(wo.id) ? "bg-primary/5" : ""}`}
                    onClick={() => setDetailWO(wo)}
                    data-testid={`row-workorder-${wo.id}`}
                  >
                    {!isReadOnly && !isTechnicien && (
                      <td className="px-4 py-4 w-10" onClick={e => { e.stopPropagation(); toggleSelect(wo.id); }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(wo.id)}
                          onChange={() => toggleSelect(wo.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                    )}
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
                    <td className="px-4 py-4 text-muted-foreground text-xs">{(wo as any).assetName || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{(wo as any).technicianName || "—"}</td>
                    <td className="px-4 py-4 text-xs">
                      {(wo as any).siteName || (wo as any).zoneName ? (
                        <div className="flex flex-col gap-0.5">
                          {(wo as any).siteName && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                              {(wo as any).siteName}
                            </span>
                          )}
                          {(wo as any).zoneName && (
                            <span className="flex items-center gap-1 text-muted-foreground/70">
                              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                              {(wo as any).zoneName}
                            </span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {(wo as any).assignmentMode ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <SlidersHorizontal className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          {ASSIGNMENT_MODE_LABELS[(wo as any).assignmentMode as AssignmentMode] || (wo as any).assignmentMode}
                        </span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {(wo as any).scheduledDate ? new Date((wo as any).scheduledDate).toLocaleDateString("fr-DZ") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[#2AABEE] hover:text-[#2AABEE] hover:bg-[#2AABEE]/10"
                          onClick={() => handleSendTelegram(wo)}
                          disabled={sendingTelegramId === wo.id}
                          title="Envoyer via Telegram"
                          data-testid={`button-telegram-wo-${wo.id}`}
                        >
                          {sendingTelegramId === wo.id
                            ? <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <Send className="h-3.5 w-3.5" strokeWidth={1.5} />}
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setDetailWO(wo)}
                          title="Voir le détail"
                          data-testid={`button-detail-wo-${wo.id}`}
                        >
                          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setPartsWO(wo)}
                          title="Gérer les pièces"
                          data-testid={`button-parts-wo-${wo.id}`}
                        >
                          <Package className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(wo)}
                          data-testid={`button-edit-wo-${wo.id}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirm(wo)}
                          data-testid={`button-delete-wo-${wo.id}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Aucun ordre de travail trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Work Order Detail Sheet */}
      <WorkOrderDetailSheet workOrder={detailWO} open={!!detailWO} onClose={() => setDetailWO(null)} />

      {/* Parts Dialog */}
      <PartsDialog workOrder={partsWO} open={!!partsWO} onClose={() => setPartsWO(null)} />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
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
                <FormField control={form.control} name="assignmentMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode d'affectation</FormLabel>
                    <Select value={field.value || "none"} onValueChange={v => field.onChange(v !== "none" ? v : undefined)}>
                      <SelectTrigger data-testid="select-wo-assignment-mode"><SelectValue placeholder="Non défini" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non défini</SelectItem>
                        <SelectItem value="by_technician">Par technicien</SelectItem>
                        <SelectItem value="by_zone">Par zone</SelectItem>
                        <SelectItem value="by_machine">Par machine</SelectItem>
                        <SelectItem value="by_type">Par type</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Technicien principal</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-wo-technician"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {technicians?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="extraTechnicianIds" render={({ field }) => {
                  const watchedPrimary = form.watch("technicianId");
                  const available = technicians?.filter(t => t.id !== watchedPrimary) ?? [];
                  const selected: number[] = field.value ?? [];
                  return (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                        Autres techniciens
                      </FormLabel>
                      {available.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 italic">Aucun autre technicien disponible</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border/60 bg-background/30 max-h-32 overflow-y-auto">
                          {available.map(t => {
                            const checked = selected.includes(t.id);
                            const hasTelegram = !!(t as any).telegramChatId;
                            return (
                              <label key={t.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs select-none ${checked ? "border-primary/60 bg-primary/10 text-primary" : "border-border/40 hover:border-primary/30 text-muted-foreground"}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e => {
                                    if (e.target.checked) field.onChange([...selected, t.id]);
                                    else field.onChange(selected.filter(id => id !== t.id));
                                  }}
                                  className="h-3.5 w-3.5 accent-primary"
                                />
                                <span className="font-medium">{t.name}</span>
                                {hasTelegram && <Send className="h-3 w-3 text-[#2AABEE]" strokeWidth={1.5} aria-label="Telegram configuré" />}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </FormItem>
                  );
                }} />
                <FormField control={form.control} name="siteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => {
                      field.onChange(v !== "none" ? Number(v) : undefined);
                      form.setValue("zoneId", undefined);
                    }}>
                      <SelectTrigger data-testid="select-wo-site"><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tous les sites</SelectItem>
                        {sites?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="zoneId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-wo-zone"><SelectValue placeholder="Aucune zone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune zone</SelectItem>
                        {filteredZones.map(z => <SelectItem key={z.id} value={z.id.toString()}>{z.name}{z.siteName ? ` (${z.siteName})` : ""}</SelectItem>)}
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

      {/* Bulk status confirm */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Confirmer la modification
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Appliquer le statut{" "}
            <span className={`font-semibold px-1.5 py-0.5 rounded text-xs border ${STATUS_LABELS[bulkStatusTarget]?.className}`}>
              {STATUS_LABELS[bulkStatusTarget]?.label}
            </span>{" "}
            à <span className="font-semibold text-foreground">{selectedIds.size} OT</span> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Annuler</Button>
            <Button onClick={executeBulkStatus} disabled={updateWO.isPending}>
              {updateWO.isPending ? "En cours..." : "Confirmer"}
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
