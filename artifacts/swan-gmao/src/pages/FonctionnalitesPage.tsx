import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Settings, Workflow, ShieldCheck, Box, Users, BarChart3,
  Calendar, Bell, FileSpreadsheet, MessageSquare, QrCode, GitBranch,
  Layers, Lock, Globe, Zap, CheckCircle2,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const CATEGORIES = [
  {
    id: "actifs",
    label: "Gestion des actifs",
    icon: Settings,
    color: "#0A6DFF",
    features: [
      "Référentiel équipements avec photo et données techniques",
      "Numéro de série, fabricant, modèle, date d'installation",
      "Classification par catégorie, criticité et statut",
      "Affectation multi-sites et multi-zones",
      "Arborescence hiérarchique (site > zone > équipement)",
      "Catalogue de pièces machine par équipement",
      "Historique complet des interventions par actif",
      "KPIs par équipement : MTBF, MTTR, disponibilité",
      "Import en masse CSV / Excel avec mapping automatique",
      "Création par types (batch avec préfixe et compteur)",
      "Code QR généré par équipement",
    ],
  },
  {
    id: "ot",
    label: "Ordres de travail",
    icon: Workflow,
    color: "#38BDF8",
    features: [
      "Création manuelle ou automatique (depuis plan préventif)",
      "Types : Corrective, Préventive, Prédictive, Inspection",
      "Niveaux de priorité : Critique, Élevée, Moyenne, Faible",
      "Assignation par technicien, zone, machine ou type",
      "Progression de statut interactive : Ouvert → En cours → Terminé",
      "Gestion des pièces consommées avec déduction automatique du stock",
      "Affectation multi-techniciens sur un même OT",
      "Filtrage avancé : statut, priorité, type, site, zone",
      "Sélection multiple et actions en masse",
      "Fiche détail avec historique, pièces, site et mode d'assignation",
      "Notifications WhatsApp et Telegram à l'assignation",
    ],
  },
  {
    id: "preventif",
    label: "Maintenance préventive",
    icon: ShieldCheck,
    color: "#22C55E",
    features: [
      "Plans de maintenance avec fréquences personnalisables",
      "Calcul automatique de la prochaine échéance",
      "Statut : Actif, Inactif, En retard",
      "Exécution en un clic → génère un OT et met à jour la date",
      "Durée estimée par plan",
      "Assignation de techniciens au plan",
      "Alerte visuelle des plans en retard",
      "Historique d'exécution et traçabilité",
    ],
  },
  {
    id: "stock",
    label: "Stock & pièces",
    icon: Box,
    color: "#F59E0B",
    features: [
      "Catalogue articles avec référence, catégorie, fournisseur",
      "Quantité en stock et seuil d'alerte minimum",
      "Valeur totale du stock (quantité × coût unitaire)",
      "Alertes de rupture automatiques",
      "Déduction du stock à chaque OT consommant une pièce",
      "Restauration du stock à la suppression d'un OT",
      "Graphiques analytiques : répartition par catégorie, top valorisation",
      "Dashboard magasin avec KPIs : valeur totale, alertes, catégories",
    ],
  },
  {
    id: "equipes",
    label: "Équipes & RBAC",
    icon: Users,
    color: "#8B5CF6",
    features: [
      "5 rôles prédéfinis : Admin, Manager, Chef d'équipe, Technicien, Lecteur",
      "Matrice de droits par module et par rôle",
      "Technicien : vue filtrée sur ses propres OT uniquement",
      "Lecteur : accès lecture seule à l'ensemble de la plateforme",
      "Fiches techniciens avec spécialisation, compétences, note moyenne",
      "Photo de profil et identifiant Telegram / WhatsApp",
      "Statut de disponibilité : Disponible, Occupé, Absent, En congé",
      "Tableau de charge opérationnelle par technicien",
      "Gestion des équipes avec attribution de sites et rôles",
    ],
  },
  {
    id: "reporting",
    label: "Rapports & KPIs",
    icon: BarChart3,
    color: "#EC4899",
    features: [
      "MTBF (Moyenne des temps de bon fonctionnement)",
      "MTTR (Moyenne des temps de réparation)",
      "Taux de disponibilité opérationnelle avec objectif 95%",
      "Ratio Préventif / Correctif",
      "Top équipements défaillants avec barre de criticité",
      "Coûts de maintenance par mois : main-d'œuvre, pièces, immobilisation",
      "Tendances sur 6 mois avec graphiques d'évolution",
      "Tableau de bord configurable avec widgets réorganisables",
      "Cross-filtres interactifs : mois, catégorie, statut, priorité",
    ],
  },
  {
    id: "calendrier",
    label: "Calendrier",
    icon: Calendar,
    color: "#0EA5E9",
    features: [
      "Vue mensuelle et vue hebdomadaire",
      "Affichage des OT et des plans préventifs sur le calendrier",
      "Filtrage par type : OT uniquement, Préventive uniquement, Tout",
      "Statistiques mensuelles : total, OT, préventives, retards",
      "Navigation entre mois et semaines",
      "Indicateur visuel des événements en retard",
      "Fiche détail d'événement au clic",
    ],
  },
  {
    id: "notifications",
    label: "Notifications & alertes",
    icon: Bell,
    color: "#F97316",
    features: [
      "Notifications en temps réel dans l'interface (cloche)",
      "Alertes automatiques : panne, rupture stock, OT en retard, plan échu",
      "Nouvelles assignations d'OT",
      "Marquage lu / tout marquer comme lu",
      "Envoi WhatsApp via gateway intégré",
      "Envoi Telegram avec bot configurable",
      "Webhook Telegram pour interactions bidirectionnelles",
    ],
  },
];

export default function FonctionnalitesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Fonctionnalités</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
              Tout le périmètre GMAO,
              <br className="hidden sm:block" /> <span className="text-primary">rien de superflu.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Chaque fonctionnalité de SWAN a été conçue pour répondre à un besoin concret de la maintenance industrielle algérienne.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature categories */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8 space-y-16">
        {CATEGORIES.map((cat, cidx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: cidx * 0.04, ease: easeOut }}
            className="rounded-3xl border border-border/60 bg-card/50 overflow-hidden"
          >
            <div className="flex items-center gap-4 px-7 py-5 border-b border-border/50" style={{ background: cat.color + "0A" }}>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: cat.color + "20", border: `1px solid ${cat.color}40` }}>
                <cat.icon className="h-5 w-5" style={{ color: cat.color }} strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{cat.label}</h2>
              <span className="ml-auto text-xs text-muted-foreground font-medium">{cat.features.length} fonctionnalités</span>
            </div>
            <div className="p-7 grid gap-2.5 sm:grid-cols-2">
              {cat.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: cat.color }} strokeWidth={1.5} />
                  <span className="text-sm text-foreground/85 leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-card/30 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
            <h2 className="text-3xl font-semibold tracking-tight">Convaincu ? Démarrez maintenant.</h2>
            <p className="mt-4 text-muted-foreground">Accès en 48h, accompagnement inclus, données sécurisées en Algérie.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/demander-acces">
                <Button size="lg" className="rounded-full px-8 h-12">Demander un accès <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Link href="/offres">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Voir les offres</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
