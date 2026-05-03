import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, ShieldCheck, Settings, Users, BarChart3, Box, Check, Zap, Building2, Headphones } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const PLANS = [
  {
    name: "Starter",
    price: "15 000",
    period: "DA / mois",
    description: "Idéal pour les PME et ateliers de petite taille.",
    icon: Zap,
    color: "#38BDF8",
    features: [
      "Jusqu'à 50 équipements",
      "5 techniciens",
      "Ordres de travail illimités",
      "Maintenance préventive",
      "Gestion du stock",
      "Support par email",
    ],
    cta: "Démarrer",
    highlighted: false,
  },
  {
    name: "Industriel",
    price: "45 000",
    period: "DA / mois",
    description: "Pour les unités de production et sites industriels.",
    icon: Building2,
    color: "#0A6DFF",
    features: [
      "Équipements illimités",
      "20 techniciens",
      "Tout ce qui est dans Starter",
      "Rapports & KPIs avancés",
      "Gestion multi-sites",
      "API & intégrations ERP",
      "Support prioritaire 5j/7",
    ],
    cta: "Choisir ce plan",
    highlighted: true,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    period: "",
    description: "Solution complète pour les grands groupes industriels.",
    icon: Headphones,
    color: "#22C55E",
    features: [
      "Tout ce qui est dans Industriel",
      "Techniciens illimités",
      "Déploiement on-premise disponible",
      "Formation & accompagnement",
      "SLA garanti 99.9%",
      "Account manager dédié",
      "Support 24/7",
    ],
    cta: "Nous contacter",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10"></div>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-4xl mx-auto space-y-8">
            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
              <img src={swanLogo} alt="SWAN Logo" className="h-20 md:h-28 w-auto" />
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
              L'Intelligence Industrielle <br/>
              <span className="text-primary">au Service de la Maintenance</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La plateforme GMAO de référence pour l'industrie algérienne. 
              Pilotez vos équipements, optimisez vos ressources et maximisez votre taux de disponibilité avec une précision chirurgicale.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-base font-semibold w-full sm:w-auto group">
                  Démarrer l'essai gratuit
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold w-full sm:w-auto">
                  Découvrir la solution
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="py-12 bg-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-foreground">99.9%</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Disponibilité</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-foreground">+500</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Usines équipées</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-foreground">-30%</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Temps d'arrêt</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-foreground">24/7</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Support local</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Un contrôle total sur vos opérations</h2>
            <p className="text-muted-foreground text-lg">Une suite complète d'outils conçue pour les exigences rigoureuses du milieu industriel.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Gestion des Actifs", desc: "Inventaire structuré, historique complet et suivi de criticité de chaque équipement.", icon: Settings },
              { title: "Ordres de Travail", desc: "Planification, assignation et suivi en temps réel des interventions correctives.", icon: Activity },
              { title: "Maintenance Préventive", desc: "Programmation automatique des routines d'inspection et de maintenance.", icon: ShieldCheck },
              { title: "Gestion des Stocks", desc: "Suivi des pièces de rechange, alertes de seuil minimum et valorisation.", icon: Box },
              { title: "Équipes & Techniciens", desc: "Affectation selon les compétences, suivi des charges de travail et disponibilités.", icon: Users },
              { title: "Rapports Décisionnels", desc: "Tableaux de bord dynamiques, calcul automatique du MTBF, MTTR et coûts.", icon: BarChart3 }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group">
                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-card border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Tarification</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Des offres adaptées à chaque industrie</h2>
              <p className="text-muted-foreground text-lg">Essai gratuit 30 jours · Sans engagement · Mise en production en 48h</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`relative flex flex-col rounded-2xl p-6 border transition-all ${
                    plan.highlighted
                      ? "border-primary/60 bg-primary/5 shadow-[0_0_40px_-8px_rgba(10,109,255,0.3)]"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                        LE PLUS POPULAIRE
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${plan.color}18` }}>
                      <Icon className="h-5 w-5" style={{ color: plan.color }} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  </div>

                  <div className="mb-2">
                    <span className="text-3xl font-bold text-foreground tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: plan.color }} strokeWidth={2.5} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <Button
                      className="w-full h-11 font-semibold"
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-10"
          >
            Tous les prix sont HT · Paiement en dinars algériens (DZD) · Facturation mensuelle ou annuelle
          </motion.p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à moderniser votre maintenance ?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Rejoignez les leaders de l'industrie algérienne qui font confiance à SWAN pour optimiser leur production.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-base font-semibold">
              Créer mon espace
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
