import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { RBACRole } from "./types";

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: RBACRole;
  team: string;
  site: string;
  technicianId?: number;
  initials: string;
  company?: string;
}

const USERS_KEY = "swan_users";
const SESSION_KEY = "swan_session";

export const SEED_USERS: StoredUser[] = [
  {
    id: "u1",
    email: "admin@swan-gmao.dz",
    password: "Admin2024!",
    name: "Admin Système",
    role: "admin",
    team: "Supervision",
    site: "Usine Centrale",
    initials: "AD",
    company: "SWAN Industriel",
  },
  {
    id: "u2",
    email: "m.ziani@usine-centrale.dz",
    password: "Ziani2024",
    name: "Mohamed Ziani",
    role: "manager",
    team: "Supervision",
    site: "Usine Centrale",
    initials: "MZ",
    company: "SWAN Industriel",
  },
  {
    id: "u3",
    email: "k.boudaoud@usine-centrale.dz",
    password: "Karim2024",
    name: "Karim Boudaoud",
    role: "chef_equipe",
    team: "Équipe Électrique",
    site: "Usine Centrale",
    technicianId: 1,
    initials: "KB",
    company: "SWAN Industriel",
  },
  {
    id: "u4",
    email: "f.amrani@usine-centrale.dz",
    password: "Amrani24",
    name: "Fatima Amrani",
    role: "technicien",
    team: "Équipe Mécanique",
    site: "Atelier A",
    technicianId: 2,
    initials: "FA",
    company: "SWAN Industriel",
  },
  {
    id: "u5",
    email: "r.benali@usine-centrale.dz",
    password: "Benali24",
    name: "Rachid Benali",
    role: "technicien",
    team: "Équipe Mécanique",
    site: "Atelier A",
    technicianId: 3,
    initials: "RB",
    company: "SWAN Industriel",
  },
  {
    id: "u6",
    email: "a.cherrabi@usine-centrale.dz",
    password: "Amel2024",
    name: "Amel Cherrabi",
    role: "technicien",
    team: "Équipe Instrumentation",
    site: "Zone Nord",
    technicianId: 4,
    initials: "AC",
    company: "SWAN Industriel",
  },
  {
    id: "u7",
    email: "demo@swan-gmao.dz",
    password: "demo",
    name: "Utilisateur Démo",
    role: "lecteur",
    team: "Démo",
    site: "Site Démo",
    initials: "DM",
    company: "Démo",
  },
];

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {}
  return SEED_USERS;
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): StoredUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as StoredUser;
  } catch {}
  return null;
}

interface AuthContextValue {
  currentUser: StoredUser | null;
  isAuthenticated: boolean;
  allUsers: StoredUser[];
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
    role?: RBACRole;
    team?: string;
    site?: string;
  }) => { success: boolean; error?: string };
  setPasswordForUser: (email: string, newPassword: string, userInfo?: Partial<StoredUser>) => { success: boolean; error?: string };
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(loadSession);

  useEffect(() => {
    if (users.length === 0) {
      setUsers(SEED_USERS);
      saveUsers(SEED_USERS);
    }
  }, []);

  const refreshUsers = () => {
    const fresh = loadUsers();
    setUsers(fresh);
  };

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const fresh = loadUsers();
    const found = fresh.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: "Aucun compte trouvé avec cet email." };
    if (found.password !== password) return { success: false, error: "Mot de passe incorrect." };
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    setCurrentUser(found);
    setUsers(fresh);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  const register = (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
    role?: RBACRole;
    team?: string;
    site?: string;
  }): { success: boolean; error?: string } => {
    const fresh = loadUsers();
    if (fresh.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "Un compte avec cet email existe déjà." };
    }
    const initials = data.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newUser: StoredUser = {
      id: "u" + Date.now(),
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role ?? "admin",
      team: data.team ?? "Direction",
      site: data.site ?? "Site Principal",
      initials,
      company: data.company,
    };
    const updated = [...fresh, newUser];
    saveUsers(updated);
    setUsers(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
    return { success: true };
  };

  const setPasswordForUser = (
    email: string,
    newPassword: string,
    userInfo?: Partial<StoredUser>
  ): { success: boolean; error?: string } => {
    const fresh = loadUsers();
    const idx = fresh.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      fresh[idx] = { ...fresh[idx], password: newPassword, ...userInfo };
    } else {
      if (!userInfo?.name) return { success: false, error: "Informations utilisateur manquantes." };
      const initials = (userInfo.name || email)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      fresh.push({
        id: "u" + Date.now(),
        email,
        password: newPassword,
        name: userInfo.name!,
        role: userInfo.role ?? "technicien",
        team: userInfo.team ?? "Équipe",
        site: userInfo.site ?? "Site Principal",
        technicianId: userInfo.technicianId,
        initials,
        company: userInfo.company,
      });
    }
    saveUsers(fresh);
    setUsers(fresh);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      allUsers: users,
      login,
      logout,
      register,
      setPasswordForUser,
      refreshUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
