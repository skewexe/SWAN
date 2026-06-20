import { Link } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <main className="flex-1 flex flex-col pt-5">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <img src={swanLogo} alt="SWAN" className="h-8 w-auto opacity-70" />
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground">Swan GMAO</div>
                  <div className="text-[10px] text-muted-foreground">Industrial maintenance platform</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                La GMAO premium conçue pour les industriels algériens.
              </p>
            </div>

            {/* Produit */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-3">Produit</div>
              <ul className="space-y-2 text-[0.8rem] text-muted-foreground">
                {[
                  { label: "Vue d'ensemble",  href: "/produit" },
                  { label: "Fonctionnalités", href: "/fonctionnalites" },
                  { label: "Modules",         href: "/modules" },
                  { label: "Offres",          href: "/offres" },
                  { label: "Sécurité",        href: "/securite" },
                  { label: "Mises à jour",    href: "/mises-a-jour" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-3">Ressources</div>
              <ul className="space-y-2 text-[0.8rem] text-muted-foreground">
                {[
                  { label: "Documentation",    href: "/documentation" },
                  { label: "Ressources",       href: "/ressources" },
                  { label: "FAQ",              href: "/faq" },
                  { label: "À propos",         href: "/about" },
                  { label: "Connexion",        href: "/login" },
                  { label: "Demander un accès", href: "/demander-acces" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground mb-3">Légal</div>
              <ul className="space-y-2 text-[0.8rem] text-muted-foreground">
                {[
                  { label: "Mentions légales",          href: "/legal/mentions-legales" },
                  { label: "Politique de confidentialité", href: "/legal/confidentialite" },
                  { label: "CGU",                       href: "/legal/cgu" },
                  { label: "RGPD",                      href: "/legal/rgpd" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} Swan GMAO — Tous droits réservés.</span>
            <span>Conçu pour l'industrie algérienne · Oran, Algérie</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
