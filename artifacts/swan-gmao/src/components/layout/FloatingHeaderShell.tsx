import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type Props = {
  logo: string;
  title?: string;
  rightContent?: React.ReactNode;
  hideCenterNav?: boolean;
};

export function FloatingHeaderShell({ logo, title, rightContent, hideCenterNav }: Props) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 px-6 pt-5 pb-0 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border/60 bg-card/60 px-5 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src={logo} alt="SWAN" className="h-7 w-auto" />
          <div className="hidden sm:block">
            <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-foreground">Swan GMAO</div>
            <div className="text-[10px] text-muted-foreground leading-none">Industrial maintenance platform</div>
          </div>
        </Link>
        {!hideCenterNav ? (
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <Link href="/" className={`transition-colors hover:text-foreground ${location === "/" ? "text-foreground" : ""}`}>Accueil</Link>
            <Link href="/about" className={`transition-colors hover:text-foreground ${location === "/about" ? "text-foreground" : ""}`}>À propos</Link>
            <Link href="/faq" className={`transition-colors hover:text-foreground ${location === "/faq" ? "text-foreground" : ""}`}>FAQ</Link>
            <Link href="/login" className={`transition-colors hover:text-foreground ${location === "/login" ? "text-foreground" : ""}`}>Connexion</Link>
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}
        {rightContent ? (
          <div>{rightContent}</div>
        ) : (
          <Link href="/register">
            <Button size="sm" className="rounded-full px-5">Commencer</Button>
          </Link>
        )}
      </div>
    </header>
  );
}