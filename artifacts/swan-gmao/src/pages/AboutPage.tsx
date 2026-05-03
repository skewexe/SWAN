import { motion } from "framer-motion";
import {
  ShieldCheck, Zap, Users, BarChart3, Globe2, Wrench,
  CheckCircle2, ArrowRight, Factory, Building2, Landmark,
  ClipboardList, Wrench as WrenchTool, CalendarDays, ClipboardCheck,
  Barcode, Handshake, Clock3, BadgeInfo, ClipboardPenLine, Archive,
  Activity, ChartColumnBig, FileBarChart2, History, ListChecks, Cog,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const easeOut = "easeOut" as const;

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Fiabilité industrielle",
    desc: "Chaque fonctionnalité est pensée pour un contexte de production critique. Pas de compromis sur la stabilité ou la précision des données.",
  },
  {
    icon: Zap,
    title: "Lisibilité opérationnelle",
    desc: "Les équipes terrain et les directions travaillent dans la même interface. Chaque rôle voit exactement ce dont il a besoin, sans bruit.",
  },
  {
    icon: Users,
    title: "Collaboration structurée",
    desc: "Techniciens, chefs d'équipe, managers et direction partagent un espace commun avec des droits clairs et une traçabilité totale.",
  },
  {
    icon: BarChart3,
    title: "Décision par les données",
    desc: "MTBF, MTTR, taux de disponibilité, coûts d'arrêt — les indicateurs qui comptent pour les arbitrages de maintenance.",
  },
  {
    icon: Globe2,
    title: "Ancrage local",
    desc: "Conçu pour les exigences du marché algérien : zones industrielles, contraintes de connectivité, support francophone 24/7.",
  },
  {
    icon: Wrench,
    title: "Déploiement rapide",
    desc: "Import CSV/Excel, configuration progressive, mise en production en 48h. Pas de projet de 6 mois pour démarrer.",
  },
];

const MODULES = [
  { icon: WrenchTool, title: "Gestion technique", desc: "Équipements, organes associés, pièces de rechange et gammes opératoires." },
  { icon: ClipboardList, title: "Interventions", desc: "Préventives, curatives, demandes de travaux et bons de travaux structurés." },
  { icon: ClipboardCheck, title: "Cycle d'exécution", desc: "Ouverture, lancement, suspension, clôture et traçabilité complète." },
  { icon: Barcode, title: "Pointage barcodes", desc: "Saisie des pointages par code-barres pour les équipes et les interventions." },
  { icon: Handshake, title: "Sous-traitance", desc: "Gestion des prestataires, suivi des interventions et contrôle d'exécution." },
  { icon: CalendarDays, title: "Planning atelier", desc: "Planification des ressources humaines, matérielles et des activités." },
  { icon: Clock3, title: "Disponibilité", desc: "Gestion de la disponibilité des ressources humaines et matérielles." },
  { icon: BadgeInfo, title: "Motifs d'intervention", desc: "Saisie du motif pour produire des statistiques par cause et par panne." },
  { icon: Archive, title: "Ressources maintenance", desc: "Moyens humains, moyens matériels et pièces liées aux stocks et approvisionnements." },
  { icon: Activity, title: "OT préventifs automatiques", desc: "Génération automatique des bons de travaux préventifs." },
  { icon: ChartColumnBig, title: "Indicateurs de gestion", desc: "MTTR, MTBF, indice de réactivité et analyse de la main d'œuvre." },
  { icon: FileBarChart2, title: "Analyses coûts", desc: "ABC des coûts de revient, coûts de maintenance et consommation pièces." },
  { icon: History, title: "Historique équipement", desc: "Historique complet des interventions sur chaque équipement." },
  { icon: ListChecks, title: "Classement des équipements", desc: "Classement selon le nombre d'interventions et d'autres critères opérationnels." },
  { icon: Cog, title: "Éditions d'états", desc: "États de consommation pièces, coûts par équipement et rapports exploitables." },
];

const SECTORS = [
  { icon: Factory, label: "Industrie pétrolière & gazière" },
  { icon: Building2, label: "Cimenteries & matériaux" },
  { icon: Landmark, label: "Complexes sidérurgiques" },
  { icon: Wrench, label: "Agroalimentaire & emballage" },
  { icon: Zap, label: "Production d'énergie" },
  { icon: Globe2, label: "Eau & assainissement" },
];

