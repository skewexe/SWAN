import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, ShieldCheck, Server, Eye, Key, RefreshCw, Database, Globe, CheckCircle2 } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const PILLARS = [
  {
    icon: Key,
    title: "Authentification & contrôle d'accès",
    color: "#0A6DFF",
    items: [
      "Authentification par identifiant et mot de passe hashé (bcrypt)",
      "Sessions sécurisées côté serveur avec expiration",
      "Contrôle d'accès basé sur les rôles (RBAC) à 5 niveaux",
      "Permissions granulaires par module et par action",
      "Déconnexion automatique après inactivité",
    ],
  },
  {
    icon: Lock,
    title: "Chiffrement & transport",
    color: "#22C55E",
    items: [
      "Communications chiffrées en TLS 1.3 (HTTPS)",
      "Certificats SSL gérés automatiquement",
      "Variables sensibles stockées hors du code (secrets d'environnement)",
      "Aucun secret ou token dans les journaux applicatifs",
    ],
  },
  {
    icon: Database,
    title: "Base de données & stockage",
    color: "#F59E0B",
    items: [
      "PostgreSQL en production avec connexions poolées",
      "Données isolées par tenant",
      "Sauvegardes quotidiennes automatiques",
      "Politique de rétention et purge conforme aux obligations légales",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure & hébergement",
    color: "#38BDF8",
    items: [
      "Déploiement possible on-premise (sur vos propres serveurs)",
      "Option datacenter algérien pour conformité réglementaire locale",
      "Isolation réseau et segmentation des environnements",
      "Monitoring applicatif en temps réel",
      "Plan de reprise d'activité (PRA) documenté",
    ],
  },
  {
    icon: Eye,
    title: "Audit & traçabilité",
    color: "#8B5CF6",
    items: [
      "Journaux d'activité horodatés pour chaque action critique",
      "Traçabilité des modifications de données (qui, quoi, quand)",
      "Historique complet des interventions et OT non modifiable",
      "Export des journaux sur demande",
    ],
  },
  {
    icon: RefreshCw,
    title: "Mises à jour & continuité",
    color: "#EC4899",
    items: [
      "Mises à jour de sécurité déployées sans interruption de service",
      "Processus de validation avant chaque déploiement en production",
      "Tests de régression automatisés",
      "SLA de disponibilité contractuellement défini (offre Groupe)",
    ],
  },
];

const COMPLIANCE = [
  "Protection des données conformément à la loi algérienne 18-07 relative à la protection des personnes physiques dans le traitement des données personnelles",
  "Conformité aux exigences du Ministère de la Numérisation pour les systèmes d'information critiques",
  "Option d'hébergement local (on-premise) pour conformité sectorielle (énergie, industrie réglementée)",
  "Politique de confidentialité transparente et accessible",
  "Droit d'accès, de rectification et de suppression des données personnelles",
  "Registre des traitements disponible sur demande",
];

export default function SecuritePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Sécurité</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Vos données industrielles
              <br /> <span className="text-primary">protégées par design.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              SWAN applique les meilleures pratiques de sécurité à chaque couche de la plateforme — de l'authentification au stockage, en passant par le transport et la traçabilité.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security pillars */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: easeOut }}
              className="rounded-3xl border border-border/60 bg-card/70 p-7"
            >
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: pillar.color + "18", border: `1px solid ${pillar.color}40` }}>
                <pillar.icon className="h-5 w-5" style={{ color: pillar.color }} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground mb-4">{pillar.title}</h3>
              <ul className="space-y-2.5">
                {pillar.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: pillar.color }} strokeWidth={1.5} />
                    <span className="text-sm text-foreground/80 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="max-w-2xl mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Conformité réglementaire</p>
            <h2 className="text-3xl font-semibold tracking-tight">Conforme au cadre légal algérien.</h2>
          </motion.div>
          <div className="grid gap-3 md:grid-cols-2">
            {COMPLIANCE.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04, ease: easeOut }} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/40 px-5 py-4">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground/85 leading-snug">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
          <h2 className="text-3xl font-semibold tracking-tight">Des questions sur la sécurité ?</h2>
          <p className="mt-4 text-muted-foreground">Notre équipe technique répond à toutes vos exigences de conformité et de sécurité.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/demander-acces">
              <Button size="lg" className="rounded-full px-8 h-12">Parler à notre équipe <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/legal/rgpd">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Politique RGPD</Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
