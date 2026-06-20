import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  logo: string;
  title?: string;
  rightContent?: React.ReactNode;
  hideCenterNav?: boolean;
  logoHref?: string;
  onMenuToggle?: () => void;
};

const PRODUIT_LINKS = [
  { label: "Fonctionnalités",  href: "/fonctionnalites", desc: "Détail de toutes les fonctionnalités" },
  { label: "Modules",          href: "/modules",          desc: "Les 21 modules du périmètre CMMS" },
  { label: "Sécurité",         href: "/securite",         desc: "Architecture & conformité" },
  { label: "Mises à jour",     href: "/mises-a-jour",     desc: "Journal des versions" },
];

const RESSOURCES_LINKS = [
  { label: "Documentation",    href: "/documentation",    desc: "Guides techniques & API" },
  { label: "Ressources",       href: "/ressources",       desc: "Templates & téléchargements" },
  { label: "FAQ",              href: "/faq",              desc: "Questions fréquentes" },
  { label: "À propos",         href: "/about",            desc: "Mission & équipe" },
];

function Dropdown({ label, links, open, onOpen, onClose }: {
  label: string;
  links: { label: string; href: string; desc: string }[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => open ? onClose() : onOpen()}
        className={`flex items-center gap-1 text-[13px] transition-colors hover:text-foreground ${open ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl p-1.5 z-50"
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div onClick={onClose} className="group rounded-xl px-3.5 py-2.5 hover:bg-primary/8 transition-colors cursor-pointer">
                  <div className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{link.desc}</div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FloatingHeaderShell({ logo, title, rightContent, hideCenterNav, logoHref = "/", onMenuToggle }: Props) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href: string) => location === href;
  const closeDropdown = () => setOpenDropdown(null);

  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [location]);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 pb-0 sm:px-6 sm:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border/60 bg-card/60 px-3 py-2.5 sm:px-5 sm:py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md">

        {/* Left — logo + optional dashboard hamburger */}
        <div className="flex items-center gap-2">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors mr-1"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          )}

          <Link href={logoHref} className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80 shrink-0">
            <img src={logo} alt="SWAN" className="h-8 w-auto sm:h-10" />
            <div className="hidden sm:block">
              <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground">Swan GMAO</div>
              <div className="text-[10px] text-muted-foreground leading-none">Industrial maintenance platform</div>
            </div>
          </Link>
        </div>

        {/* Center */}
        {hideCenterNav ? (
          <div className="hidden md:block text-sm font-semibold text-foreground tracking-tight">
            {title}
          </div>
        ) : (
          <nav className="hidden lg:flex items-center gap-6">
            {/* Produit dropdown */}
            <Link href="/produit">
              <span className={`text-[13px] transition-colors hover:text-foreground ${isActive("/produit") ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Produit
              </span>
            </Link>
            <Dropdown
              label="Détails"
              links={PRODUIT_LINKS}
              open={openDropdown === "produit"}
              onOpen={() => setOpenDropdown("produit")}
              onClose={closeDropdown}
            />
            <Link href="/offres">
              <span className={`text-[13px] transition-colors hover:text-foreground ${isActive("/offres") ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Offres
              </span>
            </Link>
            <Dropdown
              label="Ressources"
              links={RESSOURCES_LINKS}
              open={openDropdown === "ressources"}
              onOpen={() => setOpenDropdown("ressources")}
              onClose={closeDropdown}
            />
          </nav>
        )}

        {/* Right */}
        {rightContent ? (
          <div className="shrink-0">{rightContent}</div>
        ) : hideCenterNav ? null : (
          <div className="flex items-center gap-2">
            {/* Desktop auth buttons */}
            <Link href="/login" className="hidden lg:inline-flex">
              <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs">Connexion</Button>
            </Link>
            <Link href="/demander-acces" className="hidden lg:inline-flex">
              <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm">Demander un accès</Button>
            </Link>

            {/* Mobile hamburger for public pages */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu for public pages */}
      <AnimatePresence>
        {!hideCenterNav && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-7xl overflow-hidden"
          >
            <div className="mt-2 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl p-4 space-y-1">
              <MobileNavSection label="Produit" links={[
                { label: "Vue d'ensemble", href: "/produit" },
                ...PRODUIT_LINKS.map(l => ({ label: l.label, href: l.href })),
              ]} />
              <MobileNavLink href="/offres" label="Offres" />
              <MobileNavSection label="Ressources" links={RESSOURCES_LINKS.map(l => ({ label: l.label, href: l.href }))} />
              <div className="h-px bg-border/40 my-2" />
              <MobileNavLink href="/login" label="Connexion" />
              <Link href="/demander-acces">
                <Button className="w-full rounded-full mt-1">Demander un accès</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  const [location] = useLocation();
  return (
    <Link href={href}>
      <div className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${location === href ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/60"}`}>
        {label}
      </div>
    </Link>
  );
}

function MobileNavSection({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted/60 transition-colors"
      >
        <span className="font-medium">{label}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden pl-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                <div className={`px-3 py-2 rounded-xl text-sm transition-colors ${location === l.href ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  {l.label}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
