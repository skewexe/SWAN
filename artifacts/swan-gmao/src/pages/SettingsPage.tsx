import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User, Bell, Shield, Building2, Plus, Pencil, Trash2,
  CheckCircle2, Save, Mail, Phone, AlertTriangle, Users
} from "lucide-react";
import { useRBAC, ROLE_META, ROLE_PERMISSIONS, RBACRole, RBACTeam } from "@/context/RBACContext";

type TabKey = "profile" | "teams" | "notifications" | "preferences";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "profile",       label: "Profil",          icon: User },
  { key: "teams",         label: "Équipes & Rôles", icon: Users },
  { key: "notifications", label: "Notifications",   icon: Bell },
  { key: "preferences",   label: "Préférences",     icon: Building2 },
];

const ROLES: { value: RBACRole; label: string; desc: string; color: string }[] = [
  { value: "admin",       label: ROLE_META.admin.label,       desc: ROLE_META.admin.desc,       color: ROLE_META.admin.color },
  { value: "manager",     label: ROLE_META.manager.label,     desc: ROLE_META.manager.desc,     color: ROLE_META.manager.color },
  { value: "chef_equipe", label: ROLE_META.chef_equipe.label, desc: ROLE_META.chef_equipe.desc, color: ROLE_META.chef_equipe.color },
  { value: "technicien",  label: ROLE_META.technicien.label,  desc: ROLE_META.technicien.desc,  color: ROLE_META.technicien.color },
  { value: "lecteur",     label: ROLE_META.lecteur.label,     desc: ROLE_META.lecteur.desc,     color: ROLE_META.lecteur.color },
];

const MODULE_PERMISSIONS: Record<RBACRole, string[]> = {
  admin:       ["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Stock & pièces", "Personnel", "Rapports", "Calendrier", "Paramètres"],
  manager:     ["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Stock & pièces", "Personnel", "Rapports", "Calendrier"],
  chef_equipe: ["Tableau de bord", "Ordres de travail", "Préventive", "Personnel", "Calendrier"],
  technicien:  ["Tableau de bord", "Ordres de travail (assignés)"],
  lecteur:     ["Tableau de bord", "Rapports (lecture)"],
};

const TEAM_COLORS = ["#0A6DFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#38BDF8"];

