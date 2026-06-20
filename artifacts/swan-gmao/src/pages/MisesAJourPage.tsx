import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Bug, Zap, Shield, ChevronRight } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

type ChangeType = "feature" | "improvement" | "fix" | "security";

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Change[];
  badge?: string;
}

const TYPE_META: Record<ChangeType, { label: string; color: string; icon: any }> = {
  feature:     { label: "Nouveau",       color: "#0A6DFF", icon: Sparkles },
  improvement: { label: "Amélioration",  color: "#22C55E", icon: Zap },
  fix:         { label: "Correction",    color: "#F59E0B", icon: Bug },
  security:    { label: "Sécurité",      color: "#8B5CF6", icon: Shield },
};

const RELEASES: Release[] = [
  {
    version: "2.6.0",
    date: "Juin 2026",
    title: "Responsivité complète & améliorations UI",
    description: "Refonte complète de l'expérience mobile — toutes les pages sont désormais parfaitement utilisables sur smartphone et tablette.",
    badge: "Dernière version",
    changes: [
      { type: "feature",     text: "Menu latéral slide-over sur mobile avec animation fluide" },
      { type: "feature",     text: "Header hamburger responsive sur toutes les pages" },
      { type: "improvement", text: "Scroll horizontal sur toutes les tables (min-width garantis)" },
      { type: "improvement", text: "Filtres et barres de recherche flex-wrap sur petits écrans" },
      { type: "improvement", text: "Grilles KPI adaptatives : 2 colonnes sur mobile, 4 sur desktop" },
      { type: "improvement", text: "Onglets Settings scrollables horizontalement sur mobile" },
      { type: "improvement", text: "Calendrier responsive : stats 2 colonnes sur mobile" },
    ],
  },
  {
    version: "2.5.0",
    date: "Mai 2026",
    title: "Intégration Telegram & multi-techniciens",
    description: "Support complet de Telegram comme canal de notification et d'interaction bidirectionnelle, plus assignation multi-techniciens sur les OT.",
    changes: [
      { type: "feature",     text: "Bot Telegram avec webhook automatique et callbacks interactifs" },
      { type: "feature",     text: "Assignation de plusieurs techniciens sur un même OT" },
      { type: "feature",     text: "Envoi de notifications Telegram aux techniciens assignés" },
      { type: "feature",     text: "Bouton d'envoi Telegram sur chaque plan préventif" },
      { type: "feature",     text: "Champ telegramChatId sur les fiches techniciens" },
      { type: "improvement", text: "Gateway WhatsApp avec enregistrement des numéros autorisés" },
    ],
  },
  {
    version: "2.4.0",
    date: "Avril 2026",
    title: "Multi-sites, zones & photos équipements",
    description: "Gestion complète de la topologie industrielle avec sites, zones et photos associées à chaque équipement.",
    changes: [
      { type: "feature",     text: "Gestion des sites et zones avec CRUD complet" },
      { type: "feature",     text: "Affectation site/zone sur équipements et ordres de travail" },
      { type: "feature",     text: "Upload de photo par équipement avec prévisualisation" },
      { type: "feature",     text: "Arborescence site > zone > équipement" },
      { type: "feature",     text: "Import CSV/Excel avec mapping automatique de colonnes" },
      { type: "feature",     text: "Création par types (batch avec préfixe et compteur)" },
      { type: "improvement", text: "Catalogue pièces machine par équipement (AssetPartsDialog)" },
    ],
  },
  {
    version: "2.3.0",
    date: "Mars 2026",
    title: "Dashboard configurable & cross-filtres",
    description: "Tableau de bord réorganisable par drag & drop avec filtres croisés entre les graphiques.",
    changes: [
      { type: "feature",     text: "Widgets drag & drop sur le tableau de bord" },
      { type: "feature",     text: "Cross-filtres : clic sur un graphique filtre tous les autres" },
      { type: "feature",     text: "Graphique distribution statuts et priorités OT (barres horizontales)" },
      { type: "feature",     text: "Graphique tendance de disponibilité (Area Chart) vs objectif 95%" },
      { type: "feature",     text: "Agenda de la semaine et plans en retard sur le dashboard" },
      { type: "improvement", text: "8 KPI cards avec indicateurs de tendance" },
    ],
  },
  {
    version: "2.2.0",
    date: "Février 2026",
    title: "Rapports avancés & RBAC complet",
    description: "Page Rapports enrichie avec analyses de coûts et système RBAC à 5 rôles.",
    changes: [
      { type: "feature",     text: "Page Rapports avec MTBF, MTTR, disponibilité et coûts" },
      { type: "feature",     text: "Graphiques de tendance MTBF/MTTR et disponibilité sur 6 mois" },
      { type: "feature",     text: "RBAC complet : Admin, Manager, Chef d'équipe, Technicien, Lecteur" },
      { type: "feature",     text: "Filtrage OT par technicien connecté (vue Technicien)" },
      { type: "security",    text: "Tokens de session renouvelés à chaque connexion" },
    ],
  },
  {
    version: "2.0.0",
    date: "Janvier 2026",
    title: "Refonte complète — Design system premium",
    description: "Refonte totale de l'interface avec le nouveau design system SWAN : thème sombre, Inter, shadcn/ui.",
    changes: [
      { type: "feature",     text: "Nouveau design system : Deep Core Blue + Swan Blue + Inter" },
      { type: "feature",     text: "Composants shadcn/ui + Tailwind CSS + framer-motion" },
      { type: "feature",     text: "Floating header shell sur les pages publiques" },
      { type: "feature",     text: "Landing page avec hero, modules, témoignages et offres" },
      { type: "improvement", text: "Animations d'entrée fluides sur toutes les pages" },
      { type: "improvement", text: "Accessibilité améliorée (focus, contraste, labels ARIA)" },
    ],
  },
];

export default function MisesAJourPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Mises à jour</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Journal des versions
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Suivez l'évolution de SWAN — nouvelles fonctionnalités, améliorations et corrections au fil des versions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Releases */}
      <section className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40 ml-5 hidden sm:block" />
          <div className="space-y-12">
            {RELEASES.map((release, ridx) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: ridx * 0.05, ease: easeOut }}
                className="sm:pl-14 relative"
              >
                <div className="hidden sm:flex absolute left-0 top-1 h-10 w-10 rounded-full border border-border/60 bg-card items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/70 overflow-hidden">
                  <div className="px-7 py-5 border-b border-border/40 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">v{release.version}</span>
                    <span className="text-xs text-muted-foreground">{release.date}</span>
                    {release.badge && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                        {release.badge}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-foreground w-full sm:w-auto sm:ml-2">{release.title}</h3>
                  </div>
                  <div className="px-7 py-5">
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{release.description}</p>
                    <div className="space-y-2">
                      {release.changes.map((change, cidx) => {
                        const meta = TYPE_META[change.type];
                        return (
                          <div key={cidx} className="flex items-start gap-3">
                            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: meta.color + "18", color: meta.color }}>
                              {meta.label}
                            </span>
                            <span className="text-sm text-foreground/85 leading-snug">{change.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/30 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
            <h2 className="text-2xl font-semibold">Restez informé des nouvelles versions</h2>
            <p className="mt-3 text-muted-foreground">Demandez un accès pour recevoir les notes de version directement.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/demander-acces">
                <Button size="lg" className="rounded-full px-8 h-12">Demander un accès <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
