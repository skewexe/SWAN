import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground tracking-tight">Notre Mission</h1>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              SWAN est né d'un constat simple sur le terrain : l'industrie algérienne a besoin d'outils logiciels aussi fiables, précis et robustes que les machines qu'elle opère au quotidien.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="bg-card border border-border p-8 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4 text-primary">Précision Industrielle</h3>
                <p className="text-muted-foreground">
                  Nous ne construisons pas de simples tableaux de bord. Nous développons des interfaces de contrôle pour les opérations critiques, où chaque donnée a un impact direct sur la production.
                </p>
              </div>
              <div className="bg-card border border-border p-8 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4 text-primary">Expertise Locale</h3>
                <p className="text-muted-foreground">
                  Conçu spécifiquement pour les réalités du marché algérien, SWAN intègre les flux de travail, la réglementation et les défis uniques de nos zones industrielles.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">Vision pour l'Avenir</h2>
            <p className="text-muted-foreground leading-relaxed">
              La transformation numérique de l'industrie passe par une maintenance prédictive et intelligente. Nous visons à équiper chaque usine algérienne d'un système nerveux central capable de prévenir les pannes avant qu'elles ne se produisent, optimisant ainsi la disponibilité des équipements et réduisant drastiquement les coûts opérationnels.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
