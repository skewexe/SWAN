import { motion } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  Wrench, MapPin, Calendar, Tag, BarChart2, Clock, AlertTriangle,
  CheckCircle2, Hash, Factory, Layers, Building2, ImageIcon, Package, Plus, X,
  FileText, Link as LinkIcon, Trash2, ShieldCheck, FileSearch,
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

const DOC_TYPES = [
  { value: "manual", label: "Manuel" },
  { value: "schematic", label: "Schéma" },
  { value: "certificate", label: "Certificat" },
  { value: "contract", label: "Contrat" },
  { value: "other", label: "Autre" },
];

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
        inventoryItemId: (newInventoryItemId && newInventoryItemId !== "__none__") ? Number(newInventoryItemId) : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Pièce ajoutée au catalogue" });
        queryClient.invalidateQueries({ queryKey: getGetAssetPartsQueryKey(assetId) });
        setNewPartName(""); setNewReference(""); setNewQty("1"); setNewUnit("pce"); setNewNote(""); setNewInventoryItemId("");
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
        <Button
          variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdd(v => !v); }}
          type="button"
        >
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
              onKeyDown={e => e.key === "Enter" && handleAdd()}
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
                <SelectItem value="__none__">Aucun article lié</SelectItem>
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
            <Button size="sm" className="h-7 text-xs gap-1 rounded-full" type="button" onClick={handleAdd} disabled={createPart.isPending}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Confirmer
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" type="button" onClick={() => setShowAdd(false)}>Annuler</Button>
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
                type="button"
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

function DocumentsSection({ assetId }: { assetId: number }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("manual");
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/documents`);
      if (res.ok) setDocs(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (assetId > 0) fetchDocs(); }, [assetId]);

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      toast({ title: "Nom et URL requis", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), type: newType, url: newUrl.trim(), description: newDesc }),
      });
      if (res.ok) {
        toast({ title: "Document ajouté" });
        setNewName(""); setNewType("manual"); setNewUrl(""); setNewDesc("");
        setShowAdd(false);
        fetchDocs();
      } else {
        toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
      }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (docId: number) => {
    const res = await fetch(`/api/assets/${assetId}/documents/${docId}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Document supprimé" }); fetchDocs(); }
    else toast({ title: "Erreur", variant: "destructive" });
  };

  const DOC_TYPE_ICON: Record<string, React.ComponentType<any>> = {
    manual: FileText, schematic: FileSearch, certificate: ShieldCheck, contract: FileText, other: FileText,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Documents {docs.length > 0 ? `(${docs.length})` : ""}
        </p>
        <Button
          variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary"
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdd(v => !v); }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Ajouter
        </Button>
      </div>

      {showAdd && (
        <div className="bg-background/50 border border-border/40 rounded-xl p-3 space-y-2 mb-3">
          <Input placeholder="Nom du document *" value={newName} onChange={e => setNewName(e.target.value)} className="text-xs h-8" />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input placeholder="URL ou lien *" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="text-xs h-8" />
          </div>
          <Input placeholder="Description (optionnel)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="text-xs h-8" />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs gap-1 rounded-full" type="button" onClick={handleAdd} disabled={saving}>
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Ajouter
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" type="button" onClick={() => setShowAdd(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-10 rounded-xl" />
      ) : docs.length > 0 ? (
        <div className="space-y-2">
          {docs.map((doc: any, idx: number) => {
            const DocIcon = DOC_TYPE_ICON[doc.type] || FileText;
            const typeLabel = DOC_TYPES.find(t => t.value === doc.type)?.label || doc.type;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-start gap-3 bg-background/50 border border-border/40 rounded-xl px-4 py-3"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <DocIcon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      {doc.name}
                      <LinkIcon className="h-3 w-3" strokeWidth={2} />
                    </a>
                    <span className="text-xs text-muted-foreground">{typeLabel}</span>
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(doc.uploadedAt).toLocaleDateString("fr-DZ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5 text-xs text-muted-foreground border border-border/30 rounded-xl bg-background/30">
          <FileText className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/30" strokeWidth={1} />
          Aucun document joint
        </div>
      )}
    </div>
  );
}

function WarrantySection({ asset }: { asset: any }) {
  const hasWarranty = asset.warrantyExpiry || asset.warrantyProvider;
  if (!hasWarranty) return null;

  const isExpired = asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date();
  const daysLeft = asset.warrantyExpiry
    ? Math.ceil((new Date(asset.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 60;

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Garantie</p>
      <div className={`bg-background/50 border rounded-xl px-4 py-3 space-y-2 ${
        isExpired ? "border-red-500/30" : isExpiringSoon ? "border-amber-500/30" : "border-border/40"
      }`}>
        {asset.warrantyProvider && (
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${isExpired ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-green-400"}`} strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">{asset.warrantyProvider}</span>
          </div>
        )}
        {asset.warrantyExpiry && (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Expire le :</span>
            <span className={`text-xs font-semibold ${isExpired ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-green-400"}`}>
              {new Date(asset.warrantyExpiry).toLocaleDateString("fr-DZ")}
            </span>
            {isExpired && <span className="text-xs text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded-full">Expirée</span>}
            {isExpiringSoon && <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded-full">Expire dans {daysLeft}j</span>}
            {!isExpired && !isExpiringSoon && daysLeft !== null && <span className="text-xs text-green-400 font-medium bg-green-500/10 px-1.5 py-0.5 rounded-full">Active</span>}
          </div>
        )}
        {asset.warrantyNotes && (
          <p className="text-xs text-muted-foreground italic border-t border-border/20 pt-2">{asset.warrantyNotes}</p>
        )}
      </div>
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
        className="w-full sm:max-w-lg bg-card border-l border-border/60 p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 shrink-0">
          <SheetHeader>
            <div className="flex items-start gap-3 pr-6">
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

          {/* Photo */}
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
            <KpiPill label="MTBF" value={asset.mtbf != null ? `${asset.mtbf}h` : "—"} color="#0A6DFF" />
            <KpiPill label="MTTR" value={asset.mttr != null ? `${asset.mttr}h` : "—"} color="#F59E0B" />
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations</p>
            <div className="bg-background/50 border border-border/40 rounded-xl px-4">
              <InfoRow icon={Hash} label="N° de série" value={asset.serialNumber} />
              <InfoRow icon={MapPin} label="Localisation" value={asset.location} />
              {asset.siteName && <InfoRow icon={Building2} label="Site" value={asset.siteName} />}
              {asset.zoneName && <InfoRow icon={MapPin} label="Zone" value={asset.zoneName} />}
              {asset.parentName && <InfoRow icon={Layers} label="Équipement parent" value={asset.parentName} />}
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

          {/* Warranty */}
          <WarrantySection asset={asset} />

          {/* Machine parts catalog */}
          <MachinePartsSection assetId={asset.id} />

          {/* Documents */}
          <DocumentsSection assetId={asset.id} />

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
          <Button variant="outline" className="w-full" type="button" onClick={onClose}>Fermer</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
