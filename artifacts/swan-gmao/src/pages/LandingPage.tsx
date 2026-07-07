import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Activity,
  ShieldCheck,
  Settings,
  Users,
  BarChart3,
  Box,
  Sparkles,
  Workflow,
  Check,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Lock,
  Github,
  Download,
  Terminal,
  Package,
  Cpu,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";
import { useState } from "react";

const DEPLOY_OPTIONS = [
  {
    icon: Terminal,
    title: "Docker Compose",
    badge: "Recommandé",
    desc: "Déployez en une commande sur n'importe quel serveur Linux.",
    steps: ["git clone swan-gmao", "docker compose up -d", "Accès immédiat sur :3000"],
    highlighted: true,
    color: "#0A6DFF",
  },
  {
    icon: Package,
    title: "Electron Desktop",
    badge: ".exe / .AppImage",
    desc: "Application bureau installable — Windows, Linux, macOS.",
    steps: ["Télécharger le .exe", "Installer en double-clique", "Base de données embarquée"],
    highlighted: false,
    color: "#8B5CF6",
  },
  {
    icon: Cpu,
    title: "On-premise",
    badge: "Serveur dédié",
    desc: "Node.js + PostgreSQL sur votre infrastructure, données locales.",
    steps: ["pnpm install", "pnpm run build", "pnpm run start"],
    highlighted: false,
    color: "#22C55E",
  },
];

const CAPABILITIES = [
  {
    title: "Pilotage des actifs",
    desc: "Équipements, pièces machine, photos, localisations, historique complet de maintenance.",
    icon: Settings,
  },
  {
    title: "Ordres de travail",
    desc: "Affectation par technicien, zone ou machine. Contrôle d'exécution, clôture et traçabilité.",
    icon: Workflow,
  },
  {
    title: "Maintenance préventive",
    desc: "Planification intelligente, alertes automatiques et calendrier industriel exploitable.",
    icon: ShieldCheck,
  },
  {
    title: "Stocks & pièces",
    desc: "Gestion des consommations, seuils critiques, mouvements de stock et suivi précis.",
    icon: Box,
  },
  {
    title: "Équipes & RBAC",
    desc: "Profils techniciens réels, droits granulaires et séparation claire des responsabilités.",
    icon: Users,
  },
  {
    title: "Reporting direction",
    desc: "MTBF, MTTR, disponibilité opérationnelle, coûts et arbitrage stratégique.",
    icon: BarChart3,
  },
];

const MODULES = [
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
];

const TESTIMONIALS = [
  {
    quote:
      "SWAN a transformé notre approche de la maintenance. Nous avons réduit nos arrêts imprévus de 34% en six mois.",
    name: "Rachid Bensalem",
    role: "Responsable Maintenance",
    company: "Groupe Cevital",
    initials: "RB",
  },
  {
    quote:
      "L'interface est d'une clarté remarquable. Nos techniciens ont adopté l'outil en moins d'une semaine sans formation poussée.",
    name: "Karima Ouali",
    role: "Directrice Technique",
    company: "Sonelgaz — Régionale Est",
    initials: "KO",
  },
  {
    quote:
      "Le reporting MTBF/MTTR nous donne enfin une vision factuelle pour les arbitrages budgétaires face à la direction générale.",
    name: "Amar Djelloul",
    role: "Chef de département maintenance",
    company: "Sonatrach — Division Production",
    initials: "AD",
  },
];

const FAQS = [
  {
    q: "SWAN est-il vraiment gratuit pour un usage en entreprise ?",
    a: "Oui, SWAN est publié sous licence MIT. Vous pouvez l'utiliser dans votre entreprise sans aucun frais, sans limite d'équipements, sans abonnement. La licence MIT autorise aussi les forks commerciaux.",
  },
  {
    q: "Combien de temps faut-il pour déployer SWAN ?",
    a: "Avec Docker Compose : moins de 5 minutes. Installation manuelle Node.js + PostgreSQL : 30 à 60 minutes. L'application Electron desktop s'installe en double-clique, sans aucune configuration serveur.",
  },
  {
    q: "Mes données restent-elles sur mon serveur ?",
    a: "Entièrement. SWAN est conçu pour fonctionner on-premise. Votre PostgreSQL sur votre serveur ou datacenter algérien, vos données sous votre contrôle total. Aucune télémétrie, aucune connexion à un service externe.",
  },
  {
    q: "Est-il possible d'intégrer SWAN avec notre ERP ou SCADA existant ?",
    a: "SWAN dispose d'une API REST documentée et d'un SCADA Gateway intégré supportant MQTT, Modbus TCP, OPC-UA, LoRaWAN et REST webhooks. Des connecteurs ERP (SAP, Oracle, Sage) peuvent être développés via l'API.",
  },
  {
    q: "Y a-t-il une version mobile pour les techniciens terrain ?",
    a: "L'interface SWAN est intégralement responsive et optimisée pour tablette et smartphone. Les techniciens peuvent créer, mettre à jour et clôturer des OT directement depuis le terrain via leur navigateur mobile.",
  },
];