const ALL_MODULES = ["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Calendrier", "Stock & pièces", "Personnel", "Rapports", "Paramètres"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const { user, setUser, teams, setTeams } = useRBAC();

  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: "+213 555 123 456",
    role: user.role as string,
    site: user.site,
    company: "SWAN Industriel",
  });

  const [notifs, setNotifs] = useState({
    breakdown: true, lowStock: true, overdueWO: true,
    preventiveDue: true, newAssignment: true,
    dailyReport: false, weeklyReport: true,
    emailNotifs: true, appNotifs: true,
  });

  const [prefs, setPrefs] = useState({
    language: "fr", timezone: "Africa/Algiers",
    dateFormat: "DD/MM/YYYY", currency: "DZD",
    itemsPerPage: "25", defaultView: "dashboard",
  });

  const [teamDialog, setTeamDialog] = useState<RBACTeam | null | "new">(null);
  const [teamForm, setTeamForm] = useState({ name: "", role: "technicien" as RBACRole, site: "", color: "#0A6DFF" });
  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState<RBACTeam | null>(null);

  const handleSaveProfile = () => {
    setSaved(true);
    setUser({
      ...user,
      name: profile.name,
      email: profile.email,
      role: profile.role as RBACRole,
      site: profile.site,
      initials: profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    });
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Profil enregistré", description: "Les modifications ont été appliquées." });
  };

  const openCreateTeam = () => {
    setTeamForm({ name: "", role: "technicien", site: "", color: TEAM_COLORS[teams.length % TEAM_COLORS.length] });
    setTeamDialog("new");
  };

  const openEditTeam = (team: RBACTeam) => {
    setTeamForm({ name: team.name, role: team.role, site: team.site, color: team.color });
    setTeamDialog(team);
  };

  const saveTeam = () => {
    if (!teamForm.name) return;
    if (teamDialog === "new") {
      setTeams([...teams, {
        id: Date.now(), name: teamForm.name, role: teamForm.role,
        site: teamForm.site, memberCount: 0, color: teamForm.color,
      }]);
      toast({ title: "Équipe créée" });
    } else if (teamDialog && typeof teamDialog !== "string") {
      setTeams(teams.map(t =>
        t.id === (teamDialog as RBACTeam).id
          ? { ...t, name: teamForm.name, role: teamForm.role, site: teamForm.site, color: teamForm.color }
          : t
      ));
      toast({ title: "Équipe mise à jour" });
    }
    setTeamDialog(null);
  };

  const confirmDeleteTeam = () => {
    if (!deleteTeamConfirm) return;
    setTeams(teams.filter(t => t.id !== deleteTeamConfirm.id));
    toast({ title: "Équipe supprimée" });
    setDeleteTeamConfirm(null);
  };

  const selectedRole = ROLES.find(r => r.value === profile.role);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Administration</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuration de la plateforme SWAN</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-56 shrink-0 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors text-left ${
                activeTab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Profil utilisateur</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Informations du compte — les modifications s'appliquent en temps réel</p>
                </div>

                <div className="flex items-center gap-5">
                  <div
                    className="h-16 w-16 rounded-full border-2 flex items-center justify-center font-bold text-2xl"
                    style={{
                      background: (selectedRole?.color || "#0A6DFF") + "20",
                      borderColor: (selectedRole?.color || "#0A6DFF") + "50",
                      color: selectedRole?.color || "#0A6DFF"
                    }}
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">{profile.email}</div>
                    <div
                      className="text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block"
                      style={{ background: (selectedRole?.color || "#0A6DFF") + "20", color: selectedRole?.color || "#0A6DFF" }}
                    >
                      {selectedRole?.label || "Administrateur"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Nom complet", key: "name", icon: User },
                    { label: "Email", key: "email", icon: Mail },
                    { label: "Téléphone", key: "phone", icon: Phone },
                    { label: "Site / Usine", key: "site", icon: Building2 },
                    { label: "Entreprise", key: "company", icon: Building2 },
                  ].map(({ label, key, icon: Icon }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {label}
                      </label>
                      <Input
                        value={profile[key as keyof typeof profile]}
                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Rôle système
                    </label>
                    <Select value={profile.role} onValueChange={v => setProfile(p => ({ ...p, role: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedRole && (
                  <div className="bg-background/50 border border-border/40 rounded-xl p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Modules accessibles pour ce rôle
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(MODULE_PERMISSIONS[profile.role as RBACRole] || []).map(perm => (
                        <div
                          key={perm}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30"
                        >
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                          {perm}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="gap-2">
                    {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" strokeWidth={1.5} />}
                    {saved ? "Enregistré !" : "Enregistrer les modifications"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── TEAMS ── */}
            {activeTab === "teams" && (
              <div className="space-y-4">
                <div className="bg-card border border-border/60 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Équipes de maintenance</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Profils RBAC par équipe — chaque rôle contrôle les pages accessibles</p>
                    </div>
                    <Button onClick={openCreateTeam} size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                      Nouvelle équipe
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {teams.map((team, idx) => {
                      const role = ROLES.find(r => r.value === team.role);
                      const perms = MODULE_PERMISSIONS[team.role] || [];
                      return (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border border-border/50 rounded-xl p-4 bg-background/40"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm"
                                style={{ background: team.color + "20", color: team.color }}
                              >
                                {team.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-foreground text-sm">{team.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {team.site || "—"} · {team.memberCount} membres
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-medium px-2.5 py-1 rounded-full"
                                style={{ background: (role?.color || "#64748B") + "20", color: role?.color || "#64748B" }}
                              >
                                {role?.label || team.role}
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditTeam(team)}>
                                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTeamConfirm(team)}>
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {perms.map(p => (
                              <span key={p} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Role Matrix */}
                <div className="bg-card border border-border/60 rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-foreground mb-1">Matrice des droits</h2>
                  <p className="text-sm text-muted-foreground mb-5">Permissions par rôle — lecture seule</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Module</th>
                          {ROLES.map(r => (
                            <th key={r.value} className="text-center py-2 px-3 whitespace-nowrap" style={{ color: r.color }}>
                              {r.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_MODULES.map(module => (
                          <tr key={module} className="border-b border-border/30 last:border-0">
                            <td className="py-2 pr-4 text-foreground font-medium">{module}</td>
                            {ROLES.map(r => {
                              const has = (MODULE_PERMISSIONS[r.value] || []).some(p =>
                                p.toLowerCase().includes(module.split(" ")[0].toLowerCase())
                              );
                              return (
                                <td key={r.value} className="text-center py-2 px-3">
                                  {has ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mx-auto" strokeWidth={2} />
                                  ) : (
                                    <div className="h-3.5 w-3.5 rounded-full bg-muted/50 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Configurer les alertes et rappels</p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertes opérationnelles</div>
                  {[
                    { key: "breakdown",      label: "Pannes critiques",        desc: "Nouvelle panne signalée sur un équipement" },
                    { key: "lowStock",       label: "Stock faible",            desc: "Pièce en dessous du seuil minimum" },
                    { key: "overdueWO",      label: "OT en retard",            desc: "Ordre de travail dépassé" },
                    { key: "preventiveDue",  label: "Préventive à échéance",   desc: "Plan de maintenance dû dans 48h" },
                    { key: "newAssignment",  label: "Nouvelles affectations",  desc: "Un OT vous est assigné" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                      <Switch
                        checked={notifs[key as keyof typeof notifs] as boolean}
                        onCheckedChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rapports automatiques</div>
                  {[
                    { key: "dailyReport",   label: "Rapport quotidien",     desc: "Résumé des activités du jour à 18h00" },
                    { key: "weeklyReport",  label: "Rapport hebdomadaire",  desc: "Bilan de la semaine chaque lundi à 08h00" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                      <Switch
                        checked={notifs[key as keyof typeof notifs] as boolean}
                        onCheckedChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Canaux de notification</div>
                  {[
                    { key: "emailNotifs",  label: "Notifications email",   desc: "Envoi par email à " + profile.email },
                    { key: "appNotifs",    label: "Notifications in-app",  desc: "Alertes dans la barre de notification" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                      <Switch
                        checked={notifs[key as keyof typeof notifs] as boolean}
                        onCheckedChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast({ title: "Préférences de notification sauvegardées" })} className="gap-2">
                    <Save className="h-4 w-4" strokeWidth={1.5} />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === "preferences" && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Préférences générales</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Localisation et configuration de l'affichage</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {[
                    {
                      key: "language", label: "Langue", options: [
                        { value: "fr", label: "Français" },
                        { value: "ar", label: "العربية" },
                        { value: "en", label: "English" },
                      ]
                    },
                    {
                      key: "timezone", label: "Fuseau horaire", options: [
                        { value: "Africa/Algiers", label: "Algiers (UTC+1)" },
                        { value: "Europe/Paris",   label: "Paris (UTC+2)" },
                        { value: "UTC",            label: "UTC" },
                      ]
                    },
                    {
                      key: "dateFormat", label: "Format de date", options: [
                        { value: "DD/MM/YYYY", label: "JJ/MM/AAAA" },
                        { value: "MM/DD/YYYY", label: "MM/JJ/AAAA" },
                        { value: "YYYY-MM-DD", label: "AAAA-MM-JJ" },
                      ]
                    },
                    {
                      key: "currency", label: "Devise", options: [
                        { value: "DZD", label: "Dinar algérien (DZD)" },
                        { value: "EUR", label: "Euro (EUR)" },
                        { value: "USD", label: "Dollar US (USD)" },
                      ]
                    },
                    {
                      key: "itemsPerPage", label: "Éléments par page", options: [
                        { value: "10",  label: "10" },
                        { value: "25",  label: "25" },
                        { value: "50",  label: "50" },
                        { value: "100", label: "100" },
                      ]
                    },
                    {
                      key: "defaultView", label: "Page d'accueil", options: [
                        { value: "dashboard",  label: "Tableau de bord" },
                        { value: "workorders", label: "Ordres de travail" },
                        { value: "assets",     label: "Équipements" },
                      ]
                    },
                  ].map(({ key, label, options }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      <Select value={prefs[key as keyof typeof prefs]} onValueChange={v => setPrefs(p => ({ ...p, [key]: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground">
                    Les préférences de langue et de fuseau horaire seront appliquées lors de la prochaine connexion.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast({ title: "Préférences enregistrées" })} className="gap-2">
                    <Save className="h-4 w-4" strokeWidth={1.5} />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Team Create/Edit Dialog */}
      <Dialog open={teamDialog !== null} onOpenChange={() => setTeamDialog(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{teamDialog === "new" ? "Nouvelle équipe" : "Modifier l'équipe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nom de l'équipe</label>
              <Input
                placeholder="Ex: Équipe Électrique"
                value={teamForm.name}
                onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rôle RBAC</label>
              <Select value={teamForm.role} onValueChange={v => setTeamForm(f => ({ ...f, role: v as RBACRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <div className="font-medium" style={{ color: r.color }}>{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Site / Zone</label>
              <Input
                placeholder="Ex: Atelier A"
                value={teamForm.site}
                onChange={e => setTeamForm(f => ({ ...f, site: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Couleur de l'équipe</label>
              <div className="flex gap-2">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setTeamForm(f => ({ ...f, color: c }))}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${teamForm.color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {teamForm.role && (
              <div className="bg-background/50 border border-border/40 rounded-lg p-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Accès pour ce rôle :</div>
                <div className="flex flex-wrap gap-1.5">
                  {(MODULE_PERMISSIONS[teamForm.role] || []).map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTeamDialog(null)}>Annuler</Button>
            <Button onClick={saveTeam} disabled={!teamForm.name}>
              {teamDialog === "new" ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTeamConfirm} onOpenChange={() => setDeleteTeamConfirm(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer l'équipe
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer <span className="font-semibold text-foreground">"{deleteTeamConfirm?.name}"</span> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeamConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteTeam}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
