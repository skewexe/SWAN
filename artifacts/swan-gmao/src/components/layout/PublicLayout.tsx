import { Link, useLocation } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src={swanLogo} alt="SWAN Logo" className="h-8 w-auto" />
            <div className="hidden sm:block">
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">Swan GMAO</div>
              <div className="text-[10px] text-muted-foreground leading-none">Industrial maintenance platform</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
            <Link href="/" className={`transition-colors hover:text-foreground ${location === '/' ? 'text-foreground' : ''}`}>Accueil</Link>
            <Link href="/about" className={`transition-colors hover:text-foreground ${location === '/about' ? 'text-foreground' : ''}`}>À propos</Link>
            <Link href="/faq" className={`transition-colors hover:text-foreground ${location === '/faq' ? 'text-foreground' : ''}`}>FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <img src={swanLogo} alt="SWAN Logo" className="h-6 w-auto opacity-60 grayscale" />
            <span className="text-[13px] text-muted-foreground">© {new Date().getFullYear()} SWAN Industrial Intelligence</span>
          </div>
          <div className="flex gap-7 text-[13px] text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">Mission</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Espace client</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
