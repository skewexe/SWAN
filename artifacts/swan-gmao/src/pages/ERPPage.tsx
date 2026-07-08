import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Layers, Plus, Pencil, Trash2, Zap, RefreshCw,
  CheckCircle2, XCircle, Clock, Wifi, WifiOff, AlertCircle,
  Building2, Database, PlugZap,
} from "lucide-react";

const API = "/api";

const ERP_TYPES = [
  { value: "sap", label: "SAP S/4HANA", logo: "SAP" },
  { value: "oracle", label: "Oracle ERP Cloud", logo: "ORC" },
  { value: "odoo", label: "Odoo (Community / Enterprise)", logo: "ODO" },
  { value: "sage", label: "Sage X3 / Sage 100", logo: "SGE" },
  { value: "dynamics", label: "Microsoft Dynamics 365", logo: "D365" },
  { value: "openbravo", label: "Openbravo ERP", logo: "OBR" },
  { value: "dolibarr", label: "Dolibarr ERP", logo: "DOL" },
  { value: "custom", label: "ERP personnalisé (REST API)", logo: "API" },
];

const AUTH_TYPES = [
  { value: "api_key", label: "Clé API (Bearer Token)" },
  { value: "basic", label: "Basic Auth (user/mot de passe)" },
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "none", label: "Aucune authentification" },
];

const SYNC_MODES = [
  { value: "pull", label: "Pull — SWAN importe depuis l'ERP" },
  { value: "push", label: "Push — SWAN exporte vers l'ERP" },
  { value: "bidirectional", label: "Bidirectionnel" },
];

const SYNC_ENTITIES = [
  { value: "assets", label: "Équipements & actifs" },
  { value: "inventory", label: "Stock & pièces de rechange" },
  { value: "workorders", label: "Ordres de travail" },
  { value: "technicians", label: "Personnel & techniciens" },
  { value: "costs", label: "Coûts & comptabilité" },
];

interface ErpConnection {
  id: number;
  name: string;
  erpType: string;
  url: string;
  apiKey: string | null;
  authType: string;
  username: string | null;
  syncMode: string;
  syncEntities: string[] | null;
  status: string;
  enabled: boolean;
  lastSync: string | null;
  lastError: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return (
    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 rounded-full text-[10px] gap-1">
      <CheckCircle2 className="h-2.5 w-2.5" /> Actif
    </Badge>
  );
  if (status === "error") return (
    <Badge className="bg-red-500/15 text-red-400 border-red-500/20 rounded-full text-[10px] gap-1">
      <XCircle className="h-2.5 w-2.5" /> Erreur
    </Badge>
  );
  if (status === "testing") return (
    <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 rounded-full text-[10px] gap-1">
      <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Test…
    </Badge>
  );
  return (
    <Badge className="bg-muted/40 text-muted-foreground border-border/40 rounded-full text-[10px] gap-1">
      <WifiOff className="h-2.5 w-2.5" /> Inactif
    </Badge>
  );
}

function ErpTypeLogo({ erpType }: { erpType: string }) {
  const found = ERP_TYPES.find(e => e.value === erpType);
  return (
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black tracking-tight shrink-0">
      {found?.logo ?? "ERP"}
    </div>
  );
}

const emptyForm = {
  name: "", erpType: "", url: "", apiKey: "", authType: "api_key",
  username: "", password: "", syncMode: "pull", syncEntities: [] as string[],
};

