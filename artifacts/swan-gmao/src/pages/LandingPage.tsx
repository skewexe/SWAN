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
  Headphones,
  Landmark,
  Factory,
  FileText,
  Sparkles,
  Workflow,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const sectionIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.55 },
};

const PLANS = [
  {
    name: "Essentiel",
    price: "Sur demande",
    period: "",
    description: "Pour les équipes qui veulent structurer l'opérationnel sans complexité inutile.",
    icon: Building2,
    features: ["Jusqu'à 50 équipements", "5 techniciens", "OT & préventif", "Support standard"],
    cta: "Parler à un conseiller",
    highlighted: false,
  },
  {
    name: "Entreprise",
    price: "Sur demande",
    period: "",
    description: "Le standard SWAN pour les sites industriels qui exigent contrôle et visibilité.",
    icon: Factory,
    features: ["Multi-sites", "RBAC avancé", "Calendrier maintenance", "Rapports & KPI", "Import CSV / Excel"],
    cta: "Démarrer un projet",
    highlighted: true,
  },
  {
    name: "Groupe",
    price: "Sur mesure",
    period: "",
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

export default function LandingPage() {
  return (
    <div className="w-full bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(10,109,255,0.14),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex items-center justify-between rounded-full border border-border/70 bg-card/70 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={swanLogo} alt="SWAN" className="h-8 w-auto" />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-[0.18em] uppercase">Swan GMAO</div>
                <div className="text-xs text-muted-foreground">Industrial maintenance platform</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">À propos</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            </div>
            <Link href="/register">
              <Button className="rounded-full px-5">Commencer</Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-10 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:pb-28 lg:pt-16">
          <motion.div initial="initial" animate="whileInView" variants={{}} className="max-w-3xl">
            <motion.div {...fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-primary" />
              GMAO premium pensée pour les industriels
            </motion.div>
            <motion.h1 {...fadeInUp} className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              L’excellence opérationnelle
              <span className="block text-muted-foreground">pour la maintenance industrielle.</span>
            </motion.h1>
            <motion.p {...fadeInUp} className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              SWAN structure vos équipements, vos interventions et vos équipes dans une interface sobre,
              claire et conçue pour les exigences des groupes industriels.
            </motion.p>
            <motion.div {...fadeInUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-12 rounded-full px-7 text-base font-medium">
                  Demander un accès
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard?mode=demo">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base font-medium">
                  Voir la démonstration
                </Button>
              </Link>
            </motion.div>
            <motion.div {...fadeInUp} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["99.9%", "Disponibilité"],
                ["Multi-sites", "Pilotage"],
                ["RBAC", "Contrôle"],
                ["24/7", "Support"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-md">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div {...sectionIn} className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-primary/5 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-2xl shadow-black/20">
              <div className="border-b border-border/60 px-6 py-4">
                <div className="text-sm font-medium text-muted-foreground">Vue direction maintenance</div>
                <div className="mt-1 text-2xl font-semibold">Pilotage industriel</div>
              </div>
              <div className="grid gap-4 p-6">
                <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Disponibilité globale</div>
                      <div className="mt-1 text-3xl font-semibold">98.6%</div>
                    </div>
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-muted">
                    <div className="h-2 w-[86%] rounded-full bg-primary" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["OT ouverts", "14"],
                    ["Préventif en retard", "03"],
                    ["Sites actifs", "08"],
                    ["Pièces critiques", "21"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-border/70 bg-background/40 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                      <div className="mt-3 text-2xl font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Maintenance préventive</div>
                      <div className="text-sm text-muted-foreground">Calendrier et exécution sous contrôle</div>
                    </div>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {["Inspection ligne 2", "Graissage atelier A", "Contrôle sécurité site Nord"].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                        <span className="text-sm">{item}</span>
                        <span className="text-xs text-muted-foreground">Planifié</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <motion.div {...sectionIn} className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Plateforme</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Une interface sobre, crédible et conçue pour les équipes qui opèrent.
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Pas d’effets gadgets. Juste une expérience premium, lisible et adaptée à un usage quotidien en environnement industriel.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CAPABILITIES.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-3xl border border-border/70 bg-card/80 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background/60">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <motion.div {...sectionIn} className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Offres</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Une structure claire pour passer à l’échelle.</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className={`rounded-3xl border p-6 ${plan.highlighted ? "border-primary/60 bg-primary/5" : "border-border/70 bg-card/80"}`}
                >
                  {plan.highlighted && (
                    <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Recommandé pour les sites multi-équipes
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background/60">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="mt-6 text-3xl font-semibold">{plan.price}</div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="mt-8 h-11 w-full rounded-full" variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-[2rem] border border-border/70 bg-card/80 p-8 text-center md:p-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">SWAN GMAO</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Prêt pour une image plus mature et plus exigeante.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Pensé pour les directions industrielles, les équipes de maintenance et les environnements où la sobriété inspire confiance.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-12 rounded-full px-7 text-base">Créer un espace</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">Se connecter</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
