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

export default function CguPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Légal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Conditions générales d'utilisation</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : Juin 2026</p>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 sm:p-8">

            <Section title="1. Objet">
              <p>Les présentes Conditions Générales d'Utilisation (CGU) définissent les conditions dans lesquelles Swan Industrial Intelligence met à disposition de ses clients la plateforme SWAN GMAO et les services associés.</p>
              <p>En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes CGU.</p>
            </Section>

            <Section title="2. Description du service">
              <p>SWAN GMAO est une plateforme logicielle de gestion de la maintenance assistée par ordinateur (GMAO/CMMS) accessible via navigateur web, destinée aux équipes de maintenance industrielle.</p>
              <p>Le service comprend : la plateforme web, les APIs, les mises à jour, et le support selon l'offre souscrite.</p>
            </Section>

            <Section title="3. Accès au service">
              <p>L'accès au service est réservé aux personnes physiques ou morales ayant souscrit un contrat valide avec Swan Industrial Intelligence.</p>
              <p>Chaque utilisateur dispose d'un identifiant et d'un mot de passe personnels et confidentiels. Il est responsable de la sécurité de ses identifiants.</p>
              <p>Swan Industrial Intelligence se réserve le droit de suspendre ou de résilier l'accès en cas de violation des présentes CGU.</p>
            </Section>

            <Section title="4. Obligations de l'utilisateur">
              <p>L'utilisateur s'engage à :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Utiliser le service conformément à sa destination et aux présentes CGU</li>
                <li>Ne pas tenter d'accéder de manière non autorisée au service ou à ses composants</li>
                <li>Ne pas utiliser le service à des fins illicites ou contraires à l'ordre public</li>
                <li>Maintenir la confidentialité de ses identifiants de connexion</li>
                <li>Notifier immédiatement Swan Industrial Intelligence de toute utilisation non autorisée de son compte</li>
                <li>Saisir des données exactes et à jour dans la plateforme</li>
              </ul>
            </Section>

            <Section title="5. Propriété des données">
              <p>Les données saisies par le client (équipements, ordres de travail, techniciens, etc.) restent la propriété exclusive du client.</p>
              <p>Swan Industrial Intelligence ne revendique aucun droit de propriété sur ces données et s'engage à ne pas les utiliser à d'autres fins que la fourniture du service.</p>
              <p>À la résiliation du contrat, le client dispose d'un délai de 30 jours pour exporter ses données avant suppression définitive.</p>
            </Section>

            <Section title="6. Disponibilité du service">
              <p>Swan Industrial Intelligence s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité du service. Des maintenances programmées peuvent occasionner des interruptions, signalées au préalable.</p>
              <p>Swan Industrial Intelligence ne peut être tenue responsable des interruptions causées par des événements de force majeure ou des défaillances d'infrastructure tierces.</p>
            </Section>

            <Section title="7. Licence open source">
              <p>SWAN GMAO est distribué sous licence MIT. Vous êtes libre d'utiliser, copier, modifier, fusionner, publier, distribuer, sous-licencier et/ou vendre des copies du logiciel, sous réserve d'inclure la notice de copyright ci-dessus dans toutes les copies ou parties substantielles du logiciel.</p>
              <p>Le logiciel est fourni « tel quel », sans garantie d'aucune sorte, expresse ou implicite. Il n'existe aucun abonnement, aucune facturation ni aucun engagement commercial lié à l'utilisation de ce logiciel open source.</p>
            </Section>

            <Section title="8. Résiliation">
              <p>Chacune des parties peut résilier le contrat selon les conditions définies dans le contrat spécifique. En cas de manquement grave aux présentes CGU, Swan Industrial Intelligence peut suspendre l'accès sans préavis.</p>
            </Section>

            <Section title="9. Limitation de responsabilité">
              <p>Swan Industrial Intelligence ne saurait être tenue responsable :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Des pertes de données résultant d'une utilisation non conforme</li>
                <li>Des dommages indirects, pertes de profits ou d'exploitation</li>
                <li>Des conséquences d'une mauvaise configuration du service par l'utilisateur</li>
              </ul>
              <p>La responsabilité totale de Swan Industrial Intelligence est limitée au montant des sommes versées par le client au cours des 12 derniers mois.</p>
            </Section>

            <Section title="10. Modifications des CGU">
              <p>Swan Industrial Intelligence se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés des modifications significatives par email. La poursuite de l'utilisation du service vaut acceptation des nouvelles CGU.</p>
            </Section>

            <Section title="11. Droit applicable et juridiction">
              <p>Les présentes CGU sont soumises au droit algérien. Tout litige sera soumis aux tribunaux compétents d'Oran, Algérie.</p>
            </Section>

          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legal/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales →</Link>
            <Link href="/legal/confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité →</Link>
            <Link href="/legal/rgpd" className="text-sm text-primary hover:underline">RGPD →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
