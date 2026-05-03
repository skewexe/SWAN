import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Qu'est-ce qu'une GMAO et pourquoi en ai-je besoin ?",
    a: "La GMAO simplifie la maintenance, structure les interventions et améliore la disponibilité des équipements.",
  },
  {
    q: "SWAN est-il adapté à mon secteur industriel ?",
    a: "Oui. La plateforme est pensée pour l'industrie, avec un modèle multi-sites, des équipes et des permissions par rôle.",
  },
  {
    q: "Comment se déroule l'intégration ?",
    a: "Nous utilisons des imports CSV/Excel et une configuration progressive pour rendre le déploiement rapide et propre.",
  },
  {
    q: "Le système est-il accessible sur mobile ?",
    a: "Oui. L'interface est responsive et pensée pour les techniciens et superviseurs sur le terrain.",
  },
  {
    q: "Où sont hébergées les données ?",
    a: "Les données peuvent être hébergées de manière sécurisée avec des options on-premise selon les contraintes du client.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-24 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-3xl mx-auto text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Support</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Foire aux questions</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">Les points essentiels sur le déploiement et l’usage de SWAN.</p>
      </motion.div>

      <div className="mt-12 rounded-3xl border border-border/60 bg-card/70 p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50 px-4">
              <AccordionTrigger className="py-6 text-left text-base font-medium hover:text-foreground">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-muted-foreground leading-7">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
