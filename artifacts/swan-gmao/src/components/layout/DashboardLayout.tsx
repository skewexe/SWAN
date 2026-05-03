import { Link, useLocation } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, LogOut, Calendar, Settings,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useRBAC, NAV_ITEMS, ROLE_META } from "@/context/RBACContext";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, Calendar,
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, visibleNav, can } = useRBAC();
  const roleMeta = ROLE_META[user.role];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <aside className="w-64 border-r border-border/50 bg-card flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-border/50 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src={swanLogo} alt="SWAN Logo" className="h-8 w-auto" />
            <span className="font-semibold tracking-wide text-lg text-primary">SWAN</span>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-2 px-2">
            Opérations
          </div>
          {visibleNav.map((item) => {
            const Icon = ICON_MAP[item.icon] || Wrench;
            const isActive = location === item.path || location.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50 shrink-0">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-background/40 border border-border/30 mb-2">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
              style={{ background: roleMeta.color + "20", color: roleMeta.color }}
            >
              {user.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium leading-none truncate">{user.name}</span>
              <span
                className="text-xs mt-1 font-medium truncate"
                style={{ color: roleMeta.color }}
              >
                {roleMeta.label}
              </span>
              <span className="text-xs text-muted-foreground/70 truncate">{user.site}</span>
            </div>
          </div>

          {can("settings") && (
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 ${
                location === "/settings"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Settings className="h-5 w-5" strokeWidth={1.5} />
              Paramètres
            </Link>
          )}

          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors mt-1"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            Déconnexion
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="font-medium text-lg tracking-tight text-foreground">
            {[...NAV_ITEMS, { path: "/settings", key: "settings", label: "Paramètres", icon: "Settings" }]
              .find(i => location.startsWith(i.path))?.label || "GMAO"}
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
