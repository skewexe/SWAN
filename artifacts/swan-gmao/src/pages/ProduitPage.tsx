import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Settings, Workflow, ShieldCheck, Box, Users, BarChart3,
  Calendar, Building2, Zap, Globe, CheckCircle2, ChevronRight,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const HIGHLIGHTS = [
  {
    icon: Settings,
    title: "Gestion des actifs industriels",
    desc: "Référencez l'ensemble de votre parc machine avec photos, localisations, nomenclatures et historique complet de maintenance.",
    color: "#0A6DFF",
  },
  {
    icon: Workflow,
    title: "Ordres de travail intelligents",
    desc: "Créez, affectez et suivez chaque intervention — curative ou préventive — avec traçabilité complète et assignation par technicien, zone ou machine.",
    color: "#38BDF8",
  },
  {
    icon: ShieldCheck,
    title: "Maintenance préventive planifiée",
    desc: "Configurez des plans récurrents avec fréquences personnalisées. SWAN génère automatiquement les OT et alerte avant les échéances.",
    color: "#22C55E",
  },
  {
    icon: Box,
    title: "Stock & pièces de rechange",
    desc: "Gérez les consommations, déclenchez des alertes de rupture et tracez chaque mouvement de stock par équipement.",
    color: "#F59E0B",
  },
  {
    icon: Users,
    title: "Équipes & contrôle d'accès",
    desc: "Profils techniciens réels, rôles granulaires (Admin, Manager, Chef d'équipe, Technicien, Lecteur) et séparation claire des responsabilités.",
    color: "#8B5CF6",
  },
  {
    icon: BarChart3,
    title: "Reporting & KPIs direction",
    desc: "MTBF, MTTR, taux de disponibilité opérationnelle, coûts de maintenance — les indicateurs dont votre direction a besoin pour arbitrer.",
    color: "#EC4899",
  },
];

const PLATFORMS = [
  { label: "Web (desktop & mobile)", icon: Globe },
  { label: "Multi-sites & multi-zones", icon: Building2 },
  { label: "Import CSV / Excel", icon: Zap },
  { label: "WhatsApp & Telegram", icon: Zap },
  { label: "API REST documentée", icon: Zap },
  { label: "On-premise ou cloud", icon: Globe },
];

export default function ProduitPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_600px_at_50%_-100px,rgba(10,109,255,0.12),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Produit</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl mx-auto">
              La GMAO conçue pour
              <br />
              <span className="text-primary">l'industrie algérienne</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              SWAN est une plateforme CMMS premium, pensée pour les équipes de maintenance des sites industriels algériens. Structurez vos opérations, maîtrisez vos indicateurs, réduisez vos arrêts.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/demander-acces">
                <Button size="lg" className="h-12 rounded-full px-8">
                  Demander un accès
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/fonctionnalites">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8">
                  Voir toutes les fonctionnalités
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Fonctionnalités clés</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tout ce qu'attend un responsable maintenance.</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">Six piliers pour couvrir l'intégralité du cycle de maintenance industrielle.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-7 hover:border-primary/30 transition-colors"
            >
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: item.color + "18", border: `1px solid ${item.color}30` }}>
                <item.icon className="h-5 w-5" style={{ color: item.color }} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground text-[1.05rem] mb-2.5">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              <Link href="/fonctionnalites" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                En savoir plus <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Intégrations & déploiement</p>
            <h2 className="text-3xl font-semibold tracking-tight">Adapté à votre infrastructure</h2>
            <p className="mt-4 text-muted-foreground">Deployable en cloud SaaS, on-premise ou hybride selon vos contraintes réglementaires et sécuritaires.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {PLATFORMS.map((p, idx) => (
              <motion.div key={p.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.05, ease: easeOut }} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 py-3.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground/90">{p.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Prêt à commencer ?</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Découvrez SWAN sur votre site.</h2>
          <p className="mt-4 text-muted-foreground text-lg">Nos équipes vous accompagnent de l'onboarding à la mise en production. Premier déploiement en 48h.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/demander-acces">
              <Button size="lg" className="h-12 rounded-full px-8">Demander un accès <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/modules">
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8">Voir les modules</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={swanLogo} alt="SWAN" className="h-7 w-auto opacity-60 grayscale" />
            <span>© {new Date().getFullYear()} Swan GMAO</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</Link>
            <Link href="/modules" className="hover:text-foreground transition-colors">Modules</Link>
            <Link href="/offres" className="hover:text-foreground transition-colors">Offres</Link>
            <Link href="/securite" className="hover:text-foreground transition-colors">Sécurité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
