import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  useGetAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  getGetAssetsQueryKey
} from "@workspace/api-client-react";
import { AssetDetailSheet } from "@/components/AssetDetailSheet";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Search, Pencil, Trash2, AlertTriangle, Copy, Upload,
  FileSpreadsheet, Download, CheckCircle2, X, Wrench
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

type AssetStatus = "operational" | "maintenance" | "breakdown" | "decommissioned";
type AssetCriticality = "low" | "medium" | "high" | "critical";

const STATUS_LABELS: Record<AssetStatus, { label: string; className: string }> = {
  operational: { label: "Opérationnel", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  maintenance: { label: "En maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  breakdown: { label: "En panne", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  decommissioned: { label: "Hors service", className: "bg-muted text-muted-foreground border-border" },
};

const CRITICALITY_LABELS: Record<AssetCriticality, { label: string; className: string }> = {
  low: { label: "Faible", className: "text-muted-foreground" },
  medium: { label: "Moyenne", className: "text-yellow-400" },
  high: { label: "Élevée", className: "text-orange-400" },
  critical: { label: "Critique", className: "text-red-400" },
};

interface AssetFormData {
  name: string;
  category: string;
  serialNumber?: string;
  location?: string;
  status: AssetStatus;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  criticality: AssetCriticality;
}

// CSV column mapping
const CSV_COLUMNS = [
  { key: "name", label: "Nom", required: true },
  { key: "category", label: "Catégorie", required: true },
  { key: "serialNumber", label: "N° de série", required: false },
  { key: "location", label: "Localisation", required: false },
  { key: "status", label: "Statut", required: false },
  { key: "manufacturer", label: "Fabricant", required: false },
  { key: "model", label: "Modèle", required: false },
  { key: "criticality", label: "Criticité", required: false },
  { key: "installDate", label: "Date installation", required: false },
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

function normalizeAssetRow(row: Record<string, string>): AssetFormData | null {
  const name = row["name"] || row["Nom"] || row["NAME"] || "";
  const category = row["category"] || row["Catégorie"] || row["CATEGORY"] || "";
  if (!name || !category) return null;

  const rawStatus = (row["status"] || row["Statut"] || "operational").toLowerCase();
  const statusMap: Record<string, AssetStatus> = {
    operational: "operational", opérationnel: "operational", operationnel: "operational",
    maintenance: "maintenance", "en maintenance": "maintenance",
    breakdown: "breakdown", "en panne": "breakdown", panne: "breakdown",
    decommissioned: "decommissioned", "hors service": "decommissioned",
  };
  const status = statusMap[rawStatus] || "operational";

  const rawCrit = (row["criticality"] || row["Criticité"] || "medium").toLowerCase();
  const critMap: Record<string, AssetCriticality> = {
    low: "low", faible: "low",
    medium: "medium", moyenne: "medium", moyen: "medium",
    high: "high", élevée: "high", elevee: "high",
    critical: "critical", critique: "critical",
  };
  const criticality = critMap[rawCrit] || "medium";

  return {
    name,
    category,
    serialNumber: row["serialNumber"] || row["N° de série"] || row["serial"] || undefined,
    location: row["location"] || row["Localisation"] || undefined,
    status,
    manufacturer: row["manufacturer"] || row["Fabricant"] || undefined,
    model: row["model"] || row["Modèle"] || undefined,
    installDate: row["installDate"] || row["Date installation"] || undefined,
    criticality,
  };
}

// ── Bulk Creation Dialog ──────────────────────────────────────────────────────
function BulkCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefix, setPrefix] = useState("Machine");
  const [category, setCategory] = useState("Équipement");
  const [count, setCount] = useState(5);
  const [serialPrefix, setSerialPrefix] = useState("SN");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<AssetStatus>("operational");
  const [criticality, setCriticality] = useState<AssetCriticality>("medium");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [progress, setProgress] = useState(0);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAsset = useCreateAsset();

  const preview = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    name: `${prefix}-${String(i + 1).padStart(3, "0")}`,
    serial: `${serialPrefix}-${String(i + 1).padStart(4, "0")}`,
  }));

  const handleCreate = async () => {
    setCreating(true);
    setProgress(0);
    let created = 0;
    const pad = (n: number) => String(n).padStart(3, "0");
    for (let i = 1; i <= count; i++) {
      await new Promise<void>((resolve, reject) => {
        createAsset.mutate({
          data: {
            name: `${prefix}-${pad(i)}`,
            category,
            serialNumber: `${serialPrefix}-${String(i).padStart(4, "0")}`,
            location: location || undefined,
            status,
            criticality,
            manufacturer: manufacturer || undefined,
            model: model || undefined,
          }
        }, {
          onSuccess: () => { created++; resolve(); },
          onError: () => resolve(),
        });
      });
      setProgress(Math.round((i / count) * 100));
    }
    await queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    setCreating(false);
    setDone(true);
    toast({ title: `${created} équipements créés avec succès` });
    setTimeout(() => { setDone(false); onClose(); setProgress(0); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Création en masse d'équipements
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Préfixe du nom *</label>
              <Input placeholder="Machine A" value={prefix} onChange={e => setPrefix(e.target.value)} />
              <p className="text-xs text-muted-foreground/70">Ex: Machine A → Machine A-001</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre d'équipements *</label>
              <Input
                type="number" min={1} max={100} value={count}
                onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catégorie *</label>
              <Input placeholder="Ex: Compresseur" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Préfixe N° de série</label>
              <Input placeholder="SN" value={serialPrefix} onChange={e => setSerialPrefix(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Localisation</label>
              <Input placeholder="Ex: Atelier A" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fabricant</label>
              <Input placeholder="Ex: Siemens" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Modèle</label>
              <Input placeholder="Ex: S7-300" value={model} onChange={e => setModel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Statut initial</label>
              <Select value={status} onValueChange={v => setStatus(v as AssetStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Opérationnel</SelectItem>
                  <SelectItem value="maintenance">En maintenance</SelectItem>
                  <SelectItem value="breakdown">En panne</SelectItem>
                  <SelectItem value="decommissioned">Hors service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Criticité</label>
              <Select value={criticality} onValueChange={v => setCriticality(v as AssetCriticality)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-background/50 border border-border/40 rounded-xl p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Aperçu ({count} équipements seront créés)
            </div>
            <div className="space-y-1">
              {preview.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground w-36 truncate">{p.name}</span>
                  <span>{p.serial}</span>
                  <span className="text-muted-foreground/60">{category} · {location || "—"}</span>
                </div>
              ))}
              {count > 5 && (
                <div className="text-xs text-muted-foreground/60 pt-1">
                  ... et {count - 5} autres
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {(creating || done) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {done ? "Terminé !" : `Création en cours... ${Math.round(progress / 100 * count)}/${count}`}
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={creating}>Annuler</Button>
          <Button onClick={handleCreate} disabled={creating || done || !prefix || !category} className="gap-2 min-w-32">
            {done ? (
              <><CheckCircle2 className="h-4 w-4 text-green-400" /> Créé !</>
            ) : creating ? (
              `Création... ${progress}%`
            ) : (
              <><Copy className="h-4 w-4" strokeWidth={1.5} /> Créer {count} équipements</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── CSV Import Dialog ─────────────────────────────────────────────────────────
function CSVImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<AssetFormData[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [errors, setErrors] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAsset = useCreateAsset();

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRawCount(parsed.length);
      const normalized: AssetFormData[] = [];
      const errs: number[] = [];
      parsed.forEach((row, idx) => {
        const n = normalizeAssetRow(row);
        if (n) normalized.push(n);
        else errs.push(idx + 1);
      });
      setRows(normalized);
      setErrors(errs);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    let created = 0;
    for (let i = 0; i < rows.length; i++) {
      await new Promise<void>((resolve) => {
        createAsset.mutate({ data: rows[i] }, {
          onSuccess: () => { created++; resolve(); },
          onError: () => resolve(),
        });
      });
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    await queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    setImporting(false);
    setDone(true);
    toast({ title: `${created} équipements importés avec succès` });
    setTimeout(() => { setDone(false); onClose(); setRows([]); setFileName(""); setProgress(0); }, 1500);
  };

  const downloadTemplate = () => {
    const headers = "name,category,serialNumber,location,status,manufacturer,model,criticality,installDate";
    const example = "Compresseur A-001,Compresseur,CA-0001,Atelier A - Zone 1,operational,Atlas Copco,GA37,medium,2024-01-15";
    const blob = new Blob([headers + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template_equipements.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Importation CSV / Excel
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
          {/* Download template */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">
              Téléchargez le modèle CSV pour un import correct
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs h-7">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              Modèle CSV
            </Button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
            {fileName ? (
              <div>
                <div className="text-sm font-medium text-foreground">{fileName}</div>
                <div className="text-xs text-muted-foreground mt-1">{rawCount} lignes trouvées, {rows.length} valides</div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Glisser-déposer ou cliquer</div>
                <div className="text-xs text-muted-foreground">Fichiers CSV acceptés</div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Column reference */}
          <div className="bg-background/50 border border-border/40 rounded-xl p-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Colonnes attendues</div>
            <div className="flex flex-wrap gap-2">
              {CSV_COLUMNS.map(col => (
                <span key={col.key} className={`text-xs px-2 py-0.5 rounded-full ${
                  col.required
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {col.label} {col.required && "*"}
                </span>
              ))}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-red-400">{errors.length} lignes ignorées</span> (nom ou catégorie manquants): lignes {errors.slice(0, 5).join(", ")}{errors.length > 5 ? "..." : ""}
              </div>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Aperçu ({rows.length} équipements à importer)
              </div>
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Nom</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Catégorie</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Localisation</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Statut</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Criticité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, i) => {
                      const statusInfo = STATUS_LABELS[row.status] || STATUS_LABELS.operational;
                      const critInfo = CRITICALITY_LABELS[row.criticality] || CRITICALITY_LABELS.medium;
                      return (
                        <tr key={i} className="border-b border-border/20 last:border-0">
                          <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.category}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.location || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className={`px-3 py-2 font-medium ${critInfo.className}`}>{critInfo.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length > 8 && (
                  <div className="text-center py-2 text-xs text-muted-foreground border-t border-border/20">
                    ... et {rows.length - 8} autres lignes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {(importing || done) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {done ? "Import terminé !" : `Import en cours... ${Math.round(progress / 100 * rows.length)}/${rows.length}`}
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={importing}>Annuler</Button>
          <Button
            onClick={handleImport}
            disabled={rows.length === 0 || importing || done}
            className="gap-2 min-w-36"
          >
            {done ? (
              <><CheckCircle2 className="h-4 w-4 text-green-400" /> Importé !</>
            ) : importing ? (
              `Import... ${progress}%`
            ) : (
              <><Upload className="h-4 w-4" strokeWidth={1.5} /> Importer {rows.length} équipements</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [detailAsset, setDetailAsset] = useState<any>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const { data: assets, isLoading } = useGetAssets(params, {
    query: { queryKey: getGetAssetsQueryKey(params) }
  });

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const form = useForm<AssetFormData>({
    defaultValues: { name: "", category: "", status: "operational", criticality: "medium" }
  });

  const openCreate = () => {
    setEditAsset(null);
    form.reset({ name: "", category: "", status: "operational", criticality: "medium" });
    setDialogOpen(true);
  };

  const openEdit = (asset: any) => {
    setEditAsset(asset);
    form.reset({
      name: asset.name, category: asset.category, serialNumber: asset.serialNumber,
      location: asset.location, status: asset.status, manufacturer: asset.manufacturer,
      model: asset.model, installDate: asset.installDate, criticality: asset.criticality,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: AssetFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    if (editAsset) {
      updateAsset.mutate({ id: editAsset.id, data }, {
        onSuccess: () => { toast({ title: "Équipement mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", description: "Mise à jour échouée", variant: "destructive" }),
      });
    } else {
      createAsset.mutate({ data }, {
        onSuccess: () => { toast({ title: "Équipement créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", description: "Création échouée", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteAsset.mutate({ id: deleteConfirm.id }, {
      onSuccess: () => {
        toast({ title: "Équipement supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Équipements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion du parc matériel
            {assets ? <span className="ml-2 text-muted-foreground/60">— {assets.length} équipements</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)} className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.5} />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
            Création en masse
          </Button>
          <Button onClick={openCreate} className="gap-2" size="sm" data-testid="button-create-asset">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Nouvel équipement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            data-testid="input-search-assets"
            placeholder="Rechercher un équipement..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="operational">Opérationnel</SelectItem>
            <SelectItem value="maintenance">En maintenance</SelectItem>
            <SelectItem value="breakdown">En panne</SelectItem>
            <SelectItem value="decommissioned">Hors service</SelectItem>
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
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Équipement</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Catégorie</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Localisation</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Statut</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Criticité</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Disponibilité</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {assets && assets.length > 0 ? assets.map((asset, idx) => {
                const status = STATUS_LABELS[asset.status as AssetStatus] || { label: asset.status, className: "" };
                const crit = CRITICALITY_LABELS[asset.criticality as AssetCriticality] || { label: asset.criticality, className: "" };
                return (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setDetailAsset(asset)}
                    data-testid={`row-asset-${asset.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{asset.name}</div>
                      {asset.serialNumber && <div className="text-xs text-muted-foreground mt-0.5">{asset.serialNumber}</div>}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{asset.category}</td>
                    <td className="px-4 py-4 text-muted-foreground">{asset.location || "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-xs font-medium ${crit.className}`}>{crit.label}</td>
                    <td className="px-4 py-4">
                      {asset.availabilityRate != null ? (
                        <span className={`text-sm font-semibold ${
                          asset.availabilityRate >= 95 ? "text-green-400" :
                          asset.availabilityRate >= 85 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {asset.availabilityRate.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(asset)} data-testid={`button-edit-asset-${asset.id}`}>
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(asset)} data-testid={`button-delete-asset-${asset.id}`}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Wrench className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1} />
                    <div className="text-sm font-medium">Aucun équipement trouvé</div>
                    <div className="text-xs mt-1 text-muted-foreground/60">Créez des équipements ou importez un fichier CSV</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      <AssetDetailSheet asset={detailAsset} open={!!detailAsset} onClose={() => setDetailAsset(null)} />
      <BulkCreateDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <CSVImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editAsset ? "Modifier l'équipement" : "Nouvel équipement"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input data-testid="input-asset-name" placeholder="Ex: Compresseur d'air" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl><Input data-testid="input-asset-category" placeholder="Ex: Compresseur" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="serialNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° de série</FormLabel>
                    <FormControl><Input data-testid="input-asset-serial" placeholder="Ex: CA-2024-001" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Localisation</FormLabel>
                    <FormControl><Input data-testid="input-asset-location" placeholder="Ex: Atelier A - Zone 1" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="manufacturer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricant</FormLabel>
                    <FormControl><Input data-testid="input-asset-manufacturer" placeholder="Ex: Siemens" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl><Input data-testid="input-asset-model" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-asset-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Opérationnel</SelectItem>
                        <SelectItem value="maintenance">En maintenance</SelectItem>
                        <SelectItem value="breakdown">En panne</SelectItem>
                        <SelectItem value="decommissioned">Hors service</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="criticality" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criticité</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-asset-criticality"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="installDate" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Date d'installation</FormLabel>
                    <FormControl><Input type="date" data-testid="input-asset-install-date" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createAsset.isPending || updateAsset.isPending} data-testid="button-submit-asset">
                  {editAsset ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer l'équipement
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Voulez-vous supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteAsset.isPending} data-testid="button-confirm-delete-asset">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
