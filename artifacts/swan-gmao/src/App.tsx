import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider } from "@/context/AuthContext";
import { RBACProvider } from "@/context/RBACContext";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AboutPage from "@/pages/AboutPage";
import FaqPage from "@/pages/FaqPage";
import DashboardPage from "@/pages/DashboardPage";
import AssetsPage from "@/pages/AssetsPage";
import WorkOrdersPage from "@/pages/WorkOrdersPage";
import PreventivePage from "@/pages/PreventivePage";
import InventoryPage from "@/pages/InventoryPage";
import TechniciansPage from "@/pages/TechniciansPage";
import ReportsPage from "@/pages/ReportsPage";
import CalendarPage from "@/pages/CalendarPage";
import SettingsPage from "@/pages/SettingsPage";
import TelegramPage from "@/pages/TelegramPage";
import SubcontractorsPage from "@/pages/SubcontractorsPage";
import SiteMapPage from "@/pages/SiteMapPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <LandingPage />
      </Route>
      <Route path="/login">
        <PublicLayout><LoginPage /></PublicLayout>
      </Route>
      <Route path="/register">
        <PublicLayout><RegisterPage /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><AboutPage /></PublicLayout>
      </Route>
      <Route path="/faq">
        <PublicLayout><FaqPage /></PublicLayout>
      </Route>
      <Route path="/dashboard">
        <DashboardLayout><DashboardPage /></DashboardLayout>
      </Route>
      <Route path="/assets">
        <DashboardLayout><AssetsPage /></DashboardLayout>
      </Route>
      <Route path="/workorders">
        <DashboardLayout><WorkOrdersPage /></DashboardLayout>
      </Route>
      <Route path="/preventive">
        <DashboardLayout><PreventivePage /></DashboardLayout>
      </Route>
      <Route path="/inventory">
        <DashboardLayout><InventoryPage /></DashboardLayout>
      </Route>
      <Route path="/technicians">
        <DashboardLayout><TechniciansPage /></DashboardLayout>
      </Route>
      <Route path="/reports">
        <DashboardLayout><ReportsPage /></DashboardLayout>
      </Route>
      <Route path="/calendar">
        <DashboardLayout><CalendarPage /></DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout><SettingsPage /></DashboardLayout>
      </Route>
      <Route path="/sitemaps">
        <DashboardLayout><SiteMapPage /></DashboardLayout>
      </Route>
      <Route path="/subcontractors">
        <DashboardLayout><SubcontractorsPage /></DashboardLayout>
      </Route>
      <Route path="/telegram-admin">
        <DashboardLayout><TelegramPage /></DashboardLayout>
      </Route>
      <Route>
        <PublicLayout><NotFound /></PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RBACProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </RBACProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
