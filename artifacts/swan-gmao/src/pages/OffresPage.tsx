import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Terminal, Package, Cpu, Github, Download, Check,
  ArrowRight, Server, Globe, Database, Shield, Zap, Code2,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const DEPLOY_METHODS = [
  {
    icon: Terminal,
    title: "Docker Compose",
    badge: "Recommandé",
    highlighted: true,
    color: "#0A6DFF",
    description: "La façon la plus rapide de déployer SWAN. Une seule commande suffit — PostgreSQL, l'API et le frontend sont lancés automatiquement.",
    steps: [
      { cmd: "git clone https://github.com/swan-gmao/swan-gmao.git", desc: "Cloner le dépôt" },
      { cmd: "cp .env.example .env", desc: "Configurer les variables" },
      { cmd: "docker compose up -d", desc: "Lancer tous les services" },
      { cmd: "open http://localhost:3000", desc: "Accéder à l'interface" },
    ],
    prereqs: ["Docker Desktop 4.x+", "4 Go RAM minimum", "Linux / macOS / Windows WSL2"],
  },
  {
    icon: Package,
    title: "Electron Desktop",
    badge: ".exe · .AppImage · .dmg",
    highlighted: false,
    color: "#8B5CF6",
    description: "Application bureau installable directement. Base de données SQLite embarquée, aucune dépendance externe. Idéal pour les déploiements terrain isolés.",
    steps: [
      { cmd: "Télécharger le fichier depuis GitHub Releases", desc: "Choisir votre plateforme" },
      { cmd: "swan-gmao-setup.exe (Windows)", desc: "Installer avec l'assistant NSIS" },
      { cmd: "swan-gmao.AppImage (Linux)", desc: "chmod +x puis exécuter" },
      { cmd: "Lancer SWAN depuis le bureau", desc: "Prêt en 30 secondes" },
    ],
    prereqs: ["Windows 10/11 x64", "Ubuntu 20.04+ / Debian 11+", "macOS 12+ (Apple Silicon ou Intel)"],
  },
  {
    icon: Cpu,
    title: "On-premise (Node.js)",
    badge: "Serveur dédié",
    highlighted: false,
    color: "#22C55E",
    description: "Déploiement manuel sur votre serveur Linux existant avec Node.js 24 et PostgreSQL 15. Contrôle total de l'infrastructure.",
    steps: [
      { cmd: "pnpm install", desc: "Installer les dépendances" },
      { cmd: "pnpm --filter @workspace/db run push", desc: "Créer le schéma de base de données" },
      { cmd: "pnpm run build", desc: "Compiler frontend + API" },
      { cmd: "pnpm run start", desc: "Démarrer en production" },
    ],
    prereqs: ["Node.js 24+", "PostgreSQL 15+", "pnpm 9+", "Nginx (reverse proxy)"],
  },
];

const FEATURES_OS = [
  { icon: Code2,    title: "Licence MIT",           desc: "Utilisez, modifiez, redistribuez librement — même pour usage commercial." },
  { icon: Database, title: "Données chez vous",      desc: "PostgreSQL local ou votre propre cloud. Aucune télémétrie, aucun SaaS obligatoire." },
  { icon: Globe,    title: "Multi-protocoles IoT",   desc: "MQTT, Modbus TCP, OPC-UA, REST, LoRaWAN — adaptateur universel intégré." },
  { icon: Shield,   title: "RBAC complet",           desc: "5 rôles granulaires, multi-sites, multi-zones, aucun compromis sécuritaire." },
  { icon: Zap,      title: "Déploiement en 5 min",   desc: "Docker Compose ou Electron — zéro configuration avancée nécessaire." },
  { icon: Server,   title: "API REST complète",      desc: "Tous les modules exposés via API — intégrez avec vos ERP, SCADA, BI." },
];

