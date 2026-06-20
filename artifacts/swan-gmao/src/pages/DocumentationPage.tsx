import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ChevronRight, Terminal, Database, Settings, Users, BarChart3, Workflow } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const SECTIONS = [
  {
    title: "Démarrage rapide",
    icon: ArrowRight,
    color: "#0A6DFF",
    steps: [
      { num: "01", title: "Configurer votre organisation", desc: "Créez vos sites et zones industriels, définissez l'arborescence de votre infrastructure." },
      { num: "02", title: "Importer vos équipements", desc: "Ajoutez votre parc machine manuellement ou via import CSV/Excel avec le template fourni." },
      { num: "03", title: "Créer votre équipe", desc: "Ajoutez vos techniciens, assignez les rôles RBAC et configurez les accès par module." },
      { num: "04", title: "Premier ordre de travail", desc: "Créez un OT, assignez-le à un technicien et suivez sa progression jusqu'à la clôture." },
      { num: "05", title: "Plans préventifs", desc: "Configurez vos plans de maintenance récurrents et activez les alertes automatiques." },
    ],
  },
];

const API_ENDPOINTS = [
  { method: "GET",    path: "/api/dashboard/stats",      desc: "KPIs du tableau de bord" },
  { method: "GET",    path: "/api/assets",                desc: "Liste des équipements" },
  { method: "POST",   path: "/api/assets",                desc: "Créer un équipement" },
  { method: "GET",    path: "/api/workorders",            desc: "Liste des ordres de travail" },
  { method: "POST",   path: "/api/workorders",            desc: "Créer un ordre de travail" },
  { method: "GET",    path: "/api/preventive",            desc: "Plans préventifs" },
  { method: "POST",   path: "/api/preventive/:id/execute", desc: "Exécuter un plan" },
  { method: "GET",    path: "/api/inventory",             desc: "Articles en stock" },
  { method: "GET",    path: "/api/technicians",           desc: "Liste des techniciens" },
  { method: "GET",    path: "/api/reports/kpis",          desc: "MTBF, MTTR, disponibilité" },
  { method: "GET",    path: "/api/notifications",         desc: "Notifications live" },
  { method: "GET",    path: "/api/sites",                 desc: "Sites industriels" },
  { method: "GET",    path: "/api/zones",                 desc: "Zones (filtrable par site)" },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    "#22C55E",
  POST:   "#0A6DFF",
  PUT:    "#F59E0B",
  DELETE: "#EF4444",
  PATCH:  "#8B5CF6",
};

const CONCEPTS = [
  { icon: Settings,  title: "Actifs",               desc: "Un actif représente un équipement industriel physique : machine, véhicule, installation, etc. Chaque actif a un statut, une criticité, et peut être lié à une zone et un site." },
  { icon: Workflow,  title: "Ordres de travail",     desc: "Un OT est une demande d'intervention, curative ou préventive. Il suit un cycle de vie : Ouvert → En cours → Terminé (ou Annulé/En attente)." },
  { icon: BarChart3, title: "KPIs",                  desc: "MTBF = Temps moyen entre pannes. MTTR = Temps moyen de réparation. Disponibilité = 1 - (MTTR / (MTBF + MTTR)). Calculés en temps réel depuis les données OT." },
  { icon: Users,     title: "Rôles RBAC",            desc: "Admin : accès total. Manager : tous modules sauf paramètres sensibles. Chef d'équipe : OT + préventif + personnel. Technicien : ses OT uniquement. Lecteur : lecture seule." },
  { icon: Database,  title: "Stock",                 desc: "Chaque article a une quantité, un seuil minimum et un coût unitaire. La consommation sur un OT déduit automatiquement le stock. La suppression de la consommation le restaure." },
  { icon: Terminal,  title: "API REST",              desc: "Toutes les données sont accessibles via l'API REST documentée. Authentification par session. Tous les endpoints répondent en JSON. Préfixe : /api/." },
];

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Documentation</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Guide technique SWAN
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Documentation de référence pour les administrateurs, développeurs et intégrateurs de la plateforme SWAN GMAO.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#demarrage">
                <Button size="lg" className="rounded-full px-8 h-12">Démarrage rapide <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </a>
              <a href="#api">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Référence API</Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Concepts */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="max-w-2xl mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Concepts fondamentaux</p>
          <h2 className="text-2xl font-semibold">Les entités du modèle de données SWAN</h2>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map((c, idx) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05, ease: easeOut }} className="rounded-2xl border border-border/50 bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <c.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
                <span className="font-semibold text-foreground">{c.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Getting started */}
      <section id="demarrage" className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="max-w-2xl mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Démarrage rapide</p>
            <h2 className="text-2xl font-semibold">Mise en production en 5 étapes</h2>
          </motion.div>
          <div className="space-y-4 max-w-3xl">
            {SECTIONS[0].steps.map((step, idx) => (
              <motion.div key={step.num} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06, ease: easeOut }} className="flex items-start gap-5 rounded-2xl border border-border/50 bg-background/40 px-6 py-4">
                <span className="font-mono text-2xl font-bold text-primary/30 shrink-0 w-8">{step.num}</span>
                <div>
                  <div className="font-semibold text-foreground mb-1">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section id="api" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="max-w-2xl mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">API REST</p>
          <h2 className="text-2xl font-semibold">Référence des endpoints</h2>
          <p className="mt-2 text-muted-foreground">Base URL : <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/api</code> — Authentification : session cookie</p>
        </motion.div>
        <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Méthode</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Endpoint</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.map((ep, idx) => (
                  <tr key={idx} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded" style={{ background: (METHOD_COLOR[ep.method] || "#64748B") + "18", color: METHOD_COLOR[ep.method] || "#64748B" }}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/80">{ep.path}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/30 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold">Besoin d'aide pour l'intégration ?</h2>
          <p className="mt-3 text-muted-foreground">Notre équipe technique accompagne les intégrateurs et développeurs.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/demander-acces"><Button className="rounded-full px-8 h-11">Parler à un expert <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/ressources"><Button variant="outline" className="rounded-full px-8 h-11">Centre de ressources</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
