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
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { Loader2 } from "lucide-react";

const registerSchema = z.object({
  company: z.string().min(2, "Nom de l'entreprise requis"),
  sector: z.string().min(1, "Secteur requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company: "",
      sector: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    // Simulate registration for demo
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Inscription réussie",
        description: "Votre espace a été créé avec succès.",
      });
      setLocation("/dashboard");
    }, 1500);
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={swanLogo} alt="SWAN Logo" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Créer un compte</h1>
          <p className="mt-2 text-muted-foreground">
            Déployez SWAN dans votre usine aujourd'hui
          </p>
        </div>

        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl shadow-background/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Industries Algérie" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
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
                      <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-background border-border/50 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Créer l'espace
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà client ?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
