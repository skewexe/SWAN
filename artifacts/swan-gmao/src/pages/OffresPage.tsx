import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Building2, Factory, Landmark, Mail, Phone } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const PLANS = [
  {
    name: "Essentiel",
    tagline: "Pour structurer l'opérationnel",
    description: "Idéal pour les PME industrielles souhaitant digitaliser leur maintenance sans complexité inutile.",
    icon: Building2,
    color: "#38BDF8",
    features: [
      "Jusqu'à 50 équipements",
      "5 techniciens",
      "Ordres de travail & préventif",
      "Gestion des pièces de rechange",
      "Tableau de bord KPIs",
      "Import CSV / Excel",
      "Support standard (email)",
    ],
    cta: "Parler à un conseiller",
    highlighted: false,
    badge: null,
  },
  {
    name: "Entreprise",
    tagline: "Le standard SWAN industriel",
    description: "Pour les sites industriels qui exigent contrôle total, visibilité multi-sites et reporting direction.",
    icon: Factory,
    color: "#0A6DFF",
    features: [
      "Équipements illimités",
      "Multi-sites & multi-zones",
      "RBAC avancé (5 rôles & droits)",
      "Calendrier de maintenance",
      "Rapports & KPIs complets",
      "Import CSV / Excel avancé",
      "WhatsApp & Telegram Gateway",
      "Sous-traitance & fiches techniciens",
      "Support prioritaire",
    ],
    cta: "Démarrer un projet",
    highlighted: true,
    badge: "Recommandé",
  },
  {
    name: "Groupe",
    tagline: "Déploiement grande échelle",
    description: "Pour les organisations à forte maturité industrielle avec besoins multi-entités et intégrations SI.",
    icon: Landmark,
    color: "#8B5CF6",
    features: [
      "Tout l'offre Entreprise inclus",
      "On-premise ou cloud dédié",
      "SLA contractuel dédié",
      "Accompagnement & formation sur site",
      "Intégrations SI (ERP, SCADA)",
      "API & connecteurs custom",
      "Support 24/7 avec astreinte",
      "Audit & conformité réglementaire",
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
    badge: null,
  },
];

const FAQ_OFFRES = [
  { q: "Comment choisir entre les offres ?", a: "Notre équipe vous accompagne dans le choix selon votre taille (nombre d'équipements, techniciens), vos sites industriels et vos besoins en reporting. Un appel de 30 minutes suffit généralement pour identifier l'offre adaptée." },
  { q: "Est-il possible de changer d'offre ultérieurement ?", a: "Oui. SWAN est conçu pour évoluer avec votre organisation. La migration d'une offre à l'autre se fait sans perte de données, accompagnée par notre équipe technique." },
  { q: "Quelle est la durée minimale d'engagement ?", a: "Contactez notre équipe pour discuter des modalités contractuelles adaptées à votre organisation. Nous proposons des formules flexibles." },
  { q: "Les données sont-elles hébergées en Algérie ?", a: "Oui, pour les clients qui le requièrent. L'offre Groupe inclut par défaut le mode on-premise sur vos serveurs ou dans un datacenter algérien certifié." },
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Offres</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
              Une offre adaptée
              <br /> <span className="text-primary">à chaque organisation.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Nos tarifs sont établis sur devis, adaptés à vos besoins réels. Contactez-nous pour obtenir une proposition personnalisée.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.07, ease: easeOut }}
              className={`relative rounded-3xl border p-7 flex flex-col ${
                plan.highlighted
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_rgba(10,109,255,0.15),0_24px_64px_-12px_rgba(10,109,255,0.15)]"
                  : "border-border/60 bg-card/70"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-semibold text-primary-foreground tracking-wide whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: plan.color + "18", border: `1px solid ${plan.color}40` }}>
                  <plan.icon className="h-5 w-5" style={{ color: plan.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-lg">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">{plan.tagline}</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{plan.description}</p>

              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: plan.color + "20" }}>
                      <Check className="h-2.5 w-2.5" style={{ color: plan.color }} strokeWidth={2.5} />
                    </div>
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/demander-acces">
                <Button
                  className="w-full rounded-full h-10 text-sm font-medium"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Contact note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
          className="mt-8 rounded-2xl border border-border/50 bg-card/40 p-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Toutes nos offres sont proposées sur devis personnalisé. Contactez-nous pour discuter de vos besoins.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="mailto:contact@swan-gmao.dz" className="flex items-center gap-2 text-primary hover:underline">
              <Mail className="h-4 w-4" strokeWidth={1.5} /> contact@swan-gmao.dz
            </a>
            <a href="tel:+213778628449" className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="h-4 w-4" strokeWidth={1.5} /> +213 (0) 7 78 62 84 49
            </a>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="text-center mb-10">
            <h2 className="text-2xl font-semibold">Questions fréquentes sur les offres</h2>
          </motion.div>
          <div className="space-y-4">
            {FAQ_OFFRES.map((item, idx) => (
              <motion.div key={item.q} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05, ease: easeOut }} className="rounded-2xl border border-border/50 bg-card/60 p-5">
                <div className="font-medium text-foreground mb-2">{item.q}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{item.a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
          <h2 className="text-3xl font-semibold tracking-tight">Parlons de votre projet.</h2>
          <p className="mt-4 text-muted-foreground">Un conseiller SWAN répond dans les 24h ouvrées.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/demander-acces">
              <Button size="lg" className="rounded-full px-8 h-12">Demander un accès <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
