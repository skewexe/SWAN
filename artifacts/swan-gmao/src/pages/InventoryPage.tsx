import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetInventoryItems, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem,
  getGetInventoryItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle, Search, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface ItemFormData {
  name: string;
  reference?: string;
  category?: string;
  quantity: number;
  minQuantity: number;
  unit?: string;
  location?: string;
  supplier?: string;
  unitCost?: number;
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    search: search || undefined,
    lowStock: lowStockOnly || undefined,
  };

  const { data: items, isLoading } = useGetInventoryItems(params, {
    query: { queryKey: getGetInventoryItemsQueryKey(params) }
  });

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const form = useForm<ItemFormData>({
    defaultValues: { name: "", quantity: 0, minQuantity: 0 }
  });

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", quantity: 0, minQuantity: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    form.reset({
      name: item.name, reference: item.reference, category: item.category,
      quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit,
      location: item.location, supplier: item.supplier, unitCost: item.unitCost,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: ItemFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
    if (editItem) {
      updateItem.mutate({ id: editItem.id, data }, {
        onSuccess: () => { toast({ title: "Article mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    } else {
      createItem.mutate({ data }, {
        onSuccess: () => { toast({ title: "Article créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteItem.mutate({ id: deleteConfirm.id }, {
      onSuccess: () => {
        toast({ title: "Article supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const lowStockCount = items?.filter(i => i.isLowStock).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Magasin</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock & pièces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pièces détachées et consommables</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-full" data-testid="button-create-item">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouvel article
        </Button>
      </div>

      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          data-testid="alert-low-stock"
        >
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-red-400 font-medium">
            {lowStockCount} article{lowStockCount > 1 ? "s" : ""} en dessous du stock minimum
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-400 hover:text-red-300 text-xs"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            data-testid="button-filter-low-stock"
          >
            {lowStockOnly ? "Voir tout" : "Voir seulement"}
          </Button>
        </motion.div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            data-testid="input-search-items"
            placeholder="Rechercher un article..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/60 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Article</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Référence</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Catégorie</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Stock</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Min</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Fournisseur</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Valeur</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? items.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                  data-testid={`row-item-${item.id}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.isLowStock && (
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0" strokeWidth={1.5} />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{item.name}</div>
                        {item.location && <div className="text-xs text-muted-foreground mt-0.5">{item.location}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-xs font-mono">{item.reference || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground text-xs">{item.category || "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-bold ${item.isLowStock ? "text-red-400" : "text-foreground"}`}>
                      {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit || "unités"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-xs">{item.minQuantity} {item.unit || "unités"}</td>
                  <td className="px-4 py-4 text-muted-foreground text-xs">{item.supplier || "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground text-xs">
                    {item.totalValue != null ? `${item.totalValue.toLocaleString("fr-DZ")} DA` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(item)} data-testid={`button-edit-item-${item.id}`}>
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(item)} data-testid={`button-delete-item-${item.id}`}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Aucun article trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editItem ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input data-testid="input-item-name" placeholder="Ex: Joint mécanique 50mm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence</FormLabel>
                    <FormControl><Input data-testid="input-item-reference" placeholder="Ex: JM-50-KSB" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl><Input data-testid="input-item-category" placeholder="Ex: Joints" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" rules={{ required: "Requis", min: 0 }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl><Input type="number" min="0" data-testid="input-item-quantity" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minQuantity" rules={{ required: "Requis", min: 0 }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum</FormLabel>
                    <FormControl><Input type="number" min="0" data-testid="input-item-min-quantity" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité</FormLabel>
                    <FormControl><Input data-testid="input-item-unit" placeholder="Ex: pièce, litre" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût unitaire (DA)</FormLabel>
                    <FormControl><Input type="number" step="0.01" data-testid="input-item-cost" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <FormControl><Input data-testid="input-item-location" placeholder="Ex: Rayon A-12" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl><Input data-testid="input-item-supplier" placeholder="Ex: KSB Algérie" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createItem.isPending || updateItem.isPending} data-testid="button-submit-item">
                  {editItem ? "Enregistrer" : "Créer"}
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
              Supprimer l'article
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteItem.isPending} data-testid="button-confirm-delete-item">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
