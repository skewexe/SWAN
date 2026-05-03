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
  Check,
  Building2,
  Landmark,
  Factory,
  FileText,
  Sparkles,
  Workflow,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";

const PLANS = [
  {
    name: "Essentiel",
    price: "Sur demande",
    description: "Pour les équipes qui veulent structurer l'opérationnel sans complexité inutile.",
    icon: Building2,
    features: ["Jusqu'à 50 équipements", "5 techniciens", "OT & préventif", "Support standard"],
    cta: "Parler à un conseiller",
    highlighted: false,
  },
  {
    name: "Entreprise",
    price: "Sur demande",
    description: "Le standard SWAN pour les sites industriels qui exigent contrôle et visibilité.",
    icon: Factory,
    features: ["Multi-sites", "RBAC avancé", "Calendrier maintenance", "Rapports & KPI", "Import CSV / Excel"],
    cta: "Démarrer un projet",
    highlighted: true,
  },
  {
    name: "Groupe",
    price: "Sur mesure",
    description: "Déploiement complet pour les organisations à forte maturité industrielle.",
    icon: Landmark,
    features: ["On-premise", "SLA dédié", "Accompagnement", "Intégrations SI", "Support 24/7"],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
];

const CAPABILITIES = [
  { title: "Pilotage des actifs", desc: "Équipements, pièces machine, photos, localisations, historique complet.", icon: Settings },
  { title: "Ordres de travail", desc: "Affectation par technicien, zone, machine ou type avec contrôle d'exécution.", icon: Workflow },
  { title: "Maintenance préventive", desc: "Planification lisible, alertes et calendrier industriel exploitable.", icon: ShieldCheck },
  { title: "Stocks & pièces", desc: "Gestion des consommations, seuils critiques et suivi précis des pièces.", icon: Box },
  { title: "Équipes & RBAC", desc: "Profils réels, droits clairs et séparation des responsabilités.", icon: Users },
  { title: "Reporting direction", desc: "MTBF, MTTR, disponibilité, coûts et arbitrage opérationnel.", icon: BarChart3 },
];

const easeOut = "easeOut" as const;

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans antialiased">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_900px_at_60%_-80px,rgba(10,109,255,0.13),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        {/* Floating Nav */}
        <div className="mx-auto max-w-7xl px-6 pt-6 lg:px-8">
          <div className="flex items-center justify-between rounded-full border border-border/60 bg-card/60 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={swanLogo} alt="SWAN" className="h-7 w-auto" />
              <div className="hidden sm:block">
                <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground">Swan GMAO</div>
                <div className="text-[10px] text-muted-foreground leading-none">Industrial maintenance platform</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">À propos</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            </div>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5">Commencer</Button>
            </Link>
          </div>
        </div>

        {/* Hero Content */}
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
              <span className="block text-muted-foreground">pour votre maintenance.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.13, ease: easeOut }}
              className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground"
            >
              SWAN structure vos équipements, vos interventions et vos équipes dans une interface
              sobre, claire et conçue pour les exigences des groupes industriels.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: easeOut }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/register">
                <Button size="lg" className="h-11 rounded-full px-7 text-[0.9rem] font-medium">
                  Demander un accès
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-[0.9rem] font-medium">
                  Voir la démo
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32, ease: easeOut }}
              className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                ["99.9%", "Disponibilité"],
                ["Multi-sites", "Pilotage"],
                ["RBAC", "Contrôle d'accès"],
                ["24/7", "Support local"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-sm">
                  <div className="text-xl font-semibold tracking-tight">{value}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
            className="relative hidden lg:block"
          >
            <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-primary/6 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)]">
              <div className="border-b border-border/50 px-6 py-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Vue direction maintenance</div>
                <div className="mt-0.5 text-xl font-semibold">Pilotage industriel</div>
              </div>
              <div className="space-y-3 p-5">
                {/* Availability bar */}
                <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Disponibilité globale</div>
                      <div className="mt-1 text-3xl font-semibold">98.6%</div>
                    </div>
                    <Activity className="h-5 w-5 text-primary opacity-80" />
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted/60">
                    <div className="h-1.5 w-[86%] rounded-full bg-primary" />
                  </div>
                </div>
                {/* KPI grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["OT ouverts", "14"],
                    ["Préventif en retard", "03"],
                    ["Sites actifs", "08"],
                    ["Pièces critiques", "21"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-border/50 bg-background/35 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                      <div className="mt-2 text-2xl font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
                {/* Preventive list */}
                <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Maintenance préventive</div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {["Inspection ligne 2", "Graissage atelier A", "Contrôle sécurité Nord"].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-xl border border-border/40 px-3.5 py-2.5">
                        <span className="text-[13px]">{item}</span>
                        <span className="text-[11px] text-muted-foreground">Planifié</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Plateforme</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sobre, lisible, opérationnel.
          </h2>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
            Pas d'effets gadgets. Juste une expérience premium adaptée à un usage quotidien en environnement industriel exigeant.
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

      {/* ── HORIZONTAL METRICS BAR ── */}
      <div className="border-y border-border/50 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              ["−30%", "Réduction des temps d'arrêt"],
              ["+500", "Sites déployés"],
              ["99.9%", "SLA garanti"],
              ["48h", "Mise en production"],
            ].map(([val, desc]) => (
              <div key={val} className="text-center">
                <div className="text-3xl font-semibold tracking-tight">{val}</div>
                <div className="mt-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Offres</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Une structure claire pour passer à l'échelle.</h2>
          <p className="mt-3 text-[1.05rem] text-muted-foreground">Essai gratuit 30 jours · Sans engagement · Mise en production en 48h</p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.07, ease: easeOut }}
                className={`flex flex-col rounded-3xl border p-7 ${
                  plan.highlighted
                    ? "border-primary/50 bg-primary/[0.06]"
                    : "border-border/60 bg-card/70"
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-5 inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                    Recommandé
                  </div>
                )}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
                    <Icon className="h-[1.1rem] w-[1.1rem] text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{plan.name}</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{plan.description}</p>
                  </div>
                </div>

                <div className="mt-6 text-[1.9rem] font-semibold tracking-tight">{plan.price}</div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                      <Check className="mt-[1px] h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button
                    className="mt-7 h-10 w-full rounded-full text-[13px] font-medium"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[12px] text-muted-foreground">
          Prix en dinars algériens (DZD) · Facturation mensuelle ou annuelle · TVA non incluse
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-8 py-14 text-center md:px-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">SWAN GMAO</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Élevez le standard de votre maintenance industrielle.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">
            Pensé pour les directions industrielles et les équipes de terrain. Une interface qui inspire confiance, pas des animations gadgets.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-11 rounded-full px-8 text-[0.9rem]">Créer un espace</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 rounded-full px-8 text-[0.9rem]">Se connecter</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <img src={swanLogo} alt="SWAN" className="h-6 w-auto opacity-60 grayscale" />
              <span className="text-[13px] text-muted-foreground">
                © {new Date().getFullYear()} SWAN Industrial Intelligence
              </span>
            </div>
            <div className="flex gap-7 text-[13px] text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">Mission</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">Support</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Espace client</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
