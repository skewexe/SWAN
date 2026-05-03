import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth, SEED_USERS } from "@/context/AuthContext";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  manager: "Responsable",
  chef_equipe: "Chef d'équipe",
  technicien: "Technicien",
  lecteur: "Lecteur",
};

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      const result = login(values.email, values.password);
      setIsLoading(false);
      if (result.success) {
        toast({ title: "Connexion réussie", description: "Bienvenue sur SWAN GMAO" });
        setLocation("/dashboard");
      } else {
        toast({ title: "Échec de connexion", description: result.error, variant: "destructive" });
      }
    }, 600);
  }

  const fillAccount = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
  };

  const demoAccounts = SEED_USERS.filter(u => u.id !== "u7").slice(0, 5);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={swanLogo} alt="SWAN Logo" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Connexion</h1>
          <p className="mt-2 text-muted-foreground">Accédez à votre espace de contrôle industriel</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl shadow-background/50 space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@usine.dz" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Mot de passe</FormLabel>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="h-12 bg-background border-border/50 focus:border-primary/50 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Se connecter
              </Button>
            </form>
          </Form>

          <div className="border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setShowHints(s => !s)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Comptes de démonstration</span>
              {showHints ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
            </button>

            {showHints && (
              <div className="mt-3 space-y-1.5">
                {demoAccounts.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => fillAccount(u.email, u.password)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {u.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground/70 shrink-0">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{u.password}</span>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fillAccount("demo@swan-gmao.dz", "demo")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">DM</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">Utilisateur Démo</div>
                    <div className="text-xs text-muted-foreground">demo@swan-gmao.dz</div>
                  </div>
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground/70">demo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