const easeOut = "easeOut" as const;

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-[0.95rem] font-medium text-foreground">{q}</span>
        {open ? (
          <ChevronUp
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
          />
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="pb-5 text-[0.9rem] leading-relaxed text-muted-foreground"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans antialiased">
      <FloatingHeaderShell logo={swanLogo} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_900px_at_60%_-80px,rgba(10,109,255,0.13),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-8 lg:pb-32 lg:pt-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeOut }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-[13px] text-muted-foreground backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Plateforme GMAO pensée pour les industriels algériens
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease: easeOut }}
              className="text-[2.75rem] font-semibold leading-[1.1] tracking-tight sm:text-[3.5rem] lg:text-[4.25rem]"
            >
              L'excellence opérationnelle
              <span className="block text-muted-foreground">
                pour votre maintenance.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.13, ease: easeOut }}
              className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground"
            >
              SWAN structure vos équipements, vos interventions, vos ressources
              et vos indicateurs dans une interface premium conçue pour les
              exigences des groupes industriels algériens.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: easeOut }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-11 rounded-full px-7 text-[0.9rem] font-medium"
                >
                  Demander un accès
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full px-7 text-[0.9rem] font-medium"
                >
                  Voir la démo
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
              className="mt-8 flex flex-wrap items-center gap-5 text-[12px] text-muted-foreground"
            >
              {[
                { icon: Github, label: "100% Open Source · MIT" },
                { icon: Lock, label: "Données chez vous, on-premise" },
                { icon: Globe, label: "Multi-sites & multi-zones" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon
                    className="h-3.5 w-3.5 text-primary/70"
                    strokeWidth={1.5}
                  />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
            className="relative hidden lg:block"
          >
            <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-primary/6 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)]">
              <div className="border-b border-border/50 px-6 py-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Vue direction maintenance
                </div>
                <div className="mt-0.5 text-xl font-semibold">
                  Pilotage industriel
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Disponibilité globale
                      </div>
                      <div className="mt-1 text-3xl font-semibold">98.6%</div>
                    </div>
                    <Activity className="h-5 w-5 text-primary opacity-80" />
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted/60">
                    <div className="h-1.5 w-[86%] rounded-full bg-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["OT ouverts", "14"],
                    ["Préventif en retard", "03"],
                    ["Sites actifs", "08"],
                    ["Pièces critiques", "21"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-border/50 bg-background/35 px-4 py-3"
                    >
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/35 px-4 py-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                    <span>MTBF moyen</span>
                    <span className="text-green-400 font-semibold">↑ 12%</span>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[40, 55, 48, 62, 70, 65, 80, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/30"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <div className="border-y border-border/50 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              ["−34%", "Réduction des arrêts imprévus"],
              ["+500", "Sites industriels déployés"],
              ["MIT", "Licence open source"],
              ["5 min", "Déploiement Docker"],
            ].map(([val, desc]) => (
              <div key={val} className="text-center">
                <div className="text-3xl font-semibold tracking-tight">
                  {val}
                </div>
                <div className="mt-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CAPABILITIES ─── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Plateforme
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sobre, lisible, opérationnel.
          </h2>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
            Pas d'effets gadgets. Une expérience premium adaptée à l'usage
            quotidien en environnement industriel exigeant.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
                <item.icon
                  className="h-[1.1rem] w-[1.1rem] text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mt-5 text-[1.05rem] font-semibold">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Modules
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tout le périmètre CMMS attendu en entreprise.
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
              Gestion technique, interventions, ressources, planning,
              indicateurs et éditions d'états.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.02,
                  ease: easeOut,
                }}
                className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/40 px-5 py-4 hover:border-primary/25 transition-colors"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                </div>
                <span className="text-[0.875rem] text-foreground/90 leading-snug">
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl mb-12"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Témoignages
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ce que disent nos clients.
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-6 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-[0.9rem] leading-relaxed text-muted-foreground flex-1">
                "{t.quote}"
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── OPEN SOURCE / DEPLOY ─── */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-emerald-400 text-[12px] font-semibold tracking-wide mb-5">
              <Github className="h-3.5 w-3.5" />
              100% Open Source · Licence MIT
            </div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Déployez gratuitement,<br />
              <span className="text-primary">partout, pour toujours.</span>
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              SWAN est entièrement gratuit et open source. Vos données restent chez vous.
              Aucun abonnement, aucune limite d'équipements, aucun compte cloud obligatoire.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {DEPLOY_OPTIONS.map((opt, idx) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.07, ease: easeOut }}
                className={`relative rounded-3xl border p-7 flex flex-col ${
                  opt.highlighted
                    ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(10,109,255,0.15),0_24px_64px_-12px_rgba(10,109,255,0.12)]"
                    : "border-border/60 bg-card/70"
                }`}
              >
                {opt.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap"
                    style={{ background: opt.color + "20", borderColor: opt.color + "40", color: opt.color }}
                  >
                    {opt.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: opt.color + "18", border: `1px solid ${opt.color}40` }}>
                    <opt.icon className="h-5 w-5" style={{ color: opt.color }} strokeWidth={1.5} />
                  </div>
                  <div className="font-semibold text-foreground text-lg">{opt.title}</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{opt.desc}</p>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {opt.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm font-mono">
                      <span className="h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: opt.color + "20", color: opt.color }}>
                        {i + 1}
                      </span>
                      <code className="text-foreground/80 text-xs">{s}</code>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full rounded-full h-10 text-sm font-medium gap-2 ${!opt.highlighted ? "bg-card border border-border/60 text-foreground hover:bg-muted" : ""}`}
                    variant={opt.highlighted ? "default" : "outline"}
                  >
                    <Download className="h-3.5 w-3.5" /> Commencer maintenant
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
            className="mt-10 text-center"
          >
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full gap-2 h-10">
                <Github className="h-4 w-4" /> Voir le code source sur GitHub
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
              Vous ne trouvez pas ce que vous cherchez ? Notre équipe est
              disponible pour répondre à toutes vos questions.
            </p>
            <Link href="/faq">
              <Button variant="outline" className="mt-6 rounded-full gap-1.5">
                Voir toutes les questions
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border/0">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="relative overflow-hidden bg-card/30 border-y border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_50%,rgba(10,109,255,0.08),transparent)]" />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">
              Open Source · MIT License
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Installez SWAN gratuitement
              <br />
              <span className="text-muted-foreground">
                sur votre infrastructure.
              </span>
            </h2>
            <p className="mt-6 text-[1rem] leading-relaxed text-muted-foreground max-w-xl mx-auto">
              Aucun abonnement. Aucune limite. Vos données restent chez vous.
              Docker, Electron ou on-premise — vous choisissez.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="h-12 rounded-full px-8 text-[0.95rem] font-medium gap-2"
                >
                  <Github className="h-4 w-4" /> GitHub — Clone & Deploy
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-8 text-[0.95rem] font-medium"
                >
                  Se connecter
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={swanLogo} alt="SWAN" className="h-9 w-auto" />
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground">
                    Swan GMAO
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-none">
                    Industrial maintenance platform
                  </div>
                </div>
              </div>
              <p className="text-[0.875rem] leading-relaxed text-muted-foreground max-w-xs">
                La GMAO premium conçue pour les industriels algériens.
                Structurez votre maintenance, maîtrisez vos indicateurs.
              </p>
              <div className="mt-5 space-y-2 text-[0.875rem] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail
                    className="h-3.5 w-3.5 text-primary/70"
                    strokeWidth={1.5}
                  />
                  contact@swan-gmao.dz
                </div>
                <div className="flex items-center gap-2">
                  <Phone
                    className="h-3.5 w-3.5 text-primary/70"
                    strokeWidth={1.5}
                  />
                  +213 (0) 7 78 62 84 49
                </div>
                <div className="flex items-center gap-2">
                  <MapPin
                    className="h-3.5 w-3.5 text-primary/70"
                    strokeWidth={1.5}
                  />
                  Oran, Algérie
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-4">
                Produit
              </div>
              <ul className="space-y-2.5 text-[0.875rem] text-muted-foreground">
                {[
                  { label: "Fonctionnalités", href: "/fonctionnalites" },
                  { label: "Modules",          href: "/modules" },
                  { label: "Offres",           href: "/offres" },
                  { label: "Sécurité",         href: "/securite" },
                  { label: "Mises à jour",     href: "/mises-a-jour" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-4">
                Ressources
              </div>
              <ul className="space-y-2.5 text-[0.875rem] text-muted-foreground">
                {[
                  { label: "Documentation",     href: "/documentation" },
                  { label: "Ressources",         href: "/ressources" },
                  { label: "FAQ",                href: "/faq" },
                  { label: "À propos",           href: "/about" },
                  { label: "Connexion",          href: "/login" },
                  { label: "Demander un accès",  href: "/demander-acces" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-4">
                Légal
              </div>
              <ul className="space-y-2.5 text-[0.875rem] text-muted-foreground">
                {[
                  { label: "Mentions légales",           href: "/legal/mentions-legales" },
                  { label: "Politique de confidentialité", href: "/legal/confidentialite" },
                  { label: "CGU",                        href: "/legal/cgu" },
                  { label: "RGPD",                       href: "/legal/rgpd" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted-foreground">
            <span>
              © {new Date().getFullYear()} Swan GMAO — Open Source · Licence MIT
            </span>
            <span className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5" />
              Conçu pour l'industrie algérienne · Fabriqué avec précision
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
