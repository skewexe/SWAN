import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const MODULE_GROUPS = [
  {
    title: "Gestion technique des équipements",
    color: "#0A6DFF",
    modules: [
      { name: "Gestion des équipements et organes associés", desc: "Référentiel complet du parc machine avec arborescence, photos, données techniques et criticité." },
      { name: "Gestion des pièces de rechange associées", desc: "Catalogue des pièces par équipement avec lien au stock central, références et unités." },
      { name: "Gestion des gammes opératoires", desc: "Définition des procédures d'intervention type pour une standardisation des pratiques." },
      { name: "Code QR par équipement", desc: "Génération automatique de QR codes imprimables pour identification terrain instantanée." },
    ],
  },
  {
    title: "Gestion des interventions",
    color: "#38BDF8",
    modules: [
      { name: "Interventions préventives et curatives", desc: "Création, suivi et clôture des ordres de travail avec historique complet et traçabilité." },
      { name: "Demandes de travaux et bons de travaux", desc: "Workflow complet de la demande initiale à la clôture technique et administrative." },
      { name: "Ouverture, lancement, suspension, clôture", desc: "Contrôle granulaire du cycle de vie de chaque intervention avec dates et responsables." },
      { name: "Pointage par codes barres", desc: "Saisie terrain rapide des mouvements et des heures via scanner ou QR code mobile." },
      { name: "Gestion de la sous-traitance", desc: "Suivi des prestataires externes, contrats et performances avec évaluation post-intervention." },
      { name: "Motifs d'intervention et statistiques par cause", desc: "Classification des pannes par cause racine pour analyse ABC et plan d'action préventif." },
    ],
  },
  {
    title: "Maintenance préventive & planification",
    color: "#22C55E",
    modules: [
      { name: "Génération automatique des bons préventifs", desc: "Création automatique des OT à l'approche de chaque échéance selon les plans configurés." },
      { name: "Planning atelier et disponibilité des ressources", desc: "Visualisation calendaire des interventions planifiées et des disponibilités techniciens." },
      { name: "Planification RH, matérielle et activités", desc: "Coordination des ressources humaines et matérielles sur les créneaux d'intervention." },
    ],
  },
  {
    title: "Ressources humaines & matérielles",
    color: "#8B5CF6",
    modules: [
      { name: "Gestion des ressources liées à la maintenance", desc: "Référentiel des compétences, équipements de contrôle et outillage spécialisé." },
      { name: "Moyens humains et moyens matériels", desc: "Gestion du personnel de maintenance et des équipements supports d'intervention." },
    ],
  },
  {
    title: "Indicateurs & reporting",
    color: "#F59E0B",
    modules: [
      { name: "Indicateurs MTTR, MTBF et indice de réactivité", desc: "Calcul en temps réel des KPIs fondamentaux de la performance maintenance." },
      { name: "Analyse de l'utilisation de la main d'œuvre", desc: "Répartition des heures par technicien, type d'intervention et équipement." },
      { name: "ABC des coûts de revient et causes de pannes", desc: "Classement Pareto des équipements les plus coûteux et des causes de panne les plus fréquentes." },
      { name: "Consommations pièces par machine, structure et référence", desc: "Traçabilité fine des consommations de pièces pour optimisation des stocks." },
      { name: "État des coûts de maintenance par équipement", desc: "Valorisation de la maintenance (main-d'œuvre + pièces + immobilisation) par actif." },
      { name: "Historique des interventions par équipement", desc: "Chronologie complète des maintenances réalisées avec durées, intervenants et coûts." },
      { name: "Classement des équipements par nombre d'interventions", desc: "Identification rapide des équipements les plus défaillants pour arbitrage budgétaire." },
    ],
  },
];

export default function ModulesPage() {
  const totalModules = MODULE_GROUPS.reduce((s, g) => s + g.modules.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Modules</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              {totalModules} modules pour couvrir
              <br className="hidden sm:block" /> <span className="text-primary">tout le périmètre CMMS.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              SWAN est une GMAO complète qui couvre toutes les fonctions attendues d'un CMMS industriel : gestion technique, interventions, ressources, planning, indicateurs et éditions d'états.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demander-acces">
                <Button size="lg" className="rounded-full px-8 h-12">Demander un accès <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Link href="/fonctionnalites">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Détail des fonctionnalités</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Module groups */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8 space-y-12">
        {MODULE_GROUPS.map((group, gidx) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: gidx * 0.04, ease: easeOut }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-2 w-2 rounded-full" style={{ background: group.color }} />
              <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-xs text-muted-foreground shrink-0">{group.modules.length} module{group.modules.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.modules.map((mod, midx) => (
                <motion.div
                  key={mod.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: midx * 0.03, ease: easeOut }}
                  className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 px-5 py-4 hover:border-primary/25 transition-colors"
                >
                  <div className="mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: group.color + "18" }}>
                    <Check className="h-3.5 w-3.5" style={{ color: group.color }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{mod.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{mod.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-card/30 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
            <h2 className="text-3xl font-semibold tracking-tight">Besoin d'un module spécifique ?</h2>
            <p className="mt-4 text-muted-foreground">Notre équipe peut développer des modules sur mesure pour s'adapter à vos processus métier.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/demander-acces">
                <Button size="lg" className="rounded-full px-8 h-12">Parler à un expert <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
