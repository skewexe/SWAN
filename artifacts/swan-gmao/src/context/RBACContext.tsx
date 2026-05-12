import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { RBACRole } from "./types";
import { useAuth } from "./AuthContext";

export type { RBACRole };

export interface RBACUser {
  name: string;
  email: string;
  role: RBACRole;
  team: string;
  site: string;
  technicianId?: number;
  initials: string;
}

export interface RBACTeam {
  id: number;
  name: string;
  role: RBACRole;
  site: string;
  memberCount: number;
  color: string;
}

export const ROLE_META: Record<RBACRole, { label: string; color: string; desc: string }> = {
  admin:       { label: "Administrateur",           color: "#EF4444", desc: "Accès complet à toutes les fonctionnalités" },
  manager:     { label: "Responsable maintenance",  color: "#F59E0B", desc: "Gestion des équipes, rapports et planification" },
  chef_equipe: { label: "Chef d'équipe",            color: "#0A6DFF", desc: "Supervision des techniciens et validation des OT" },
  technicien:  { label: "Technicien",               color: "#22C55E", desc: "Saisie des OT assignés uniquement" },
  lecteur:     { label: "Lecteur seul",             color: "#64748B", desc: "Consultation des données sans modification" },
};

export const ROLE_PERMISSIONS: Record<RBACRole, string[]> = {
  admin:       ["dashboard", "assets", "workorders", "preventive", "calendar", "inventory", "technicians", "reports", "settings", "telegram", "subcontractors"],
  manager:     ["dashboard", "assets", "workorders", "preventive", "calendar", "inventory", "technicians", "reports", "subcontractors"],
  chef_equipe: ["dashboard", "workorders", "preventive", "calendar", "technicians"],
  technicien:  ["dashboard", "workorders", "technicians"],
  lecteur:     ["dashboard", "reports"],
};

export const NAV_ITEMS = [
  { path: "/dashboard",         key: "dashboard",       label: "Tableau de bord",     icon: "LayoutDashboard" },
  { path: "/assets",            key: "assets",          label: "Équipements",         icon: "Wrench" },
  { path: "/workorders",        key: "workorders",      label: "Ordres de travail",   icon: "ClipboardList" },
  { path: "/preventive",        key: "preventive",      label: "Préventive",          icon: "CalendarClock" },
  { path: "/calendar",          key: "calendar",        label: "Calendrier",          icon: "Calendar" },
  { path: "/inventory",         key: "inventory",       label: "Stock & pièces",      icon: "PackageSearch" },
  { path: "/technicians",       key: "technicians",     label: "Personnel",           icon: "Users" },
  { path: "/subcontractors",    key: "subcontractors",  label: "Sous-traitance",      icon: "Briefcase" },
  { path: "/reports",           key: "reports",         label: "Rapports & KPIs",     icon: "LineChart" },
  { path: "/telegram-admin",    key: "telegram",        label: "Telegram Gateway",    icon: "MessageSquare" },
];

const DEFAULT_USER: RBACUser = {
  name: "Admin Système",
  email: "admin@swan-gmao.dz",
  role: "admin",
  team: "Supervision",
  site: "Usine Centrale",
  initials: "AD",
};

const DEFAULT_TEAMS: RBACTeam[] = [
  { id: 1, name: "Équipe Électrique",      role: "technicien",  site: "Usine Centrale", memberCount: 4, color: "#0A6DFF" },
  { id: 2, name: "Équipe Mécanique",       role: "technicien",  site: "Atelier A",      memberCount: 6, color: "#22C55E" },
  { id: 3, name: "Équipe Instrumentation", role: "chef_equipe", site: "Zone Nord",      memberCount: 3, color: "#F59E0B" },
  { id: 4, name: "Supervision",            role: "manager",     site: "Direction",      memberCount: 2, color: "#8B5CF6" },
];

interface RBACContextValue {
  user: RBACUser;
  setUser: (u: RBACUser) => void;
  teams: RBACTeam[];
  setTeams: (t: RBACTeam[]) => void;
  can: (key: string) => boolean;
  visibleNav: typeof NAV_ITEMS;
  isReadOnly: boolean;
}

const RBACContext = createContext<RBACContextValue | null>(null);

function authToRBAC(au: { name: string; email: string; role: RBACRole; team: string; site: string; technicianId?: number; initials: string }): RBACUser {
  return {
    name: au.name,
    email: au.email,
    role: au.role,
    team: au.team,
    site: au.site,
    technicianId: au.technicianId,
    initials: au.initials,
  };
}

export function RBACProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<RBACUser>(() =>
    currentUser ? authToRBAC(currentUser) : DEFAULT_USER
  );
  const [teams, setTeams] = useState<RBACTeam[]>(DEFAULT_TEAMS);

  useEffect(() => {
    if (currentUser) {
      setUser(authToRBAC(currentUser));
    } else {
      setUser(DEFAULT_USER);
    }
  }, [currentUser]);

  const can = (key: string) => ROLE_PERMISSIONS[user.role]?.includes(key) ?? false;
  const visibleNav = NAV_ITEMS.filter(n => can(n.key));
  const isReadOnly = user.role === "lecteur";

  return (
    <RBACContext.Provider value={{ user, setUser, teams, setTeams, can, visibleNav, isReadOnly }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error("useRBAC must be used inside RBACProvider");
  return ctx;
}