const FAQ = [
  { q: "Est-ce vraiment gratuit pour toujours ?", a: "Oui. SWAN est sous licence MIT — aucun frais, aucun abonnement, aucune version premium cachée. Tout le code est sur GitHub." },
  { q: "Puis-je modifier le code pour mon entreprise ?", a: "Absolument. La licence MIT vous y autorise. Vous pouvez forker, adapter et déployer votre version interne sans aucune restriction." },
  { q: "Quel support est disponible ?", a: "Support communautaire via GitHub Issues et Discussions. Pour un support professionnel, vous pouvez engager un prestataire de votre choix." },
  { q: "L'application Electron inclut-elle PostgreSQL ?", a: "La version Electron embarque SQLite pour un déploiement zéro-dépendance. Pour les déploiements multi-utilisateurs, utilisez Docker ou l'installation Node.js avec PostgreSQL." },
];

export default function OffresPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-emerald-400 text-[12px] font-semibold tracking-wide mb-6">
              <Github className="h-3.5 w-3.5" />
              100% Open Source · Licence MIT · Gratuit pour toujours
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
              Déployez SWAN<br />
              <span className="text-primary">sur votre infrastructure.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choisissez votre méthode de déploiement. Docker, Electron ou on-premise — vos données restent chez vous, sans aucun frais.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 rounded-full px-8 gap-2">
                  <Github className="h-4 w-4" /> Voir sur GitHub
                </Button>
              </a>
              <Link href="/documentation">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8">
                  Documentation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Deploy methods */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {DEPLOY_METHODS.map((m, idx) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.07, ease: easeOut }}
              className={`relative rounded-3xl border p-7 flex flex-col ${
                m.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(10,109,255,0.15),0_24px_64px_-12px_rgba(10,109,255,0.15)]"
                  : "border-border/60 bg-card/70"
              }`}
            >
              {m.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap"
                  style={{ background: m.color + "20", borderColor: m.color + "40", color: m.color }}>
                  {m.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: m.color + "18", border: `1px solid ${m.color}40` }}>
                  <m.icon className="h-6 w-6" style={{ color: m.color }} strokeWidth={1.5} />
                </div>
                <div className="font-semibold text-foreground text-xl">{m.title}</div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{m.description}</p>

              {/* Steps */}
              <div className="space-y-3 flex-1 mb-6">
                {m.steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: m.color + "20", color: m.color }}>
                      {i + 1}
                    </span>
                    <div>
                      <code className="text-[11px] font-mono text-foreground/80 bg-muted/40 px-2 py-0.5 rounded-lg block">{s.cmd}</code>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prerequisites */}
              <div className="rounded-2xl bg-background/40 border border-border/30 p-4 mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Prérequis</div>
                <ul className="space-y-1">
                  {m.prereqs.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/register">
                <Button
                  className={`w-full rounded-full gap-2 ${!m.highlighted ? "bg-card border border-border/60 text-foreground hover:bg-muted" : ""}`}
                  variant={m.highlighted ? "default" : "outline"}
                >
                  <Download className="h-4 w-4" /> Commencer
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Open source features */}
      <section className="border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}
            className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">Inclus dans SWAN open source</p>
            <h2 className="text-3xl font-semibold tracking-tight">Tout est inclus. Sans restriction.</h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_OS.map((f, idx) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: easeOut }}
                className="rounded-2xl border border-border/40 bg-card/60 p-5 flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}
          className="text-center mb-10">
          <h2 className="text-2xl font-semibold">Questions fréquentes</h2>
        </motion.div>
        <div className="space-y-4">
          {FAQ.map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: easeOut }}
              className="rounded-2xl border border-border/40 bg-card/60 p-5">
              <div className="font-semibold text-sm text-foreground mb-2">{item.q}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{item.a}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-card/30">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
            <h2 className="text-3xl font-semibold tracking-tight">Prêt à déployer SWAN ?</h2>
            <p className="mt-4 text-muted-foreground">Gratuit, open source, vos données chez vous.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 rounded-full px-8 gap-2">
                  <Github className="h-4 w-4" /> GitHub — Clone & Deploy
                </Button>
              </a>
              <Link href="/documentation">
                <Button size="lg" variant="outline" className="h-12 rounded-full px-8">
                  Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
