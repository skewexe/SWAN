import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, LogOut, Calendar, Settings, MessageSquare, MapPin, Briefcase, Menu, X,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useRBAC, NAV_ITEMS, ROLE_META } from "@/context/RBACContext";
import { useAuth } from "@/context/AuthContext";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";
import { motion, AnimatePresence } from "framer-motion";
import { useCompany } from "@/context/CompanyContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Wrench, ClipboardList, CalendarClock,
  PackageSearch, Users, LineChart, Calendar, MessageSquare, MapPin, Briefcase,
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, visibleNav } = useRBAC();
  const { isAuthenticated, logout } = useAuth();
  const { profile } = useCompany();
  const roleMeta = ROLE_META[user.role];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showOnboarding = !profile.onboardingDone;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close sidebar on wide screens if it was left open
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setLocation("/login");
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-4 border-b border-border/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80 min-w-0">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="Logo"
              className="h-9 w-9 rounded-xl object-contain bg-background/60 border border-border/30 p-1 shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <img src={swanLogo} alt="SWAN Logo" className="h-9 w-auto shrink-0" />
          )}
          <div className="min-w-0">
            {profile.name ? (
              <>
                <div className="text-[11px] font-bold tracking-wide truncate text-foreground leading-tight">{profile.name}</div>
                <div className="text-[10px] text-muted-foreground">via SWAN GMAO</div>
              </>
            ) : (
              <>
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase">SWAN</div>
                <div className="text-[10px] text-muted-foreground">Industrial maintenance platform</div>
              </>
            )}
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
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`} strokeWidth={1.5} />
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
            <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            Paramètres
          </Link>
        )}

        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-destructive">
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Onboarding overlay — shown on first sign-in */}
      <AnimatePresence>
        {showOnboarding && <OnboardingFlow />}
      </AnimatePresence>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-border/50 bg-card/70 flex-col shrink-0 sticky top-0 h-screen backdrop-blur-md">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay + slide-in panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Panel */}
            <motion.aside
              key="panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="lg:hidden fixed left-0 top-0 z-50 h-full w-72 border-r border-border/50 bg-card flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FloatingHeaderShell
          logo={swanLogo}
          logoHref="/dashboard"
          title={[...NAV_ITEMS, { path: "/settings", key: "settings", label: "Paramètres", icon: "Settings" }].find(i => location.startsWith(i.path))?.label || "GMAO"}
          rightContent={<NotificationsDropdown />}
          hideCenterNav
          onMenuToggle={() => setSidebarOpen(v => !v)}
        />
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