export default function ERPPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editConn, setEditConn] = useState<ErpConnection | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const { data: connections = [], isLoading } = useQuery<ErpConnection[]>({
    queryKey: ["/api/erp/connections"],
    queryFn: () => fetch(`${API}/erp/connections`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const activeCount = connections.filter(c => c.status === "active").length;
  const errorCount = connections.filter(c => c.status === "error").length;

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await fetch(`${API}/erp/connections/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) toast({ title: "Connexion réussie", description: "L'ERP répond correctement." });
      else toast({ title: "Connexion échouée", description: data.error, variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["/api/erp/connections"] });
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await fetch(`${API}/erp/connections/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (data.success) toast({ title: "Synchronisation déclenchée", description: data.message });
      else toast({ title: "Erreur synchronisation", description: data.error, variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["/api/erp/connections"] });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette connexion ERP ?")) return;
    await fetch(`${API}/erp/connections/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["/api/erp/connections"] });
    toast({ title: "Connexion supprimée" });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">
            Intégrations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-primary" />
            Intégration ERP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connectez SWAN à votre ERP (SAP, Oracle, Odoo, Sage…) pour synchroniser équipements, stock et OTs.
          </p>
        </div>
        <Button
          className="rounded-full gap-2"
          onClick={() => { setEditConn(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle connexion
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Connexions totales", value: connections.length, icon: PlugZap, color: "text-primary" },
          { label: "Connexions actives", value: activeCount, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "En erreur", value: errorCount, icon: AlertCircle, color: "text-red-400" },
          {
            label: "Dernière synchro",
            value: connections.find(c => c.lastSync) ? new Date(connections.find(c => c.lastSync)!.lastSync!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—",
            icon: Clock,
            color: "text-muted-foreground",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card border border-border/40 p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              {kpi.label}
            </div>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ERP info banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Database className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Synchronisation des données :</span>{" "}
          SWAN peut importer les équipements, articles de stock et ordres de travail depuis votre ERP, ou y exporter les données de maintenance.
          Les correspondances de champs sont configurables par connexion. Vos données restent sur votre infrastructure.
        </div>
      </div>

      {/* Connections list */}
      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">Chargement…</div>
      )}
      {!isLoading && connections.length === 0 && (
        <div className="text-center py-20 rounded-3xl border border-border/40 bg-card/40">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Aucune connexion ERP configurée</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Ajoutez votre premier ERP pour commencer la synchronisation.</p>
          <Button className="mt-5 rounded-full gap-2" onClick={() => { setEditConn(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Ajouter un ERP
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((conn, idx) => {
          const erp = ERP_TYPES.find(e => e.value === conn.erpType);
          return (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-3xl bg-card border border-border/40 p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <ErpTypeLogo erpType={conn.erpType} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{conn.name}</span>
                    <StatusBadge status={conn.status} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{erp?.label ?? conn.erpType}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{conn.url}</div>
                </div>
              </div>

              {/* Sync entities */}
              {conn.syncEntities && conn.syncEntities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {conn.syncEntities.map(e => {
                    const label = SYNC_ENTITIES.find(s => s.value === e)?.label ?? e;
                    return (
                      <span key={e} className="text-[10px] bg-muted/30 text-muted-foreground rounded-full px-2 py-0.5 border border-border/30">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Last sync */}
              {conn.lastSync && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  Dernière synchro : {new Date(conn.lastSync).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              )}
              {conn.lastError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 mb-3">
                  {conn.lastError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  className="flex-1 h-8 text-xs rounded-xl gap-1"
                  disabled={testingId === conn.id}
                  onClick={() => handleTest(conn.id)}
                >
                  {testingId === conn.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wifi className="h-3 w-3" />
                  )}
                  Tester
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="flex-1 h-8 text-xs rounded-xl gap-1"
                  disabled={syncingId === conn.id}
                  onClick={() => handleSync(conn.id)}
                >
                  {syncingId === conn.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                  Synchro
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 rounded-xl"
                  onClick={() => { setEditConn(conn); setShowForm(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDelete(conn.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Form Dialog */}
      <ConnectionFormDialog
        key={showForm ? `erp-${editConn?.id ?? "new"}` : "closed"}
        open={showForm}
        onClose={() => setShowForm(false)}
        initial={editConn}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["/api/erp/connections"] });
          setShowForm(false);
          toast({ title: editConn ? "Connexion mise à jour" : "Connexion créée" });
        }}
      />
    </div>
  );
}

function ConnectionFormDialog({
  open, onClose, initial, onSaved,
}: {
  open: boolean; onClose: () => void; initial: ErpConnection | null; onSaved: () => void;
}) {
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    erpType: initial?.erpType ?? "",
    url: initial?.url ?? "",
    apiKey: "",
    authType: initial?.authType ?? "api_key",
    username: initial?.username ?? "",
    password: "",
    syncMode: initial?.syncMode ?? "pull",
    syncEntities: initial?.syncEntities ?? [],
  }));

  const toggleEntity = (val: string) => {
    setForm(f => ({
      ...f,
      syncEntities: f.syncEntities.includes(val)
        ? f.syncEntities.filter(e => e !== val)
        : [...f.syncEntities, val],
    }));
  };

  const save = async () => {
    const method = initial ? "PUT" : "POST";
    const url = initial ? `${API}/erp/connections/${initial.id}` : `${API}/erp/connections`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) onSaved();
    else {
      const d = await res.json();
      alert(d.error ?? "Erreur");
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la connexion ERP" : "Nouvelle connexion ERP"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pb-2">
          <div>
            <Label>Nom de la connexion *</Label>
            <Input className="rounded-xl" placeholder="SAP Production" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Type d'ERP *</Label>
            <Select value={form.erpType} onValueChange={v => setForm(f => ({ ...f, erpType: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner un ERP" /></SelectTrigger>
              <SelectContent>
                {ERP_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>URL de l'API *</Label>
            <Input className="rounded-xl" placeholder="https://erp.example.com/api/v1" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <Label>Authentification</Label>
            <Select value={form.authType} onValueChange={v => setForm(f => ({ ...f, authType: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(form.authType === "api_key" || form.authType === "oauth2") && (
            <div>
              <Label>Clé API / Token</Label>
              <Input className="rounded-xl" type="password" placeholder="sk-…" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} />
            </div>
          )}
          {form.authType === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Utilisateur</Label>
                <Input className="rounded-xl" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <Label>Mot de passe</Label>
                <Input className="rounded-xl" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <Label>Mode de synchronisation</Label>
            <Select value={form.syncMode} onValueChange={v => setForm(f => ({ ...f, syncMode: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYNC_MODES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Entités à synchroniser</Label>
            <div className="flex flex-wrap gap-2">
              {SYNC_ENTITIES.map(e => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => toggleEntity(e.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.syncEntities.includes(e.value)
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Annuler</Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={!form.name || !form.erpType || !form.url}
              onClick={save}
            >
              {initial ? "Enregistrer" : "Créer la connexion"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
