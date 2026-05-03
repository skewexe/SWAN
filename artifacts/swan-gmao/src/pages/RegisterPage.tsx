import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Nom complet requis"),
  company: z.string().min(2, "Nom de l'entreprise requis"),
  sector: z.string().min(1, "Secteur requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", company: "", sector: "", email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      const result = register({
        name: values.name,
        email: values.email,
        password: values.password,
        company: values.company,
        role: "admin",
        team: "Direction",
        site: "Site Principal",
      });
      setIsLoading(false);
      if (result.success) {
        toast({
          title: "Compte créé avec succès",
          description: "Bienvenue sur SWAN GMAO. Votre espace est prêt.",
        });
        setLocation("/dashboard");
      } else {
        toast({ title: "Erreur d'inscription", description: result.error, variant: "destructive" });
      }
    }, 800);
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={swanLogo} alt="SWAN Logo" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Créer un compte</h1>
          <p className="mt-2 text-muted-foreground">Déployez SWAN dans votre usine aujourd'hui</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl shadow-background/50 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Votre nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Ali Mansouri" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Industries Algérie SPA" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteur d'activité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-background border-border/50 focus:border-primary/50">
                          <SelectValue placeholder="Sélectionner un secteur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agro">Agroalimentaire</SelectItem>
                        <SelectItem value="hydro">Hydrocarbures</SelectItem>
                        <SelectItem value="pharma">Pharmaceutique</SelectItem>
                        <SelectItem value="metal">Métallurgie</SelectItem>
                        <SelectItem value="manu">Manufacturier</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email professionnel</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@usine.dz" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
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
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="Minimum 8 caractères"
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
                Créer mon compte
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà client ?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
