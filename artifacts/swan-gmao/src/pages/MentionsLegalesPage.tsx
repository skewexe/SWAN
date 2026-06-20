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

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Légal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Mentions légales</h1>
          <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : Juin 2026</p>

          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 sm:p-8">

            <Section title="1. Éditeur du site">
              <p>Le site <strong className="text-foreground">swan-gmao.dz</strong> et la plateforme SWAN GMAO sont édités par la société <strong className="text-foreground">Swan Industrial Intelligence</strong>, société de droit algérien.</p>
              <p><strong className="text-foreground">Siège social :</strong> Oran, Algérie</p>
              <p><strong className="text-foreground">Email :</strong> contact@swan-gmao.dz</p>
              <p><strong className="text-foreground">Téléphone :</strong> +213 (0) 7 78 62 84 49</p>
            </Section>

            <Section title="2. Directeur de la publication">
              <p>Le directeur de la publication est le représentant légal de Swan Industrial Intelligence.</p>
            </Section>

            <Section title="3. Hébergement">
              <p>La plateforme SWAN GMAO est hébergée sur une infrastructure cloud sécurisée. Pour les clients ayant souscrit à l'option on-premise, les données sont hébergées sur les serveurs du client ou dans un datacenter algérien certifié.</p>
              <p>La version SaaS est hébergée dans un environnement cloud sécurisé avec chiffrement TLS 1.3 en transit et chiffrement au repos.</p>
            </Section>

            <Section title="4. Propriété intellectuelle">
              <p>L'ensemble des éléments constituant la plateforme SWAN GMAO (logiciel, design, interfaces, textes, graphiques, logos, icônes) sont la propriété exclusive de Swan Industrial Intelligence et sont protégés par les lois algériennes et internationales relatives à la propriété intellectuelle.</p>
              <p>Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite sans l'autorisation préalable et écrite de Swan Industrial Intelligence.</p>
            </Section>

            <Section title="5. Liens hypertextes">
              <p>La plateforme SWAN GMAO peut contenir des liens vers d'autres sites. Swan Industrial Intelligence n'est pas responsable du contenu de ces sites tiers et ne peut être tenue responsable de tout dommage ou préjudice qui pourrait en résulter.</p>
            </Section>

            <Section title="6. Limitation de responsabilité">
              <p>Swan Industrial Intelligence s'efforce de mettre à jour et de maintenir la plateforme disponible au mieux. Cependant, Swan Industrial Intelligence ne peut être tenue responsable :</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Des interruptions de service dues à des maintenances techniques ou à des forces majeures</li>
                <li>Des pertes de données résultant d'une mauvaise utilisation de la plateforme par l'utilisateur</li>
                <li>Des dommages indirects liés à l'utilisation ou à l'impossibilité d'utiliser la plateforme</li>
              </ul>
            </Section>

            <Section title="7. Droit applicable">
              <p>Les présentes mentions légales sont soumises au droit algérien. Tout litige relatif à leur interprétation ou à leur exécution est de la compétence exclusive des tribunaux algériens compétents.</p>
            </Section>

            <Section title="8. Contact">
              <p>Pour toute question relative aux présentes mentions légales : <a href="mailto:contact@swan-gmao.dz" className="text-primary hover:underline">contact@swan-gmao.dz</a></p>
            </Section>
          </div>

          {/* Related links */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legal/confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité →</Link>
            <Link href="/legal/cgu" className="text-sm text-primary hover:underline">Conditions générales d'utilisation →</Link>
            <Link href="/legal/rgpd" className="text-sm text-primary hover:underline">RGPD →</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
