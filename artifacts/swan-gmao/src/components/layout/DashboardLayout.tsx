import { Link, useLocation } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, LogOut, Calendar, Settings, MessageSquare, MapPin, Briefcase,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useRBAC, NAV_ITEMS, ROLE_META } from "@/context/RBACContext";
import { useAuth } from "@/context/AuthContext";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, Calendar, MessageSquare, MapPin, Briefcase,
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, visibleNav } = useRBAC();
  const { isAuthenticated, logout } = useAuth();
  const roleMeta = ROLE_META[user.role];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <aside className="w-72 border-r border-border/50 bg-card/70 flex flex-col shrink-0 sticky top-0 h-screen backdrop-blur-md">
        <div className="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src={swanLogo} alt="SWAN Logo" className="h-12 w-auto" />
            <div>
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase">SWAN</div>
              <div className="text-[10px] text-muted-foreground">Industrial maintenance platform</div>
            </div>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="px-2 mb-4 mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opérations</div>
          {visibleNav.map((item) => {
            const Icon = ICON_MAP[item.icon] || Wrench;
            const isActive = location === item.path || location.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50 shrink-0 space-y-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 px-3 py-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0" style={{ background: roleMeta.color + "20", color: roleMeta.color }}>
              {user.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium leading-none truncate">{user.name}</span>
              <span className="text-xs mt-1 font-medium truncate" style={{ color: roleMeta.color }}>{roleMeta.label}</span>
              <span className="text-xs text-muted-foreground/70 truncate">{user.site}</span>
            </div>
          </div>

          {visibleNav.some(item => item.path === "/settings") && (
            <Link href="/settings" className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${location === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
              <Settings className="h-5 w-5" strokeWidth={1.5} />
              Paramètres
            </Link>
          )}

          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-destructive">
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FloatingHeaderShell
          logo={swanLogo}
          logoHref="/dashboard"
          title={[...NAV_ITEMS, { path: "/settings", key: "settings", label: "Paramètres", icon: "Settings" }].find(i => location.startsWith(i.path))?.label || "GMAO"}
          rightContent={<NotificationsDropdown />}
          hideCenterNav
        />
        <main className="relative flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
