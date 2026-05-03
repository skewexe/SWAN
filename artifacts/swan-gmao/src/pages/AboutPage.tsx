import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Mission</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Une GMAO conçue pour la rigueur industrielle.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          SWAN est né d’un constat simple : les opérations critiques ont besoin d’un logiciel précis, stable et lisible.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          ["Précision industrielle", "Des interfaces pensées pour les interventions, les sites et les équipes de terrain."],
          ["Expertise locale", "Adapté aux réalités du marché algérien et aux contraintes des zones industrielles."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-border/60 bg-card/70 p-7">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
