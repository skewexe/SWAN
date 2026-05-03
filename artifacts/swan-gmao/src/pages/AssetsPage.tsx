import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  useGetAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  useGetSites, useGetZones,
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
  FileSpreadsheet, Download, CheckCircle2, X, Wrench, Layers, Trash,
  ImageIcon, Building2, MapPin, QrCode,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useRBAC } from "@/context/RBACContext";
import { Link } from "wouter";
import { QRCodeDialog } from "@/components/QRCodeDialog";

type AssetStatus = "operational" | "maintenance" | "breakdown" | "decommissioned";
type AssetCriticality = "low" | "medium" | "high" | "critical";

const STATUS_LABELS: Record<AssetStatus, { label: string; className: string }> = {
  operational:   { label: "Opérationnel",   className: "bg-green-500/10 text-green-400 border-green-500/30" },
  maintenance:   { label: "En maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  breakdown:     { label: "En panne",       className: "bg-red-500/10 text-red-400 border-red-500/30" },
  decommissioned:{ label: "Hors service",   className: "bg-muted text-muted-foreground border-border" },
};

const CRITICALITY_LABELS: Record<AssetCriticality, { label: string; className: string }> = {
  low:      { label: "Faible",   className: "text-muted-foreground" },
  medium:   { label: "Moyenne",  className: "text-yellow-400" },
  high:     { label: "Élevée",   className: "text-orange-400" },
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
  siteId?: number;
  zoneId?: number;
  photoUrl?: string;
}

const CSV_COLUMNS = [
  { key: "name",         label: "Nom",                required: true },
  { key: "category",     label: "Catégorie",          required: true },
  { key: "serialNumber", label: "N° de série",        required: false },
  { key: "location",     label: "Localisation",       required: false },
  { key: "status",       label: "Statut",             required: false },
  { key: "manufacturer", label: "Fabricant",          required: false },
  { key: "model",        label: "Modèle",             required: false },
  { key: "criticality",  label: "Criticité",          required: false },
  { key: "installDate",  label: "Date installation",  required: false },
];

function parseCSVText(text: string): Record<string, string>[] {
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

function parseXLSX(buffer: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return rows.map(r => {
    const out: Record<string, string> = {};
    for (const k in r) out[k] = String(r[k]);
    return out;
  });
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
    location:     row["location"] || row["Localisation"] || undefined,
    status,
    manufacturer: row["manufacturer"] || row["Fabricant"] || undefined,
    model:        row["model"] || row["Modèle"] || undefined,
    installDate:  row["installDate"] || row["Date installation"] || undefined,
    criticality,
  };
}

// ── Multi-Type Bulk Creation ──────────────────────────────────────────────────

interface MachineType {
  id: number;
  prefix: string;
  category: string;
  count: number;
  serialPrefix: string;
  location: string;
  manufacturer: string;
  model: string;
  status: AssetStatus;
  criticality: AssetCriticality;
  color: string;
}

const TYPE_COLORS = ["#0A6DFF","#22C55E","#F59E0B","#EF4444","#8B5CF6","#38BDF8","#EC4899","#84CC16"];

function emptyType(id: number): MachineType {
  return {
    id,
    prefix: `Type ${String.fromCharCode(64 + id)}`,
    category: "Équipement",
    count: 5,
    serialPrefix: `T${id}`,
    location: "",
    manufacturer: "",
    model: "",
    status: "operational",
    criticality: "medium",
    color: TYPE_COLORS[(id - 1) % TYPE_COLORS.length],
  };
}

function BulkTypesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [types, setTypes] = useState<MachineType[]>([emptyType(1), emptyType(2)]);
  const [progress, setProgress] = useState(0);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [currentType, setCurrentType] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAsset = useCreateAsset();

  const totalCount = types.reduce((s, t) => s + t.count, 0);

  const addType = () => setTypes(prev => [...prev, emptyType(prev.length + 1)]);
  const removeType = (id: number) => setTypes(prev => prev.filter(t => t.id !== id));
  const updateType = (id: number, patch: Partial<MachineType>) =>
    setTypes(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const handleCreate = async () => {
    setCreating(true);
    setProgress(0);
    let created = 0;
    let total = totalCount;
    let done_count = 0;

    for (const type of types) {
      setCurrentType(type.prefix);
      for (let i = 1; i <= type.count; i++) {
        const pad = (n: number) => String(n).padStart(3, "0");
        await new Promise<void>((resolve) => {
          createAsset.mutate({
            data: {
              name: `${type.prefix}-${pad(i)}`,
              category: type.category,
              serialNumber: `${type.serialPrefix}-${String(i).padStart(4, "0")}`,
              location: type.location || undefined,
              status: type.status,
              criticality: type.criticality,
              manufacturer: type.manufacturer || undefined,
              model: type.model || undefined,
            }
          }, {
            onSuccess: () => { created++; resolve(); },
            onError: () => resolve(),
          });
        });
        done_count++;
        setProgress(Math.round((done_count / total) * 100));
      }
    }

    await queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    setCreating(false);
    setDone(true);
    toast({ title: `${created} équipements créés (${types.length} types)` });
    setTimeout(() => {
      setDone(false); setProgress(0); setCurrentType("");
      setTypes([emptyType(1), emptyType(2)]);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (creating) return;
    setTypes([emptyType(1), emptyType(2)]);
    setProgress(0); setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Création par types d'équipements
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Définissez plusieurs types de machines et créez-les tous en une seule opération.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mt-2 pr-1">
          {types.map((type, idx) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="border border-border/50 rounded-xl p-4 bg-background/40"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full shrink-0"
                    style={{ background: type.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">{type.prefix}</span>
                  <span className="text-xs text-muted-foreground">— {type.count} machine(s)</span>
                </div>
                <button
                  onClick={() => removeType(type.id)}
                  disabled={types.length <= 1}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <Trash className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Préfixe nom *</label>
                  <Input
                    value={type.prefix}
                    onChange={e => updateType(type.id, { prefix: e.target.value })}
                    placeholder="Machine A"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Quantité *</label>
                  <Input
                    type="number" min={1} max={200}
                    value={type.count}
                    onChange={e => updateType(type.id, { count: Math.max(1, Math.min(200, Number(e.target.value))) })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Catégorie *</label>
                  <Input
                    value={type.category}
                    onChange={e => updateType(type.id, { category: e.target.value })}
                    placeholder="Compresseur"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Préfixe N° série</label>
                  <Input
                    value={type.serialPrefix}
                    onChange={e => updateType(type.id, { serialPrefix: e.target.value })}
                    placeholder="SN"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Localisation</label>
                  <Input
                    value={type.location}
                    onChange={e => updateType(type.id, { location: e.target.value })}
                    placeholder="Atelier A"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Fabricant</label>
                  <Input
                    value={type.manufacturer}
                    onChange={e => updateType(type.id, { manufacturer: e.target.value })}
                    placeholder="Siemens"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Statut initial</label>
                  <Select value={type.status} onValueChange={v => updateType(type.id, { status: v as AssetStatus })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Opérationnel</SelectItem>
                      <SelectItem value="maintenance">En maintenance</SelectItem>
                      <SelectItem value="breakdown">En panne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Criticité</label>
                  <Select value={type.criticality} onValueChange={v => updateType(type.id, { criticality: v as AssetCriticality })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mini-preview */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {Array.from({ length: Math.min(type.count, 4) }, (_, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full font-medium border"
                    style={{ background: type.color + "15", color: type.color, borderColor: type.color + "40" }}
                  >
                    {type.prefix}-{String(i + 1).padStart(3, "0")}
                  </span>
                ))}
                {type.count > 4 && (
                  <span className="text-xs text-muted-foreground/70">... +{type.count - 4} autres</span>
                )}
              </div>
            </motion.div>
          ))}

          <Button
            variant="outline"
            onClick={addType}
            disabled={creating}
            className="w-full gap-2 border-dashed text-muted-foreground h-9"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Ajouter un type de machine
          </Button>

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{types.length} types</span> · <span className="font-semibold text-foreground">{totalCount} équipements</span> au total
            </div>
            <div className="flex gap-1.5">
              {types.map(t => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: t.color + "20", color: t.color }}
                >
                  {t.prefix} ×{t.count}
                </span>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(creating || done) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {done ? "Terminé !" : `Création de ${currentType}... ${progress}%`}
                </span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={creating}>Annuler</Button>
          <Button
            onClick={handleCreate}
            disabled={creating || done || types.some(t => !t.prefix || !t.category)}
            className="gap-2 min-w-40"
          >
            {done ? (
              <><CheckCircle2 className="h-4 w-4 text-green-400" /> Créé !</>
            ) : creating ? (
              `Création... ${progress}%`
            ) : (
              <><Layers className="h-4 w-4" strokeWidth={1.5} /> Créer {totalCount} équipements</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import Dialog (CSV + Excel) ───────────────────────────────────────────────

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  const processRows = (parsed: Record<string, string>[]) => {
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

  const handleFile = (file: File) => {
    setFileName(file.name);
    const isExcel = file.name.match(/\.xlsx?$/i);

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result as ArrayBuffer;
        const parsed = parseXLSX(buf);
        processRows(parsed);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSVText(text);
        processRows(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.(csv|txt|xlsx|xls)$/i)) handleFile(file);
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
    const ws = XLSX.utils.aoa_to_sheet([
      ["name","category","serialNumber","location","status","manufacturer","model","criticality","installDate"],
      ["Compresseur A-001","Compresseur","CA-0001","Atelier A - Zone 1","operational","Atlas Copco","GA37","medium","2024-01-15"],
      ["Pompe B-001","Pompe","PB-0001","Zone Nord","operational","KSB","Mega","high","2023-06-20"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipements");
    XLSX.writeFile(wb, "template_equipements.xlsx");
  };

  const resetDialog = () => {
    if (importing) return;
    setRows([]); setFileName(""); setProgress(0); setDone(false); setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Importation CSV / Excel
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 flex-1 overflow-y-auto">
          {/* Template download */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">
              Téléchargez le modèle Excel pour un import correct
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs h-7">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              Modèle Excel
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
                <div className="text-sm font-medium text-foreground flex items-center gap-2 justify-center">
                  <FileSpreadsheet className="h-4 w-4 text-green-400" strokeWidth={1.5} />
                  {fileName}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{rawCount} lignes trouvées · {rows.length} valides · {errors.length} ignorées</div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium text-foreground mb-1">Glisser-déposer ou cliquer</div>
                <div className="text-xs text-muted-foreground">Formats acceptés : CSV, Excel (.xlsx, .xls)</div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
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
                <span className="font-medium text-red-400">{errors.length} lignes ignorées</span> (nom ou catégorie manquants) : lignes {errors.slice(0, 5).join(", ")}{errors.length > 5 ? "..." : ""}
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
          <Button variant="outline" onClick={resetDialog} disabled={importing}>Annuler</Button>
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
  const [importOpen, setImportOpen] = useState(false);
  const [qrAsset, setQrAsset] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isReadOnly } = useRBAC();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const qrId = sp.get("qr");
    if (qrId) {
      fetch(`/api/assets/${qrId}`)
        .then(r => r.ok ? r.json() : null)
        .then(a => { if (a) setDetailAsset(a); })
        .catch(() => {});
    }
  }, []);

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

  const { data: sites } = useGetSites();
  const { data: zones } = useGetZones({});

  const form = useForm<AssetFormData>({
    defaultValues: { name: "", category: "", status: "operational", criticality: "medium" }
  });

  const watchedSiteId = form.watch("siteId");
  const filteredZones = zones?.filter(z => !watchedSiteId || z.siteId === watchedSiteId) ?? [];

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
      siteId: asset.siteId, zoneId: asset.zoneId, photoUrl: asset.photoUrl,
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Parc matériel & pièces</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Équipements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion du parc, des pièces, des emplacements et de l’historique complet
            {assets ? <span className="ml-1.5 text-muted-foreground/60">— {assets.length} équipements</span> : null}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5 text-xs rounded-full">
              <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.5} />
              Import CSV / Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5 text-xs rounded-full">
              <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
              Création par types
            </Button>
            <Button onClick={openCreate} className="gap-2 rounded-full" size="sm" data-testid="button-create-asset">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Nouvel équipement
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/workorders">
          <button className="w-full text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/30 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">GMAO</div>
          <div className="text-sm text-foreground">Équipements, composants, nomenclatures et traçabilité.</div>
          </button>
        </Link>
        <button onClick={() => setBulkOpen(true)} className="text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/30 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Stocks</div>
          <div className="text-sm text-foreground">Pièces de rechange, seuils, mouvements et réservations.</div>
        </button>
        <button onClick={() => setImportOpen(true)} className="text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/30 transition-colors">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Conformité</div>
          <div className="text-sm text-foreground">Historique, maintenance réglementaire et contrôle des actifs.</div>
        </button>
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
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Localisation / Zone</th>
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
                      <div className="flex items-center gap-3">
                        {asset.photoUrl ? (
                          <div className="h-9 w-9 rounded-xl overflow-hidden border border-border/40 shrink-0">
                            <img src={asset.photoUrl} alt={asset.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{asset.name.slice(0, 2).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{asset.name}</div>
                          {asset.serialNumber && <div className="text-xs text-muted-foreground mt-0.5">{asset.serialNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{asset.category}</td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex flex-col gap-0.5">
                        {asset.location && <span className="text-muted-foreground">{asset.location}</span>}
                        {(asset as any).siteName && (
                          <span className="flex items-center gap-1 text-muted-foreground/70">
                            <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                            {(asset as any).siteName}
                          </span>
                        )}
                        {(asset as any).zoneName && (
                          <span className="flex items-center gap-1 text-muted-foreground/70">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                            {(asset as any).zoneName}
                          </span>
                        )}
                        {!asset.location && !(asset as any).siteName && !(asset as any).zoneName && <span className="text-muted-foreground/40">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-xs font-medium ${crit.className}`}>{crit.label}</td>
                    <td className="px-4 py-4">
                      {(asset as any).availabilityRate != null ? (
                        <span className={`text-sm font-semibold ${
                          (asset as any).availabilityRate >= 95 ? "text-green-400" :
                          (asset as any).availabilityRate >= 85 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {(asset as any).availabilityRate.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setQrAsset(asset)}
                          title="Code QR"
                          data-testid={`button-qr-asset-${asset.id}`}
                        >
                          <QrCode className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        {!isReadOnly && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(asset)} data-testid={`button-edit-asset-${asset.id}`}>
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(asset)} data-testid={`button-delete-asset-${asset.id}`}>
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Wrench className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1} />
                    <div className="text-sm font-medium">Aucun équipement trouvé</div>
                    <div className="text-xs mt-1 text-muted-foreground/60">Créez des équipements ou importez un fichier CSV/Excel</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      <AssetDetailSheet asset={detailAsset} open={!!detailAsset} onClose={() => setDetailAsset(null)} />
      <QRCodeDialog asset={qrAsset} open={!!qrAsset} onClose={() => setQrAsset(null)} />
      <BulkTypesDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

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
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <FormControl><Input data-testid="input-asset-location" placeholder="Ex: Atelier A - Zone 2" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="manufacturer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricant</FormLabel>
                    <FormControl><Input data-testid="input-asset-manufacturer" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl><Input data-testid="input-asset-model" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="installDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'installation</FormLabel>
                    <FormControl><Input type="date" data-testid="input-asset-installdate" {...field} /></FormControl>
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
                <FormField control={form.control} name="siteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => {
                      field.onChange(v !== "none" ? Number(v) : undefined);
                      form.setValue("zoneId", undefined);
                    }}>
                      <SelectTrigger data-testid="select-asset-site"><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun site</SelectItem>
                        {sites?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="zoneId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v !== "none" ? Number(v) : undefined)}>
                      <SelectTrigger data-testid="select-asset-zone"><SelectValue placeholder="Aucune zone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune zone</SelectItem>
                        {filteredZones.map(z => <SelectItem key={z.id} value={z.id.toString()}>{z.name}{z.siteName ? ` (${z.siteName})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="photoUrl" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      Photo (URL ou données)
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          data-testid="input-asset-photo"
                          placeholder="https://... ou glisser-déposer une image"
                          {...field}
                          value={field.value ?? ""}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="asset-photo-upload"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => field.onChange(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                        <label htmlFor="asset-photo-upload">
                          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-7 cursor-pointer" asChild>
                            <span><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />Choisir une photo</span>
                          </Button>
                        </label>
                        {field.value && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/40">
                            <img src={field.value} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
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
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> définitivement ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteAsset.isPending} data-testid="button-confirm-delete-asset">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
