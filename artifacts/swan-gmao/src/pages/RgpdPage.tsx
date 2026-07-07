import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle2, Shield, Database, Eye, Lock, UserCheck, FileText } from "lucide-react";
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

const RIGHTS = [
  { icon: Eye,       title: "Droit d'accès",         desc: "Obtenir une copie de toutes les données personnelles vous concernant traitées par SWAN." },
  { icon: FileText,  title: "Droit de rectification", desc: "Faire corriger toute donnée inexacte ou incomplète vous concernant." },
  { icon: Lock,      title: "Droit à l'effacement",   desc: "Demander la suppression de vos données personnelles (sous réserve d'obligations légales)." },
  { icon: Shield,    title: "Droit d'opposition",     desc: "Vous opposer au traitement de vos données à des fins de marketing direct." },
  { icon: Database,  title: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine." },
  { icon: UserCheck, title: "Droit de limitation",    desc: "Demander la limitation du traitement de vos données dans certains cas prévus par la loi." },
];

const MEASURES = [
  "Chiffrement TLS 1.3 de toutes les communications",
  "Authentification sécurisée avec sessions expirables",
  "Contrôle d'accès basé sur les rôles (RBAC) granulaire",
  "Journaux d'audit horodatés pour toutes les actions sensibles",
  "Sauvegardes chiffrées avec politique de rétention définie",
  "Isolation des données par client",
  "Accès restreint aux données de production par le personnel SWAN",
  "Processus de notification de violation de données en 72h",
  "Analyse d'impact (DPIA) pour les traitements à risque élevé",
  "Registre des traitements tenu à jour",
];

export default function RgpdPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Légal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Protection des données personnelles</h1>
          <p className="text-sm text-muted-foreground mb-10">RGPD & Loi algérienne 18-07 — Dernière mise à jour : Juin 2026</p>

          {/* Intro */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-8 flex items-start gap-4">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-foreground/85 leading-relaxed">
              Swan Industrial Intelligence s'engage à protéger les données personnelles de ses utilisateurs conformément à la <strong>loi algérienne 18-07</strong> du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, ainsi qu'aux principes du <strong>Règlement Général sur la Protection des Données (RGPD)</strong> européen pour les clients concernés.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 sm:p-8">

            <Section title="1. Principes fondamentaux">
              <p>Swan Industrial Intelligence respecte les principes suivants dans le traitement des données :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Licéité, loyauté et transparence</strong> : traitement fondé sur une base légale claire</li>
                <li><strong className="text-foreground">Limitation des finalités</strong> : données collectées pour des objectifs déterminés et légitimes</li>
                <li><strong className="text-foreground">Minimisation des données</strong> : seules les données nécessaires sont collectées</li>
                <li><strong className="text-foreground">Exactitude</strong> : données maintenues à jour</li>
                <li><strong className="text-foreground">Limitation de la conservation</strong> : données conservées uniquement le temps nécessaire</li>
                <li><strong className="text-foreground">Intégrité et confidentialité</strong> : protection technique et organisationnelle appropriée</li>
                <li><strong className="text-foreground">Responsabilité</strong> : documentation et démonstration de la conformité</li>
              </ul>
            </Section>

            <Section title="2. Base légale des traitements">
              <p>Chaque traitement de données personnelles repose sur l'une des bases légales suivantes :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Exécution du contrat</strong> : pour la fourniture du service SWAN GMAO</li>
                <li><strong className="text-foreground">Obligation légale</strong> : pour les exigences réglementaires applicables</li>
                <li><strong className="text-foreground">Intérêt légitime</strong> : pour la sécurité et l'amélioration du service</li>
                <li><strong className="text-foreground">Consentement</strong> : pour les communications commerciales (révocable à tout moment)</li>
              </ul>
            </Section>

            <Section title="3. Transferts de données">
              <p>Les données des clients algériens sont hébergées et traitées en Algérie ou dans des pays offrant un niveau de protection équivalent.</p>
              <p>Aucun transfert de données vers des pays tiers sans mécanisme de protection adéquat (clauses contractuelles types, décision d'adéquation).</p>
              <p>L'option on-premise garantit que les données ne quittent jamais l'infrastructure du client.</p>
            </Section>

            <Section title="4. Sous-traitants">
              <p>Swan Industrial Intelligence recourt à des sous-traitants techniques (hébergement, infrastructure) sélectionnés sur la base de garanties contractuelles de protection des données.</p>
              <p>Liste des sous-traitants principaux disponible sur demande à <a href="mailto:souanekhaledibnelwalid@gmail.com" className="text-primary hover:underline">souanekhaledibnelwalid@gmail.com</a>.</p>
            </Section>

            <Section title="5. Violations de données">
              <p>En cas de violation de données à caractère personnel, Swan Industrial Intelligence s'engage à :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Notifier l'autorité de protection dans les <strong className="text-foreground">72 heures</strong> si la violation est susceptible d'engendrer un risque</li>
                <li>Informer les personnes concernées si la violation est susceptible d'engendrer un risque élevé</li>
                <li>Documenter toute violation dans le registre interne</li>
              </ul>
            </Section>

            <Section title="6. Mesures de sécurité techniques">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {MEASURES.map((m) => (
                  <div key={m} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span className="text-xs leading-snug">{m}</span>
                  </div>
                ))}
              </div>
            </Section>

          </div>

          {/* Rights */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-foreground mb-6">Vos droits sur vos données</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RIGHTS.map((right, idx) => (
                <motion.div key={right.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05, ease: easeOut }} className="rounded-2xl border border-border/50 bg-card/60 p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <right.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{right.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{right.desc}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Pour exercer vos droits, contactez notre délégué à la protection des données :{" "}
              <a href="mailto:souanekhaledibnelwalid@gmail.com" className="text-primary hover:underline">souanekhaledibnelwalid@gmail.com</a>
              <br />Délai de réponse : <strong className="text-foreground">30 jours ouvrés</strong> maximum.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legal/confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité →</Link>
            <Link href="/legal/cgu" className="text-sm text-primary hover:underline">CGU →</Link>
            <Link href="/legal/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
