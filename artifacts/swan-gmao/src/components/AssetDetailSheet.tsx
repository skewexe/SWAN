import { motion } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  Wrench, MapPin, Calendar, Tag, BarChart2, Clock, AlertTriangle,
  CheckCircle2, Hash, Factory, Layers, Building2, ImageIcon, Package, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetAssetParts, useCreateAssetPart, useDeleteAssetPart,
  useGetInventoryItems,
  getGetAssetPartsQueryKey, getGetInventoryItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type AssetStatus = "operational" | "maintenance" | "breakdown" | "decommissioned";
type WOStatus = "open" | "in_progress" | "completed" | "on_hold" | "cancelled";
type WOPriority = "critical" | "high" | "medium" | "low";

const ASSET_STATUS: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  operational: { label: "Opérationnel", color: "#22C55E", bg: "bg-green-500/10 text-green-400 border-green-500/30" },
  maintenance: { label: "En maintenance", color: "#F59E0B", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  breakdown: { label: "En panne", color: "#EF4444", bg: "bg-red-500/10 text-red-400 border-red-500/30" },
  decommissioned: { label: "Hors service", color: "#94A3B8", bg: "bg-muted text-muted-foreground border-border" },
};

const WO_STATUS: Record<WOStatus, { label: string; bg: string }> = {
  open: { label: "Ouvert", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  in_progress: { label: "En cours", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  completed: { label: "Terminé", bg: "bg-green-500/10 text-green-400 border-green-500/30" },
  on_hold: { label: "En attente", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  cancelled: { label: "Annulé", bg: "bg-muted text-muted-foreground border-border" },
};

const PRIORITY: Record<WOPriority, { label: string; color: string }> = {
  critical: { label: "Critique", color: "#EF4444" },
  high: { label: "Élevée", color: "#F59E0B" },
  medium: { label: "Moyenne", color: "#38BDF8" },
  low: { label: "Faible", color: "#94A3B8" },
};

function InfoRow({ icon: Icon, label, value, valueClass = "" }: {
  icon: any; label: string; value?: React.ReactNode; valueClass?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-foreground leading-snug ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function KpiPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex-1 bg-background/50 border border-border/40 rounded-xl p-3 text-center">
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function MachinePartsSection({ assetId }: { assetId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newReference, setNewReference] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("pce");
  const [newNote, setNewNote] = useState("");
  const [newInventoryItemId, setNewInventoryItemId] = useState<string>("");

  const { data: parts, isLoading } = useGetAssetParts(
    assetId,
    { query: { queryKey: getGetAssetPartsQueryKey(assetId), enabled: assetId > 0 } }
  );

  const { data: inventoryItems } = useGetInventoryItems(
    {},
    { query: { queryKey: getGetInventoryItemsQueryKey({}) } }
  );

  const createPart = useCreateAssetPart();
  const deletePart = useDeleteAssetPart();

  const handleAdd = () => {
    if (!newPartName.trim()) {
      toast({ title: "Nom de la pièce requis", variant: "destructive" });
      return;
    }
    createPart.mutate({
      id: assetId,
      data: {
        partName: newPartName.trim(),
        reference: newReference || undefined,
        quantity: Number(newQty) || 1,
        unit: newUnit || undefined,
        note: newNote || undefined,
        inventoryItemId: newInventoryItemId ? Number(newInventoryItemId) : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Pièce ajoutée au catalogue" });
        queryClient.invalidateQueries({ queryKey: getGetAssetPartsQueryKey(assetId) });
        setNewPartName(""); setNewReference(""); setNewQty("1"); setNewNote(""); setNewInventoryItemId("");
        setShowAdd(false);
      },
      onError: () => toast({ title: "Erreur lors de l'ajout", variant: "destructive" }),
    });
  };

  const handleDelete = (partId: number) => {
    deletePart.mutate({ id: assetId, partId }, {
      onSuccess: () => {
        toast({ title: "Pièce retirée" });
        queryClient.invalidateQueries({ queryKey: getGetAssetPartsQueryKey(assetId) });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Catalogue de pièces {parts ? `(${parts.length})` : ""}
        </p>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary" onClick={() => setShowAdd(v => !v)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter
        </Button>
      </div>

      {showAdd && (
        <div className="bg-background/50 border border-border/40 rounded-xl p-3 space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nom de la pièce *"
              value={newPartName}
              onChange={e => setNewPartName(e.target.value)}
              className="text-xs h-8 col-span-2"
            />
            <Input
              placeholder="Référence"
              value={newReference}
              onChange={e => setNewReference(e.target.value)}
              className="text-xs h-8"
            />
            <div className="flex gap-1">
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Qté"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                className="text-xs h-8 w-20"
              />
              <Input
                placeholder="Unité"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                className="text-xs h-8 flex-1"
              />
            </div>
          </div>
          {inventoryItems && inventoryItems.length > 0 && (
            <Select value={newInventoryItemId} onValueChange={setNewInventoryItemId}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Lier à un article du stock (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun article lié</SelectItem>
                {inventoryItems.map(i => (
                  <SelectItem key={i.id} value={i.id.toString()}>
                    {i.name} {i.reference ? `(${i.reference})` : ""} — {i.quantity} {i.unit || "unités"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            placeholder="Note"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            className="text-xs h-8"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleAdd} disabled={createPart.isPending}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Confirmer
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : parts && parts.length > 0 ? (
        <div className="space-y-2">
          {parts.map((part: any, idx: number) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-start gap-3 bg-background/50 border border-border/40 rounded-xl px-4 py-3"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Package className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{part.partName}</span>
                  {part.reference && (
                    <span className="text-xs text-muted-foreground font-mono">{part.reference}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Qté: <span className="font-semibold text-foreground">{part.quantity} {part.unit || "pce"}</span>
                  </span>
                  {part.inventoryItemName && (
                    <span className="text-xs text-primary/80">
                      Stock: {part.inventoryItemQuantity ?? "?"} {part.inventoryItemUnit || ""}
                    </span>
                  )}
                  {part.note && <span className="text-xs text-muted-foreground italic">{part.note}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(part.id)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
                disabled={deletePart.isPending}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-xs text-muted-foreground border border-border/30 rounded-xl bg-background/30">
          <Package className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/30" strokeWidth={1} />
          Aucune pièce dans le catalogue
        </div>
      )}
    </div>
  );
}

interface Props {
  asset: any | null;
  open: boolean;
  onClose: () => void;
}

export function AssetDetailSheet({ asset, open, onClose }: Props) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !asset) { setWorkOrders([]); return; }
    setLoading(true);
    fetch(`/api/assets/${asset.id}/workorders`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setWorkOrders(d))
      .catch(() => setWorkOrders([]))
      .finally(() => setLoading(false));
  }, [open, asset?.id]);

  if (!asset) return null;

  const status = ASSET_STATUS[asset.status as AssetStatus];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-l border-border/60 p-0 overflow-y-auto"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border/50 shrink-0">
            <SheetHeader>
              <div className="flex items-start gap-3 pr-6">
                {/* Photo thumbnail if available */}
                {asset.photoUrl ? (
                  <div className="h-10 w-10 rounded-xl shrink-0 overflow-hidden border border-border/40">
                    <img
                      src={asset.photoUrl}
                      alt={asset.name}
                      className="h-full w-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: `${status?.color}15` }}>
                    <Wrench className="h-5 w-5" style={{ color: status?.color }} strokeWidth={1.5} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-base font-semibold leading-tight text-foreground">
                    {asset.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status?.bg}`}>
                      {status?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{asset.category}</span>
                    {asset.siteName && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                        <Building2 className="h-3 w-3" strokeWidth={1.5} />
                        {asset.siteName}
                      </span>
                    )}
                    {asset.zoneName && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70">
                        <MapPin className="h-3 w-3" strokeWidth={1.5} />
                        {asset.zoneName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Photo full display */}
            {asset.photoUrl && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Photo</p>
                <div className="rounded-xl overflow-hidden border border-border/40 bg-background/50">
                  <img
                    src={asset.photoUrl}
                    alt={asset.name}
                    className="w-full max-h-52 object-cover"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              </div>
            )}

            {/* KPI row */}
            <div className="flex gap-3">
              <KpiPill
                label="Disponibilité"
                value={asset.availabilityRate != null ? `${asset.availabilityRate.toFixed(1)}%` : "—"}
                color={
                  asset.availabilityRate >= 95 ? "#22C55E" :
                  asset.availabilityRate >= 85 ? "#F59E0B" : "#EF4444"
                }
              />
              <KpiPill
                label="MTBF"
                value={asset.mtbf != null ? `${asset.mtbf}h` : "—"}
                color="#0A6DFF"
              />
              <KpiPill
                label="MTTR"
                value={asset.mttr != null ? `${asset.mttr}h` : "—"}
                color="#F59E0B"
              />
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations</p>
              <div className="bg-background/50 border border-border/40 rounded-xl px-4">
                <InfoRow icon={Hash} label="N° de série" value={asset.serialNumber} />
                <InfoRow icon={MapPin} label="Localisation" value={asset.location} />
                {asset.siteName && <InfoRow icon={Building2} label="Site" value={asset.siteName} />}
                {asset.zoneName && <InfoRow icon={MapPin} label="Zone" value={asset.zoneName} />}
                <InfoRow icon={Factory} label="Fabricant" value={asset.manufacturer} />
                <InfoRow icon={Tag} label="Modèle" value={asset.model} />
                <InfoRow icon={Calendar} label="Date d'installation" value={
                  asset.installDate ? new Date(asset.installDate).toLocaleDateString("fr-DZ") : undefined
                } />
                <InfoRow icon={Clock} label="Dernière maintenance" value={
                  asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString("fr-DZ") : undefined
                } />
                <InfoRow icon={Layers} label="Criticité" value={
                  { low: "Faible", medium: "Moyenne", high: "Élevée", critical: "Critique" }[asset.criticality as string]
                } valueClass={
                  asset.criticality === "critical" ? "text-red-400" :
                  asset.criticality === "high" ? "text-orange-400" :
                  asset.criticality === "medium" ? "text-yellow-400" : ""
                } />
              </div>
            </div>

            {/* Machine parts catalog */}
            <MachinePartsSection assetId={asset.id} />

            {/* Work order history */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Historique des interventions {workOrders.length > 0 ? `(${workOrders.length})` : ""}
              </p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : workOrders.length > 0 ? (
                <div className="space-y-2">
                  {workOrders.map((wo, idx) => {
                    const woStatus = WO_STATUS[wo.status as WOStatus];
                    const woPriority = PRIORITY[wo.priority as WOPriority];
                    return (
                      <motion.div
                        key={wo.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-background/50 border border-border/40 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground leading-snug truncate">{wo.title}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${woStatus?.bg}`}>
                                {woStatus?.label}
                              </span>
                              {woPriority && (
                                <span className="text-xs font-semibold" style={{ color: woPriority.color }}>
                                  {woPriority.label}
                                </span>
                              )}
                              {wo.technicianName && (
                                <span className="text-xs text-muted-foreground">{wo.technicianName}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0 text-right">
                            {wo.scheduledDate
                              ? new Date(wo.scheduledDate).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })
                              : new Date(wo.createdAt).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground border border-border/30 rounded-xl bg-background/30">
                  <Wrench className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/30" strokeWidth={1} />
                  Aucune intervention enregistrée
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 shrink-0">
            <Button variant="outline" className="w-full" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
