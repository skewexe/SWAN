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

      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <img src={swanLogo} alt="SWAN Logo" className="h-8 w-auto opacity-60 grayscale" />
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
