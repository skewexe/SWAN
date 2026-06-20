import { useState, useMemo } from "react";
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
import {
  Plus, Pencil, Trash2, AlertTriangle, Search, AlertCircle,
  Package, PackageSearch, TrendingDown, Boxes, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  PieChart, Pie, Cell, Tooltip
} from "recharts";

const easeOut = "easeOut" as const;
const CHART_COLORS = ["#0A6DFF", "#38BDF8", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

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

function KpiCard({
  label, value, unit, icon: Icon, color, trend, subtitle
}: {
  label: string; value: string | number; unit?: string; icon: any;
  color: string; trend?: number; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/60 bg-background/50">
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${
            trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-muted-foreground"
          }`}>
            {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ color }}>{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allItems } = useGetInventoryItems({}, {
    query: { queryKey: getGetInventoryItemsQueryKey({}) }
  });

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
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey({}) });
    };
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
        queryClient.invalidateQueries({ queryKey: getGetInventoryItemsQueryKey({}) });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const stats = useMemo(() => {
    const all = allItems ?? [];
    const totalItems = all.length;
    const lowStockItems = all.filter(i => i.isLowStock);
    const totalValue = all.reduce((s, i) => s + (i.totalValue ?? 0), 0);
    const categories = [...new Set(all.map(i => i.category).filter(Boolean))] as string[];
    const lowStockPct = totalItems > 0 ? Math.round((lowStockItems.length / totalItems) * 100) : 0;

    const categoryData = categories.slice(0, 7).map((cat, idx) => {
      const catItems = all.filter(i => i.category === cat);
      return {
        name: cat,
        count: catItems.length,
        value: catItems.reduce((s, i) => s + (i.totalValue ?? 0), 0),
        color: CHART_COLORS[idx % CHART_COLORS.length],
      };
    }).sort((a, b) => b.count - a.count);

    const topValueItems = [...all]
      .filter(i => (i.totalValue ?? 0) > 0)
      .sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0))
      .slice(0, 6);

    return { totalItems, lowStockItems, totalValue, categories, lowStockPct, categoryData, topValueItems };
  }, [allItems]);

  const lowStockCount = (items ?? []).filter(i => i.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Magasin</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock & pièces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pièces détachées et consommables — tableau de bord magasin</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-full shrink-0" data-testid="button-create-item">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouvel article
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Articles en stock"
          value={stats.totalItems}
          icon={Package}
          color="#0A6DFF"
          trend={2}
          subtitle="références actives"
        />
        <KpiCard
          label="Valeur totale"
          value={stats.totalValue >= 1000000
            ? `${(stats.totalValue / 1000000).toFixed(1)}M`
            : stats.totalValue >= 1000
            ? `${(stats.totalValue / 1000).toFixed(0)}k`
            : stats.totalValue.toFixed(0)}
          unit="DA"
          icon={DollarSign}
          color="#22C55E"
          trend={1}
          subtitle="valorisation du stock"
        />
        <KpiCard
          label="Ruptures / Alertes"
          value={stats.lowStockItems.length}
          unit={stats.totalItems > 0 ? `(${stats.lowStockPct}%)` : ""}
          icon={TrendingDown}
          color={stats.lowStockItems.length > 0 ? "#EF4444" : "#22C55E"}
          trend={stats.lowStockItems.length > 0 ? -8 : 0}
          subtitle={stats.lowStockItems.length > 0 ? "en dessous du minimum" : "aucune alerte active"}
        />
        <KpiCard
          label="Catégories"
          value={stats.categories.length}
          icon={Boxes}
          color="#38BDF8"
          trend={0}
          subtitle="familles d'articles"
        />
      </div>

      {/* Alert banner */}
      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          data-testid="alert-low-stock"
        >
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-red-400 font-medium">
            {lowStockCount} article{lowStockCount > 1 ? "s" : ""} en dessous du stock minimum — commande recommandée
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-400 hover:text-red-300 text-xs"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            data-testid="button-filter-low-stock"
          >
            {lowStockOnly ? "Voir tout" : "Afficher seulement"}
          </Button>
        </motion.div>
      )}

      {/* Analytics Row */}
      {stats.categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Category pie */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: easeOut }}
            className="bg-card border border-border/60 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Répartition par catégorie</h3>
            <p className="text-xs text-muted-foreground mb-4">Nombre d'articles par famille</p>
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie
                  data={stats.categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {stats.categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0F1C2E] border border-border/80 rounded-xl p-3 text-xs shadow-xl">
                        <div className="font-semibold text-foreground">{payload[0]?.name}</div>
                        <div className="text-muted-foreground mt-0.5">{payload[0]?.value} articles</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
              <div className="flex-1 space-y-2">
                {stats.categoryData.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-semibold text-foreground">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top value items */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: easeOut }}
            className="bg-card border border-border/60 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Articles à plus forte valeur</h3>
            <p className="text-xs text-muted-foreground mb-4">Valorisation du stock (DA)</p>
            {stats.topValueItems.length > 0 ? (
              <div className="space-y-3">
                {stats.topValueItems.map((item, idx) => {
                  const maxVal = stats.topValueItems[0]?.totalValue ?? 1;
                  const pct = ((item.totalValue ?? 0) / maxVal) * 100;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-foreground font-medium truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0 tabular-nums">
                            {(item.totalValue ?? 0).toLocaleString("fr-DZ")} DA
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.07, ease: easeOut }}
                            style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Aucune valorisation enregistrée
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            data-testid="input-search-items"
            placeholder="Rechercher un article..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {lowStockOnly && (
          <Button variant="outline" size="sm" onClick={() => setLowStockOnly(false)} className="text-xs gap-1.5 text-red-400 border-red-500/40">
            <AlertCircle className="h-3.5 w-3.5" />
            Filtrage ruptures actif
          </Button>
        )}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border/60 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">Article</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Référence</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Catégorie</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Stock</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Fournisseur</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-4">Valeur</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? items.map((item, idx) => {
                const stockPct = item.minQuantity > 0
                  ? Math.min((item.quantity / (item.minQuantity * 2)) * 100, 100)
                  : item.quantity > 0 ? 100 : 0;
                const stockColor = item.isLowStock ? "#EF4444" : stockPct < 60 ? "#F59E0B" : "#22C55E";
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group"
                    data-testid={`row-item-${item.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.isLowStock && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" strokeWidth={1.5} />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          {item.location && <div className="text-xs text-muted-foreground mt-0.5">{item.location}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs font-mono">{item.reference || "—"}</td>
                    <td className="px-4 py-4">
                      {item.category ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {item.category}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-4 min-w-[140px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${item.isLowStock ? "text-red-400" : "text-foreground"}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {item.minQuantity} min</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stockPct}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.03, ease: easeOut }}
                            style={{ background: stockColor }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs hidden lg:table-cell">{item.supplier || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {item.totalValue != null && item.totalValue > 0
                        ? <span className="font-medium text-foreground">{item.totalValue.toLocaleString("fr-DZ")} <span className="font-normal text-muted-foreground">DA</span></span>
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(item)} data-testid={`button-edit-item-${item.id}`}>
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(item)} data-testid={`button-delete-item-${item.id}`}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <PackageSearch className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1} />
                    <p className="text-muted-foreground text-sm">Aucun article trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </motion.div>

      {/* Create/Edit dialog */}
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

      {/* Delete confirm */}
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
