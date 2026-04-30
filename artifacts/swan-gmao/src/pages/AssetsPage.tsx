import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  getGetAssetsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
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

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
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
    defaultValues: {
      name: "", category: "", status: "operational", criticality: "medium",
    }
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
      updateAsset.mutate({ params: { id: editAsset.id }, data }, {
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
    deleteAsset.mutate({ params: { id: deleteConfirm.id } }, {
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
          <p className="text-sm text-muted-foreground mt-1">Gestion du parc matériel</p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="button-create-asset">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouvel équipement
        </Button>
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
              <tr className="border-b border-border/60">
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
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
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
                      <div className="flex items-center gap-2 justify-end">
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
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Aucun équipement trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

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

      {/* Delete Confirm Dialog */}
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
