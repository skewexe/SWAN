import { Link, useLocation } from "wouter";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img src={swanLogo} alt="SWAN Logo" className="h-8 w-auto" />
            <span className="font-semibold tracking-wide text-lg text-primary">SWAN GMAO</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
              Accueil
            </Link>
            <Link href="/about" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`}>
              À propos
            </Link>
            <Link href="/faq" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/faq' ? 'text-primary' : 'text-muted-foreground'}`}>
              FAQ
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/50 py-12 bg-card mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={swanLogo} alt="SWAN Logo" className="h-6 w-auto opacity-70 grayscale" />
            <span className="text-muted-foreground font-medium">© {new Date().getFullYear()} SWAN Industrial Intelligence.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">Mission</Link>
            <Link href="/faq" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Espace Client</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
