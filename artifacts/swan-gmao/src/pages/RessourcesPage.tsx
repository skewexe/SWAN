import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, HelpCircle, Video, Download, Mail, ChevronRight } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const RESOURCES = [
  {
    category: "Documentation",
    icon: BookOpen,
    color: "#0A6DFF",
    items: [
      { title: "Guide de démarrage rapide", desc: "Mise en route en 30 minutes : créer vos premiers équipements, OT et plans préventifs.", href: "/documentation", tag: "Guide" },
      { title: "Référence API REST", desc: "Documentation complète de tous les endpoints disponibles pour les intégrations.", href: "/documentation", tag: "Technique" },
      { title: "Gestion des rôles RBAC", desc: "Comprendre les 5 rôles SWAN et configurer les droits de votre équipe.", href: "/documentation", tag: "Administration" },
      { title: "Import CSV / Excel", desc: "Format des fichiers d'import, correspondance des colonnes et exemples pratiques.", href: "/documentation", tag: "Guide" },
    ],
  },
  {
    category: "Guides pratiques",
    icon: FileText,
    color: "#22C55E",
    items: [
      { title: "Mettre en place la maintenance préventive", desc: "Configurer des plans récurrents, fréquences et assignations automatiques.", href: "/documentation", tag: "Guide" },
      { title: "Gérer le stock de pièces de rechange", desc: "Définir les seuils d'alerte, suivre les consommations et éviter les ruptures.", href: "/documentation", tag: "Guide" },
      { title: "Configurer la gateway WhatsApp", desc: "Connecter WhatsApp Web pour envoyer des notifications aux techniciens terrain.", href: "/documentation", tag: "Technique" },
      { title: "Lire les KPIs de maintenance", desc: "Interpréter MTBF, MTTR, disponibilité opérationnelle et ratio préventif/correctif.", href: "/documentation", tag: "Analytique" },
    ],
  },
  {
    category: "FAQ & support",
    icon: HelpCircle,
    color: "#F59E0B",
    items: [
      { title: "Questions fréquentes", desc: "Réponses aux questions les plus posées par nos clients industriels.", href: "/faq", tag: "Support" },
      { title: "Dépannage courant", desc: "Résoudre les problèmes les plus fréquents d'accès, de synchronisation et d'affichage.", href: "/faq", tag: "Support" },
      { title: "Contacter le support", desc: "Ouvrir un ticket de support ou joindre directement notre équipe technique.", href: "/demander-acces", tag: "Contact" },
    ],
  },
];

const DOWNLOADS = [
  { name: "Template import équipements (CSV)", size: "4 Ko", icon: Download, color: "#0A6DFF" },
  { name: "Template import inventaire (CSV)", size: "3 Ko", icon: Download, color: "#22C55E" },
  { name: "Fiche technique SWAN GMAO (PDF)", size: "1.2 Mo", icon: Download, color: "#F59E0B" },
  { name: "Guide RBAC — Matrice des droits (PDF)", size: "280 Ko", icon: Download, color: "#8B5CF6" },
];

export default function RessourcesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Ressources</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Tout ce qu'il vous faut
              <br /> <span className="text-primary">pour maîtriser SWAN.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Guides, documentation technique, templates et FAQ — toutes les ressources pour déployer et exploiter SWAN efficacement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 space-y-14">
        {RESOURCES.map((group, gidx) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: gidx * 0.05, ease: easeOut }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: group.color + "18" }}>
                <group.icon className="h-4.5 w-4.5" style={{ color: group.color }} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{group.category}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item, iidx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: iidx * 0.04, ease: easeOut }}
                >
                  <Link href={item.href}>
                    <div className="group h-full rounded-2xl border border-border/50 bg-card/60 p-5 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: group.color + "18", color: group.color }}>{item.tag}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                      </div>
                      <div className="font-medium text-foreground text-sm mb-1.5">{item.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Downloads */}
      <section className="bg-card/30 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }} className="mb-8">
            <h2 className="text-2xl font-semibold">Téléchargements</h2>
            <p className="text-muted-foreground mt-1">Templates et fiches techniques disponibles gratuitement.</p>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOWNLOADS.map((dl, idx) => (
              <motion.div key={dl.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04, ease: easeOut }}>
                <Link href="/demander-acces">
                  <div className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 py-3.5 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: dl.color + "18" }}>
                      <dl.icon className="h-4 w-4" style={{ color: dl.color }} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{dl.name}</div>
                      <div className="text-xs text-muted-foreground">{dl.size}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: easeOut }}>
          <h2 className="text-2xl font-semibold">Vous ne trouvez pas ce que vous cherchez ?</h2>
          <p className="mt-3 text-muted-foreground">Notre équipe support répond dans les 24h ouvrées.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="mailto:souanekhaledibnelwalid@gmail.com">
              <Button size="lg" className="rounded-full px-8 h-12">
                <Mail className="mr-2 h-4 w-4" /> Contacter le support
              </Button>
            </a>
            <Link href="/faq">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Consulter la FAQ</Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
