import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageSquare, Book, Settings2, Banknote, ShieldCheck } from "lucide-react";

const easeOut = "easeOut" as const;

const FAQ_SECTIONS = [
  {
    id: "product",
    icon: Book,
    title: "Produit & fonctionnalités",
    items: [
      {
        q: "Qu'est-ce qu'une GMAO et pourquoi en ai-je besoin ?",
        a: "Une GMAO (Gestion de Maintenance Assistée par Ordinateur) centralise la gestion des équipements, des ordres de travail, des équipes et des pièces. Elle remplace les fichiers Excel et les carnets papier par une plateforme unique qui réduit les temps d'arrêt, améliore la disponibilité des actifs et donne une visibilité complète aux directions industrielles.",
      },
      {
        q: "SWAN est-il adapté à mon secteur industriel ?",
        a: "SWAN est pensé pour l'industrie lourde : pétrole & gaz, sidérurgie, cimenteries, agroalimentaire, production d'énergie et eau/assainissement. Le modèle multi-sites, les zones, les profils de compétences et les fréquences de maintenance couvrent les besoins des complexes les plus exigeants.",
      },
      {
        q: "Quelles sont les principales fonctionnalités incluses ?",
        a: "SWAN inclut : la gestion des équipements (actifs, historique, photos), les ordres de travail (corrective, préventive, prédictive, inspection), la maintenance préventive planifiée avec calendrier, la gestion du stock & pièces avec alertes, les profils et rôles RBAC (5 niveaux), les KPIs direction (MTBF, MTTR, disponibilité, coûts), un calendrier industriel mensuel/hebdomadaire, et les rapports exportables.",
      },
      {
        q: "L'interface est-elle accessible sur mobile et tablette ?",
        a: "Oui. L'interface est entièrement responsive. Les techniciens peuvent consulter leurs ordres de travail et mettre à jour les statuts depuis n'importe quel appareil. Les superviseurs disposent d'une vue compacte optimisée pour les tablettes sur le terrain.",
      },
      {
        q: "Est-il possible de gérer plusieurs sites depuis une seule interface ?",
        a: "Oui, le multi-sites est natif dans SWAN. Chaque site peut avoir ses propres zones, équipements, équipes et plans de maintenance, tout en restant visible dans une vue consolidée pour les managers et la direction.",
      },
    ],
  },
  {
    id: "deploy",
    icon: Settings2,
    title: "Déploiement & intégration",
    items: [
      {
        q: "Comment se déroule la mise en production ?",
        a: "Le déploiement standard se fait en 48h : (1) configuration du compte et des sites, (2) import des équipements via CSV/Excel, (3) création des équipes et attribution des rôles, (4) paramétrage des plans de maintenance préventive. Notre équipe vous accompagne à chaque étape.",
      },
      {
        q: "Puis-je importer mes données existantes depuis Excel ?",
        a: "Oui. SWAN dispose d'un import CSV/Excel natif pour les équipements, les techniciens, les stocks et les plans de maintenance. Un template est fourni, avec validation ligne par ligne et rapport d'erreurs avant confirmation.",
      },
      {
        q: "Une formation est-elle nécessaire pour les équipes terrain ?",
        a: "L'interface est conçue pour être lisible sans formation longue. Pour les techniciens, une demi-journée d'onboarding suffit généralement. Pour les managers et administrateurs, nous proposons une session de 2 à 4 heures couvrant la configuration, les KPIs et la gestion des équipes.",
      },
      {
        q: "SWAN s'intègre-t-il avec nos systèmes ERP ou SAP ?",
        a: "Des connecteurs vers les principaux ERP (SAP, Odoo, Sage) sont disponibles sur les offres Entreprise et Groupe via API REST. La configuration se fait avec votre équipe IT. Pour les besoins spécifiques, une intégration sur mesure peut être développée.",
      },
    ],
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "Sécurité & données",
    items: [
      {
        q: "Où sont hébergées les données ?",
        a: "Par défaut, les données sont hébergées sur des serveurs sécurisés en Europe (ISO 27001, RGPD). Pour les clients qui l'exigent, une option on-premise est disponible sur les offres Groupe : déploiement dans votre datacenter ou cloud privé, sous votre contrôle total.",
      },
      {
        q: "Comment fonctionne le contrôle d'accès (RBAC) ?",
        a: "SWAN dispose de 5 niveaux de rôle : Administrateur, Manager, Chef d'équipe, Technicien, Lecteur. Chaque rôle accède uniquement aux modules et actions dont il a besoin. Les droits sont configurables par site et par module. Aucun technicien ne peut modifier les configurations ou accéder aux données d'un autre site.",
      },
      {
        q: "Les données sont-elles sauvegardées automatiquement ?",
        a: "Oui. Des sauvegardes automatiques sont effectuées toutes les 6 heures, avec une rétention de 30 jours sur cloud et 7 ans d'archives. Pour les installations on-premise, des scripts de backup sont fournis et testés lors de la mise en production.",
      },
    ],
  },
  {
    id: "pricing",
    icon: Banknote,
    title: "Tarification & engagement",
    items: [
      {
        q: "Quelle est la structure tarifaire de SWAN ?",
        a: "SWAN propose trois offres adaptées à la taille et aux besoins : Essentiel (TPE, jusqu'à 50 équipements), Entreprise (sites industriels avec multi-sites, RBAC avancé et reporting), et Groupe (déploiement complet, on-premise, SLA dédié). Tous les prix sont en dinars algériens (DZD).",
      },
      {
        q: "Y a-t-il un engagement de durée minimum ?",
        a: "Non. SWAN est disponible sans engagement sur facturation mensuelle. Un abonnement annuel est proposé avec une remise significative. L'essai gratuit de 30 jours permet de valider la plateforme en conditions réelles avant tout engagement.",
      },
      {
        q: "Que se passe-t-il avec mes données si je résilie ?",
        a: "En cas de résiliation, vous disposez de 30 jours pour exporter l'intégralité de vos données (équipements, historique, rapports) aux formats CSV et PDF. Aucune donnée n'est supprimée avant la fin de cette période. Pour les clients on-premise, vos données restent dans votre infrastructure.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 space-y-0">

      {/* ── HERO ── */}
      <section className="pb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Support</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Foire aux questions
          </h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">
            Tout ce que vous devez savoir sur le déploiement, les fonctionnalités et l'usage de SWAN.
            Vous ne trouvez pas votre réponse ? Contactez notre équipe.
          </p>
        </motion.div>
      </section>

      {/* ── FAQ SECTIONS ── */}
      <div className="space-y-8 pb-20">
        {FAQ_SECTIONS.map((section, sIdx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: sIdx * 0.06, ease: easeOut }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/70">
                <section.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="rounded-3xl border border-border/60 bg-card/70">
              <Accordion type="single" collapsible className="w-full">
                {section.items.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.id}-${i}`}
                    className="border-border/50 px-5 last:border-0"
                  >
                    <AccordionTrigger className="py-5 text-left text-[0.95rem] font-medium hover:text-foreground hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CTA CONTACT ── */}
      <div className="border-t border-border/50 py-16">
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-8 py-12 text-center md:px-14">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/50">
            <MessageSquare className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Notre équipe répond en moins de 4h ouvrées pour toute question technique ou commerciale.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button className="h-10 rounded-full px-6 text-sm">Parler à un conseiller</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-10 rounded-full px-6 text-sm">Accéder à la démo</Button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