const MILESTONES = [
  { year: "2026", label: "Origine à Oran", desc: "Conçu par 3 ingénieurs informatiques dans 3 usines différentes, à partir d'un besoin réel." },
  { year: "2026", label: "Création de SWAN", desc: "Premiers prototypes développés à partir de retours terrain et de contraintes industrielles concrètes." },
  { year: "2026", label: "Premiers déploiements", desc: "Mise en production initiale dans des environnements industriels pilotes à Oran." },
  { year: "2026", label: "Multi-sites", desc: "Passage à une architecture multi-sites avec RBAC avancé et suivi unifié." },
  { year: "2026", label: "Reporting direction", desc: "Intégration des KPIs stratégiques et du reporting exécutif pour les managers et la direction." },
  { year: "2026", label: "SWAN 2026", desc: "Interface premium, IA prédictive et connecteurs SI en cours." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 space-y-0">
      <section className="relative overflow-hidden pb-20 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_700px_at_50%_-60px,rgba(10,109,255,0.09),transparent)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Mission</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Une GMAO conçue pour
            <span className="block text-muted-foreground">la rigueur industrielle.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
            SWAN est né d'un constat simple : les opérations critiques méritent un logiciel précis, stable et lisible.
            Pas un outil complexe hérité des années 2000. Une plateforme moderne, construite pour les équipes
            industrielles algériennes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="h-10 rounded-full px-6 text-sm">
                Démarrer un projet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" className="h-10 rounded-full px-6 text-sm">
                Questions fréquentes
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="border-y border-border/50 bg-card/40 py-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            ["500+", "Sites déployés"],
            ["12", "Wilayas couvertes"],
            ["8", "Secteurs industriels"],
            ["48h", "Mise en production"],
          ].map(([val, label]) => (
            <div key={val} className="text-center">
              <div className="text-3xl font-semibold tracking-tight">{val}</div>
              <div className="mt-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Origine</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Pensé par le terrain, pour le terrain.</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
            En 2026, SWAN a été conçu par 3 ingénieurs informatiques travaillant dans 3 usines différentes à Oran.
            Un besoin réel, observé au quotidien : remplacer les tableaux dispersés, les suivis manuels et les outils
            génériques par une solution fiable, lisible et directement exploitable par les équipes de maintenance.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            ["3 ingénieurs", "Un produit né d'une collaboration entre terrain, code et maintenance."],
            ["3 usines", "Des contraintes différentes, un seul besoin : piloter mieux et plus vite."],
            ["Oran, 2026", "Une solution construite pour une réalité industrielle locale, pas pour la théorie."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-border/60 bg-card/70 p-6">
              <div className="text-lg font-semibold">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Modules</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tout le périmètre CMMS attendu en entreprise.</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
            Les modules ci-dessous couvrent la gestion technique, la planification, les interventions, les ressources,
            les indicateurs et les éditions d'états.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.03, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
                <item.icon className="h-[1.1rem] w-[1.1rem] text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-[1.05rem] font-semibold">{item.title}</h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Nos engagements</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ce qui guide chaque décision produit.</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
            Six principes fondateurs qui définissent comment SWAN est conçu, déployé et amélioré.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {VALUES.map((v, idx) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
                <v.icon className="h-[1.1rem] w-[1.1rem] text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-[1.05rem] font-semibold">{v.title}</h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Secteurs</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Présents là où l'exigence est maximale.</h2>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {SECTORS.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: easeOut }}
              className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/70 px-5 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/50">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-[0.9rem] font-medium text-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Parcours</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">De la salle machine à la direction industrielle.</h2>
        </motion.div>

        <div className="mt-10 space-y-0">
          {MILESTONES.map((m, idx) => (
            <motion.div
              key={`${m.year}-${m.label}`}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: easeOut }}
              className="flex gap-8 py-5 border-b border-border/40 last:border-0"
            >
              <div className="w-16 shrink-0">
                <span className="text-sm font-semibold tabular-nums text-primary">{m.year}</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <div className="text-[0.95rem] font-semibold text-foreground">{m.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{m.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-8 py-12 md:px-14">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Plateforme</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Ce que SWAN offre en standard.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tous les modules essentiels de la maintenance industrielle sont inclus dès le départ.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                "Gestion des équipements et organes associés",
                "Gestion des pièces de rechange associées",
                "Gestion des gammes opératoires",
                "Interventions préventives et curatives",
                "Demandes de travaux et bons de travaux",
                "Ouverture, lancement, suspension, clôture",
                "Pointage par codes barres",
                "Gestion de la sous-traitance",
                "Motifs d'intervention et statistiques par cause",
                "Génération automatique des bons préventifs",
                "Gestion des ressources liées à la maintenance",
                "Moyens humains et moyens matériels",
                "Planning atelier et disponibilité des ressources",
                "Planification RH, matérielle et activités",
                "Indicateurs MTTR, MTBF et indice de réactivité",
                "Analyse de l'utilisation de la main d'œuvre",
                "ABC des coûts de revient et causes de pannes",
                "Consommations pièces par machine, structure et référence",
                "État des coûts de maintenance par équipement",
                "Historique des interventions par équipement",
                "Classement des équipements par nombre d'interventions",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Passez à l'action</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Prêt à structurer votre maintenance ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">
            Essai gratuit 30 jours. Mise en production en 48h. Sans engagement.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-11 rounded-full px-8 text-[0.9rem]">Créer un espace</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 rounded-full px-8 text-[0.9rem]">Voir la démo</Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
