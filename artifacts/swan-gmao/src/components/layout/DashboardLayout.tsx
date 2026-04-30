import { Link, useLocation } from "wouter";
import swanLogo from "@assets/21778_1777542129715.png";
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  CalendarClock, 
  PackageSearch, 
  Users, 
  LineChart,
  LogOut,
} from "lucide-react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/assets", label: "Équipements", icon: Wrench },
  { path: "/workorders", label: "Ordres de travail", icon: ClipboardList },
  { path: "/preventive", label: "Préventive", icon: CalendarClock },
  { path: "/inventory", label: "Stock & pièces", icon: PackageSearch },
  { path: "/technicians", label: "Personnel", icon: Users },
  { path: "/reports", label: "Rapports & KPIs", icon: LineChart },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || location.startsWith(item.path + '/');
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
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-primary font-semibold text-sm">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Admin Syst.</span>
              <span className="text-xs text-muted-foreground mt-1">Usine Centrale</span>
            </div>
          </div>
          <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors mt-2">
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="font-medium text-lg capitalize tracking-tight text-foreground">
            {navItems.find(i => location.startsWith(i.path))?.label || "GMAO"}
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
