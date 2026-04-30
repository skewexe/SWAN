import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Qu'est-ce qu'une GMAO et pourquoi en ai-je besoin ?",
    a: "La Gestion de Maintenance Assistée par Ordinateur (GMAO) est un logiciel conçu pour simplifier la gestion de la maintenance au sein d'une entreprise. Elle permet d'optimiser la durée de vie des équipements, de planifier les interventions préventives, de gérer les stocks de pièces de rechange et d'analyser les coûts de maintenance, réduisant ainsi les temps d'arrêt imprévus de 30% en moyenne."
  },
  {
    q: "SWAN est-il adapté à mon secteur industriel ?",
    a: "SWAN a été conçu pour être hautement adaptable. Que vous soyez dans l'agroalimentaire, les hydrocarbures, la pharmaceutique ou la métallurgie, notre système de classification des actifs et de priorisation des ordres de travail s'ajuste à vos contraintes réglementaires et opérationnelles spécifiques."
  },
  {
    q: "Comment se déroule l'intégration de nos données existantes ?",
    a: "Notre équipe technique vous accompagne tout au long du processus. Nous fournissons des gabarits d'importation Excel/CSV pour migrer rapidement votre inventaire d'équipements, vos plans de maintenance historiques et votre catalogue de pièces de rechange directement dans SWAN."
  },
  {
    q: "Le système est-il accessible sur mobile pour nos techniciens ?",
    a: "Oui, la plateforme SWAN est entièrement responsive. Vos techniciens peuvent accéder aux ordres de travail, consulter la documentation technique et valider leurs interventions directement depuis une tablette ou un smartphone sur le terrain."
  },
  {
    q: "Où sont hébergées nos données industrielles ?",
    a: "La sécurité est notre priorité absolue. Vos données sont hébergées sur des serveurs hautement sécurisés avec des sauvegardes quotidiennes. Nous proposons également des options d'hébergement sur site (On-Premise) pour les infrastructures critiques soumises à des réglementations strictes."
  }
];

export default function FaqPage() {
  return (
    <div className="flex flex-col w-full py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight text-center">Foire aux questions</h1>
          <p className="text-muted-foreground text-lg text-center mb-12">
            Tout ce que vous devez savoir sur le déploiement de SWAN dans votre infrastructure.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
