import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  useGetWorkOrderParts,
  useUpdateWorkOrder,
  getGetWorkOrdersQueryKey,
  getGetWorkOrderPartsQueryKey,
} from "@workspace/api-client-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, User, Calendar, Clock, Package, Tag, ArrowRight,
  CheckCircle2, Circle, Loader2, AlertTriangle, Info, Hash,
} from "lucide-react";

type WOStatus = "open" | "in_progress" | "completed" | "on_hold" | "cancelled";
type WOPriority = "critical" | "high" | "medium" | "low";
type WOType = "corrective" | "preventive" | "predictive" | "inspection";

const STATUS_FLOW: { key: WOStatus; label: string; color: string; bg: string }[] = [
  { key: "open", label: "Ouvert", color: "#0A6DFF", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { key: "in_progress", label: "En cours", color: "#38BDF8", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { key: "completed", label: "Terminé", color: "#22C55E", bg: "bg-green-500/10 text-green-400 border-green-500/30" },
  { key: "on_hold", label: "En attente", color: "#F59E0B", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  { key: "cancelled", label: "Annulé", color: "#94A3B8", bg: "bg-muted text-muted-foreground border-border" },
];

const PRIORITY_MAP: Record<WOPriority, { label: string; color: string }> = {
  critical: { label: "Critique", color: "#EF4444" },
  high: { label: "Élevée", color: "#F59E0B" },
  medium: { label: "Moyenne", color: "#38BDF8" },
  low: { label: "Faible", color: "#94A3B8" },
};

const TYPE_MAP: Record<WOType, { label: string }> = {
  corrective: { label: "Corrective" },
  preventive: { label: "Préventive" },
  predictive: { label: "Prédictive" },
  inspection: { label: "Inspection" },
};

function InfoRow({ icon: Icon, label, value, valueClass = "" }: {
  icon: any; label: string; value: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-foreground leading-snug ${valueClass}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

interface Props {
  workOrder: any | null;
  open: boolean;
  onClose: () => void;
}

export function WorkOrderDetailSheet({ workOrder, open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateWO = useUpdateWorkOrder();

  const woId = workOrder?.id ?? 0;
  const { data: parts, isLoading: partsLoading } = useGetWorkOrderParts(
    woId,
    { query: { queryKey: getGetWorkOrderPartsQueryKey(woId), enabled: !!workOrder } }
  );

  const currentStatus = STATUS_FLOW.find(s => s.key === workOrder?.status);
  const priority = PRIORITY_MAP[workOrder?.priority as WOPriority];
  const type = TYPE_MAP[workOrder?.type as WOType];
  const totalPartsCost = parts?.reduce((s, p) => s + (p.totalCost ?? 0), 0) ?? 0;

  const changeStatus = (newStatus: WOStatus) => {
    if (!workOrder || newStatus === workOrder.status) return;
    const body: any = { status: newStatus };
    if (newStatus === "completed") body.completedDate = new Date().toISOString().slice(0, 10);
    updateWO.mutate(
      { id: workOrder.id, data: body },
      {
        onSuccess: () => {
          toast({ title: `Statut → ${STATUS_FLOW.find(s => s.key === newStatus)?.label}` });
          queryClient.invalidateQueries({ queryKey: getGetWorkOrdersQueryKey() });
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-l border-border/60 p-0 overflow-y-auto"
      >
        {!workOrder ? null : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border/50 shrink-0">
              <SheetHeader>
                <div className="flex items-start gap-3 pr-6">
                  <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: `${currentStatus?.color}15` }}>
                    <Wrench className="h-5 w-5" style={{ color: currentStatus?.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base font-semibold leading-tight text-foreground">
                      {workOrder.title}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${currentStatus?.bg}`}>
                        {currentStatus?.label}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground">
                        {type?.label || workOrder.type}
                      </span>
                      {priority && (
                        <span className="text-xs font-semibold" style={{ color: priority.color }}>
                          {priority.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Status progression */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Changer le statut
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_FLOW.filter(s => s.key !== "cancelled").map((s) => {
                    const isCurrent = workOrder.status === s.key;
                    const isPending = updateWO.isPending;
                    return (
                      <button
                        key={s.key}
                        onClick={() => changeStatus(s.key)}
                        disabled={isCurrent || isPending}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          isCurrent
                            ? `border-current opacity-90 cursor-default ${s.bg}`
                            : "border-border/40 text-muted-foreground hover:border-border bg-background/50 hover:bg-muted/50"
                        }`}
                      >
                        {isCurrent ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: s.color }} />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-border" strokeWidth={1.5} />
                        )}
                        {s.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => changeStatus("cancelled")}
                    disabled={workOrder.status === "cancelled" || updateWO.isPending}
                    className={`col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      workOrder.status === "cancelled"
                        ? "border-current text-muted-foreground bg-muted"
                        : "border-border/40 text-muted-foreground hover:border-destructive/50 hover:text-destructive bg-background/50 hover:bg-destructive/5"
                    }`}
                  >
                    {workOrder.status === "cancelled" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    )}
                    Annuler l'OT
                  </button>
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Détails
                </p>
                <div className="bg-background/50 border border-border/40 rounded-xl px-4">
                  {workOrder.description && (
                    <InfoRow icon={Info} label="Description" value={workOrder.description} />
                  )}
                  <InfoRow icon={Hash} label="ID" value={`#OT-${String(workOrder.id).padStart(4, "0")}`} />
                  <InfoRow icon={Tag} label="Équipement" value={workOrder.assetName} />
                  <InfoRow icon={User} label="Technicien" value={workOrder.technicianName} />
                  <InfoRow icon={Calendar} label="Date planifiée" value={
                    workOrder.scheduledDate
                      ? new Date(workOrder.scheduledDate).toLocaleDateString("fr-DZ")
                      : undefined
                  } />
                  {workOrder.completedDate && (
                    <InfoRow icon={CheckCircle2} label="Date clôture" value={
                      new Date(workOrder.completedDate).toLocaleDateString("fr-DZ")
                    } valueClass="text-green-400" />
                  )}
                  <InfoRow icon={Clock} label="Durée estimée" value={
                    workOrder.estimatedHours ? `${workOrder.estimatedHours}h` : undefined
                  } />
                  {workOrder.actualHours != null && (
                    <InfoRow icon={Clock} label="Durée réelle" value={`${workOrder.actualHours}h`} />
                  )}
                  <InfoRow icon={Calendar} label="Créé le" value={
                    new Date(workOrder.createdAt).toLocaleDateString("fr-DZ")
                  } />
                </div>
              </div>

              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pièces utilisées {parts ? `(${parts.length})` : ""}
                  </p>
                  {totalPartsCost > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Coût: <span className="font-semibold text-foreground">{totalPartsCost.toLocaleString("fr-DZ")} DA</span>
                    </span>
                  )}
                </div>
                {partsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
                  </div>
                ) : parts && parts.length > 0 ? (
                  <div className="space-y-2">
                    {parts.map((part, idx) => (
                      <motion.div
                        key={part.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 bg-background/50 border border-border/40 rounded-xl px-4 py-3"
                      >
                        <Package className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{part.itemName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>Qté: <span className="font-semibold text-foreground">{part.quantityUsed}</span></span>
                            {part.totalCost != null && (
                              <span>— {part.totalCost.toLocaleString("fr-DZ")} DA</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-border/30 rounded-xl bg-background/30">
                    <Package className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/30" strokeWidth={1} />
                    Aucune pièce utilisée
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 shrink-0">
              {updateWO.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mise à jour en cours...
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
