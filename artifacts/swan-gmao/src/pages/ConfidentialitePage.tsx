import { motion } from "framer-motion";
import { Link } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Légal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : Juin 2026</p>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 sm:p-8">

            <Section title="1. Responsable du traitement">
              <p><strong className="text-foreground">Swan Industrial Intelligence</strong>, Oran, Algérie — <a href="mailto:souanekhaledibnelwalid@gmail.com" className="text-primary hover:underline">souanekhaledibnelwalid@gmail.com</a></p>
            </Section>

            <Section title="2. Données collectées">
              <p>Swan Industrial Intelligence collecte les données suivantes dans le cadre de l'utilisation de la plateforme :</p>
              <p><strong className="text-foreground">Données d'identification :</strong> Nom, prénom, adresse email professionnelle, numéro de téléphone.</p>
              <p><strong className="text-foreground">Données d'organisation :</strong> Nom de l'entreprise, secteur d'activité, rôle, sites et zones industriels.</p>
              <p><strong className="text-foreground">Données d'usage :</strong> Actions réalisées sur la plateforme, logs de connexion, équipements et ordres de travail créés.</p>
              <p><strong className="text-foreground">Données techniques :</strong> Adresse IP, type de navigateur, informations de session.</p>
            </Section>

            <Section title="3. Finalités du traitement">
              <p>Les données collectées sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Fournir et maintenir le service SWAN GMAO</li>
                <li>Gérer les comptes utilisateurs et les accès</li>
                <li>Assurer la sécurité et la traçabilité de la plateforme</li>
                <li>Envoyer des notifications de service (alertes, assignations d'OT)</li>
                <li>Améliorer la qualité et les performances du service</li>
                <li>Répondre aux demandes de support</li>
              </ul>
            </Section>

            <Section title="4. Base légale">
              <p>Les traitements sont fondés sur :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Exécution du contrat</strong> : traitement nécessaire à la fourniture du service</li>
                <li><strong className="text-foreground">Intérêt légitime</strong> : sécurité de la plateforme, amélioration du service</li>
                <li><strong className="text-foreground">Consentement</strong> : pour les communications marketing (opt-in)</li>
              </ul>
            </Section>

            <Section title="5. Destinataires des données">
              <p>Les données ne sont <strong className="text-foreground">jamais vendues ni cédées</strong> à des tiers à des fins commerciales.</p>
              <p>Les données peuvent être partagées avec des sous-traitants techniques (hébergement, infrastructure) dans le cadre d'un accord de traitement confidentiel.</p>
              <p>En cas de déploiement on-premise, les données restent exclusivement sur l'infrastructure du client.</p>
            </Section>

            <Section title="6. Durée de conservation">
              <p><strong className="text-foreground">Données de compte actif :</strong> conservées pendant toute la durée du contrat.</p>
              <p><strong className="text-foreground">Données après résiliation :</strong> conservées 6 mois puis supprimées définitivement, sauf obligation légale contraire.</p>
              <p><strong className="text-foreground">Logs techniques :</strong> conservés 12 mois maximum.</p>
            </Section>

            <Section title="7. Vos droits">
              <p>Conformément à la loi algérienne 18-07 relative à la protection des données personnelles, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                <li><strong className="text-foreground">Droit de rectification</strong> : corriger vos données inexactes</li>
                <li><strong className="text-foreground">Droit à l'effacement</strong> : demander la suppression de vos données</li>
                <li><strong className="text-foreground">Droit d'opposition</strong> : vous opposer à certains traitements</li>
                <li><strong className="text-foreground">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              </ul>
              <p>Pour exercer ces droits : <a href="mailto:souanekhaledibnelwalid@gmail.com" className="text-primary hover:underline">souanekhaledibnelwalid@gmail.com</a></p>
            </Section>

            <Section title="8. Sécurité des données">
              <p>Swan Industrial Intelligence met en œuvre des mesures techniques et organisationnelles appropriées : chiffrement TLS 1.3, authentification sécurisée, contrôle d'accès RBAC, journaux d'audit, sauvegardes chiffrées.</p>
            </Section>

            <Section title="9. Cookies">
              <p>La plateforme SWAN GMAO utilise uniquement des cookies de session, strictement nécessaires au fonctionnement du service (authentification). Aucun cookie de tracking ou publicitaire n'est utilisé.</p>
            </Section>

            <Section title="10. Contact">
              <p>Délégué à la protection des données : <a href="mailto:souanekhaledibnelwalid@gmail.com" className="text-primary hover:underline">souanekhaledibnelwalid@gmail.com</a></p>
            </Section>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legal/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales →</Link>
            <Link href="/legal/cgu" className="text-sm text-primary hover:underline">CGU →</Link>
            <Link href="/legal/rgpd" className="text-sm text-primary hover:underline">RGPD →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
