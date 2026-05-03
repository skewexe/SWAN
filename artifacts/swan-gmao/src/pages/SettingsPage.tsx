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
import { useGetTechnicians } from "@workspace/api-client-react";

type TabKey = "profile" | "teams" | "notifications" | "preferences";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "teams", label: "Équipes & Rôles", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "preferences", label: "Préférences", icon: Building2 },
];

const ROLES = [
  { value: "admin", label: "Administrateur", desc: "Accès complet à toutes les fonctionnalités", color: "#EF4444" },
  { value: "manager", label: "Responsable maintenance", desc: "Gestion des équipes, rapports et planification", color: "#F59E0B" },
  { value: "chef_equipe", label: "Chef d'équipe", desc: "Supervision des techniciens et validation des OT", color: "#0A6DFF" },
  { value: "technicien", label: "Technicien", desc: "Saisie des OT assignés uniquement", color: "#22C55E" },
  { value: "lecteur", label: "Lecteur seul", desc: "Consultation des données sans modification", color: "#64748B" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Stock & pièces", "Personnel", "Rapports", "Paramètres"],
  manager: ["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Stock & pièces", "Personnel", "Rapports"],
  chef_equipe: ["Tableau de bord", "Ordres de travail", "Préventive", "Personnel"],
  technicien: ["Tableau de bord", "Ordres de travail (assignés)"],
  lecteur: ["Tableau de bord", "Rapports (lecture)"],
};

interface Team {
  id: number;
  name: string;
  role: string;
  site: string;
  memberCount: number;
  color: string;
}

const TEAM_COLORS = ["#0A6DFF", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#38BDF8"];

const defaultTeams: Team[] = [
  { id: 1, name: "Équipe Électrique", role: "technicien", site: "Usine Centrale", memberCount: 4, color: "#0A6DFF" },
  { id: 2, name: "Équipe Mécanique", role: "technicien", site: "Atelier A", memberCount: 6, color: "#22C55E" },
  { id: 3, name: "Équipe Instrumentation", role: "chef_equipe", site: "Zone Nord", memberCount: 3, color: "#F59E0B" },
  { id: 4, name: "Supervision", role: "manager", site: "Direction", memberCount: 2, color: "#8B5CF6" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const { data: technicians = [] } = useGetTechnicians({});

  // Profile state
  const [profile, setProfile] = useState({
    name: "Admin Système",
    email: "admin@swan-gmao.dz",
    phone: "+213 555 123 456",
    role: "admin",
    site: "Usine Centrale",
    company: "SWAN Industriel",
  });

  // Notifications state
  const [notifs, setNotifs] = useState({
    breakdown: true,
    lowStock: true,
    overdueWO: true,
    preventiveDue: true,
    newAssignment: true,
    dailyReport: false,
    weeklyReport: true,
    emailNotifs: true,
    appNotifs: true,
  });

  // Preferences
  const [prefs, setPrefs] = useState({
    language: "fr",
    timezone: "Africa/Algiers",
    dateFormat: "DD/MM/YYYY",
    currency: "DZD",
    itemsPerPage: "25",
    defaultView: "dashboard",
  });

  // Teams
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [teamDialog, setTeamDialog] = useState<Team | null | "new">(null);
  const [teamForm, setTeamForm] = useState({ name: "", role: "technicien", site: "", color: "#0A6DFF" });

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Profil enregistré", description: "Vos modifications ont été sauvegardées." });
  };

  const openCreateTeam = () => {
    setTeamForm({ name: "", role: "technicien", site: "", color: TEAM_COLORS[teams.length % TEAM_COLORS.length] });
    setTeamDialog("new");
  };

  const openEditTeam = (team: Team) => {
    setTeamForm({ name: team.name, role: team.role, site: team.site, color: team.color });
    setTeamDialog(team);
  };

  const saveTeam = () => {
    if (!teamForm.name) return;
    if (teamDialog === "new") {
      setTeams(prev => [...prev, {
        id: Date.now(),
        name: teamForm.name,
        role: teamForm.role,
        site: teamForm.site,
        memberCount: 0,
        color: teamForm.color,
      }]);
      toast({ title: "Équipe créée" });
    } else if (teamDialog && typeof teamDialog !== "string") {
      setTeams(prev => prev.map(t =>
        t.id === (teamDialog as Team).id
          ? { ...t, name: teamForm.name, role: teamForm.role, site: teamForm.site, color: teamForm.color }
          : t
      ));
      toast({ title: "Équipe mise à jour" });
    }
    setTeamDialog(null);
  };

  const deleteTeam = (id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    toast({ title: "Équipe supprimée" });
  };

  const selectedRole = ROLES.find(r => r.value === profile.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuration de la plateforme SWAN</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-56 shrink-0 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
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
                  <p className="text-sm text-muted-foreground mt-0.5">Informations du compte administrateur</p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl">
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
                      {(ROLE_PERMISSIONS[profile.role] || []).map(perm => (
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
                      <p className="text-sm text-muted-foreground mt-0.5">Profils RBAC par équipe</p>
                    </div>
                    <Button onClick={openCreateTeam} size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                      Nouvelle équipe
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {teams.map((team, idx) => {
                      const role = ROLES.find(r => r.value === team.role);
                      const perms = ROLE_PERMISSIONS[team.role] || [];
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
                                <div className="text-xs text-muted-foreground mt-0.5">{team.site || "—"} · {team.memberCount} membres</div>
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
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTeam(team.id)}>
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
                  <p className="text-sm text-muted-foreground mb-5">Permissions par rôle</p>
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
                        {["Tableau de bord", "Équipements", "Ordres de travail", "Préventive", "Stock & pièces", "Personnel", "Rapports", "Paramètres"].map(module => (
                          <tr key={module} className="border-b border-border/30 last:border-0">
                            <td className="py-2 pr-4 text-foreground font-medium">{module}</td>
                            {ROLES.map(r => {
                              const has = (ROLE_PERMISSIONS[r.value] || []).some(p => p.includes(module.split(" ")[0]));
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
                    { key: "breakdown", label: "Pannes critiques", desc: "Nouvelle panne signalée sur un équipement" },
                    { key: "lowStock", label: "Stock faible", desc: "Pièce en dessous du seuil minimum" },
                    { key: "overdueWO", label: "OT en retard", desc: "Ordre de travail dépassé" },
                    { key: "preventiveDue", label: "Préventive à échéance", desc: "Plan de maintenance dû dans 48h" },
                    { key: "newAssignment", label: "Nouvelles affectations", desc: "Un OT vous est assigné" },
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
                    { key: "dailyReport", label: "Rapport quotidien", desc: "Résumé des activités du jour à 18h00" },
                    { key: "weeklyReport", label: "Rapport hebdomadaire", desc: "Bilan de la semaine chaque lundi à 08h00" },
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
                    { key: "emailNotifs", label: "Notifications email", desc: "Envoi par email à " + profile.email },
                    { key: "appNotifs", label: "Notifications in-app", desc: "Alertes dans la barre de notification" },
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
                        { value: "Europe/Paris", label: "Paris (UTC+2)" },
                        { value: "UTC", label: "UTC" },
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
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]
                    },
                    {
                      key: "defaultView", label: "Page d'accueil", options: [
                        { value: "dashboard", label: "Tableau de bord" },
                        { value: "workorders", label: "Ordres de travail" },
                        { value: "assets", label: "Équipements" },
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

      {/* Team Dialog */}
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
              <Select value={teamForm.role} onValueChange={v => setTeamForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <div className="font-medium">{r.label}</div>
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
              <label className="text-xs font-medium text-muted-foreground">Couleur</label>
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
                <div className="text-xs font-medium text-muted-foreground mb-2">Accès pour ce rôle:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(ROLE_PERMISSIONS[teamForm.role] || []).map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTeamDialog(null)}>Annuler</Button>
            <Button onClick={saveTeam}>{teamDialog === "new" ? "Créer" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
