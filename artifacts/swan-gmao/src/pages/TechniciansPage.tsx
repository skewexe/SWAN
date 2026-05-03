import { useState } from "react";
import { motion } from "framer-motion";
import {
  useGetTechnicians, useCreateTechnician, useUpdateTechnician, useDeleteTechnician,
  getGetTechniciansQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertTriangle, Star, Briefcase, KeyRound, Eye, EyeOff, CheckCircle2, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useRBAC } from "@/context/RBACContext";
import { useAuth } from "@/context/AuthContext";

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  available: { label: "Disponible", dot: "bg-green-400" },
  busy: { label: "Occupé", dot: "bg-yellow-400" },
  off: { label: "Absent", dot: "bg-muted-foreground" },
  leave: { label: "En congé", dot: "bg-blue-400" },
};

interface TechFormData {
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  skills?: string;
  status: "available" | "busy" | "off" | "leave";
}

interface PwDialogState {
  techName: string;
  techEmail: string;
  techRole?: string;
  techId?: number;
}

export default function TechniciansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTech, setEditTech] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [pwDialog, setPwDialog] = useState<PwDialogState | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: rbacUser } = useRBAC();
  const { setPasswordForUser, allUsers, refreshUsers } = useAuth();
  const isAdmin = rbacUser.role === "admin";

  const { data: technicians, isLoading } = useGetTechnicians();
  const createTech = useCreateTechnician();
  const updateTech = useUpdateTechnician();
  const deleteTech = useDeleteTechnician();

  const form = useForm<TechFormData>({
    defaultValues: { name: "", email: "", specialization: "", status: "available" }
  });

  const openCreate = () => {
    setEditTech(null);
    form.reset({ name: "", email: "", specialization: "", status: "available" });
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditTech(t);
    form.reset({
      name: t.name, email: t.email, phone: t.phone, specialization: t.specialization,
      skills: t.skills?.join(", ") || "", status: t.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: TechFormData) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetTechniciansQueryKey() });
    const body = {
      ...data,
      skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    };
    if (editTech) {
      updateTech.mutate({ id: editTech.id, data: body }, {
        onSuccess: () => { toast({ title: "Technicien mis à jour" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    } else {
      createTech.mutate({ data: body }, {
        onSuccess: () => { toast({ title: "Technicien créé" }); setDialogOpen(false); invalidate(); },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteTech.mutate({ id: deleteConfirm.id }, {
      onSuccess: () => {
        toast({ title: "Technicien supprimé" });
        setDeleteConfirm(null);
        queryClient.invalidateQueries({ queryKey: getGetTechniciansQueryKey() });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  const openPwDialog = (tech: any) => {
    setPwDialog({ techName: tech.name, techEmail: tech.email, techId: tech.id });
    setNewPw("");
    setConfirmPw("");
    setShowPw(false);
  };

  const handleSetPassword = () => {
    if (!pwDialog) return;
    if (newPw.length < 4) {
      toast({ title: "Mot de passe trop court", description: "Minimum 4 caractères.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    const result = setPasswordForUser(pwDialog.techEmail, newPw, {
      name: pwDialog.techName,
      role: "technicien",
      team: "Équipe maintenance",
      site: "Usine Centrale",
      technicianId: pwDialog.techId,
    });
    if (result.success) {
      toast({ title: "Mot de passe enregistré", description: `Compte de ${pwDialog.techName} mis à jour.` });
      setPwDialog(null);
      refreshUsers();
    } else {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
    }
  };

  const hasAccount = (email: string) => allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Ressources humaines</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Personnel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Équipe de maintenance</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-full" data-testid="button-create-tech">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Nouveau technicien
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians && technicians.length > 0 ? technicians.map((tech, idx) => {
            const status = STATUS_MAP[tech.status] || STATUS_MAP.off;
            const accountExists = hasAccount(tech.email);
            return (
              <motion.div
                key={tech.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border/60 rounded-3xl p-6 flex flex-col gap-4"
                data-testid={`card-technician-${tech.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {tech.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground leading-tight">{tech.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{tech.specialization}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${status.dot}`} />
                    <span className="text-xs text-muted-foreground">{status.label}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{tech.email}</div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {accountExists ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Compte actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                          <UserX className="h-3 w-3" />
                          Sans compte
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {tech.skills && tech.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tech.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span><span className="font-semibold text-foreground">{tech.activeWorkOrders}</span> OT actifs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span><span className="font-semibold text-foreground">{tech.avgRating?.toFixed(1) || "—"}</span>/5</span>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => openPwDialog(tech)}
                        title="Définir le mot de passe"
                      >
                        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(tech)} data-testid={`button-edit-tech-${tech.id}`}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(tech)} data-testid={`button-delete-tech-${tech.id}`}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground">Aucun technicien trouvé</div>
          )}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editTech ? "Modifier le technicien" : "Nouveau technicien"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl><Input data-testid="input-tech-name" placeholder="Ex: Karim Boudaoud" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" data-testid="input-tech-email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl><Input data-testid="input-tech-phone" placeholder="+213..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="specialization" rules={{ required: "Requis" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialisation</FormLabel>
                    <FormControl><Input data-testid="input-tech-specialization" placeholder="Ex: Mécanique industrielle" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-tech-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="busy">Occupé</SelectItem>
                        <SelectItem value="off">Absent</SelectItem>
                        <SelectItem value="leave">En congé</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Compétences (séparées par des virgules)</FormLabel>
                    <FormControl><Input data-testid="input-tech-skills" placeholder="Ex: Hydraulique, Pneumatique, Soudure" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createTech.isPending || updateTech.isPending} data-testid="button-submit-tech">
                  {editTech ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Password dialog */}
      <Dialog open={!!pwDialog} onOpenChange={() => setPwDialog(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Compte utilisateur
            </DialogTitle>
          </DialogHeader>
          {pwDialog && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground mb-0.5">Profil</div>
                <div className="font-medium text-foreground">{pwDialog.techName}</div>
                <div className="text-sm text-muted-foreground">{pwDialog.techEmail}</div>
                {hasAccount(pwDialog.techEmail) ? (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Compte existant — modification du mot de passe
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                    <KeyRound className="h-3.5 w-3.5" />
                    Création d'un nouveau compte
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      placeholder="Minimum 4 caractères"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                  <Input
                    type="password"
                    placeholder="Répéter le mot de passe"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialog(null)}>Annuler</Button>
            <Button
              onClick={handleSetPassword}
              disabled={!newPw || newPw !== confirmPw}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Enregistrer
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
              Supprimer le technicien
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Supprimer <span className="font-semibold text-foreground">"{deleteConfirm?.name}"</span> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteTech.isPending} data-testid="button-confirm-delete-tech">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
