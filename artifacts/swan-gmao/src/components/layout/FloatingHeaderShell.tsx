import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type Props = {
  logo: string;
  title?: string;
  rightContent?: React.ReactNode;
  hideCenterNav?: boolean;
  logoHref?: string;
  onMenuToggle?: () => void;
};

export function FloatingHeaderShell({ logo, title, rightContent, hideCenterNav, logoHref = "/", onMenuToggle }: Props) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 pb-0 sm:px-6 sm:pt-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border/60 bg-card/60 px-3 py-2.5 sm:px-5 sm:py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md">

        <div className="flex items-center gap-2">
          {/* Hamburger — only shown on mobile when inside dashboard */}
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

        {hideCenterNav ? (
          <div className="hidden md:block text-sm font-semibold text-foreground tracking-tight">
            {title}
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <Link href="/" className={`transition-colors hover:text-foreground ${location === "/" ? "text-foreground font-medium" : ""}`}>Accueil</Link>
            <Link href="/about" className={`transition-colors hover:text-foreground ${location === "/about" ? "text-foreground font-medium" : ""}`}>À propos</Link>
            <Link href="/faq" className={`transition-colors hover:text-foreground ${location === "/faq" ? "text-foreground font-medium" : ""}`}>FAQ</Link>
            <Link href="/login" className={`transition-colors hover:text-foreground ${location === "/login" ? "text-foreground font-medium" : ""}`}>Connexion</Link>
          </nav>
        )}

        {rightContent ? (
          <div className="shrink-0">{rightContent}</div>
        ) : (
          <Link href="/register" className="shrink-0">
            <Button size="sm" className="rounded-full px-4 sm:px-5 text-xs sm:text-sm">Commencer</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
