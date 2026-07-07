import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, Mail, Phone, User, Briefcase, MessageSquare, ArrowRight, Terminal, Package, Cpu } from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";
import { FloatingHeaderShell } from "@/components/layout/FloatingHeaderShell";

const easeOut = "easeOut" as const;

const DEPLOY_MODES = [
  { id: "docker", label: "Docker Compose", desc: "Déploiement serveur Linux", icon: Terminal, color: "#0A6DFF" },
  { id: "electron", label: "Electron Desktop", desc: "Application .exe / .AppImage", icon: Package, color: "#8B5CF6" },
  { id: "onpremise", label: "On-premise Node.js", desc: "Serveur dédié, contrôle total", icon: Cpu, color: "#22C55E" },
  { id: "non-defini", label: "Je ne sais pas encore", desc: "Nous vous conseillerons", icon: MessageSquare, color: "#64748B" },
];

const SECTORS = [
  "Pétrole & gaz", "Énergie & utilités", "Industrie agroalimentaire",
  "Cimenterie & matériaux", "Sidérurgie & métallurgie", "Industrie pharmaceutique",
  "Textile & confection", "Transport & logistique", "Autre secteur industriel",
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  sector: string;
  plan: string;
  message: string;
  equipCount: string;
}

export default function DemanderAccesPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", phone: "",
    company: "", role: "", sector: "", plan: "non-defini",
    message: "", equipCount: "",
  });

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.company) {
      toast({ title: "Champs requis manquants", description: "Veuillez remplir au minimum : prénom, nom, email et entreprise.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Demande envoyée !", description: "Notre équipe vous contactera dans les 24h ouvrées." });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <FloatingHeaderShell logo={swanLogo} logoHref="/" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: easeOut }}>
            <div className="h-20 w-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold mb-3">Demande envoyée !</h1>
            <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
              Merci <strong className="text-foreground">{form.firstName}</strong>. Un conseiller SWAN vous contactera dans les <strong className="text-foreground">24h ouvrées</strong> à l'adresse <strong className="text-primary">{form.email}</strong>.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/documentation">
                <Button size="lg" className="rounded-full px-8 h-12">Découvrir la documentation <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12">Retour à l'accueil</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <FloatingHeaderShell logo={swanLogo} logoHref="/" />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_-80px,rgba(10,109,255,0.1),transparent)]" />
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut }} className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-4">Déployer SWAN</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Obtenez de l'aide pour déployer.</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              SWAN est 100% gratuit et open source. Remplissez ce formulaire si vous souhaitez de l'aide pour l'installation ou l'intégration SCADA.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-8 space-y-6"
          >
            {/* Identity */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Vos coordonnées</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Prénom <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input value={form.firstName} onChange={set("firstName")} placeholder="Rachid" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nom <span className="text-red-400">*</span></label>
                  <Input value={form.lastName} onChange={set("lastName")} placeholder="Bensalem" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email professionnel <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input type="email" value={form.email} onChange={set("email")} placeholder="r.bensalem@entreprise.dz" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input value={form.phone} onChange={set("phone")} placeholder="+213 5xx xxx xxx" className="pl-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Votre organisation</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Entreprise <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input value={form.company} onChange={set("company")} placeholder="Groupe Industriel SA" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Fonction</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <Input value={form.role} onChange={set("role")} placeholder="Responsable Maintenance" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Secteur d'activité</label>
                  <select
                    value={form.sector}
                    onChange={set("sector")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Sélectionner un secteur</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nombre d'équipements estimé</label>
                  <Input value={form.equipCount} onChange={set("equipCount")} placeholder="ex: 150 machines" />
                </div>
              </div>
            </div>

            {/* Deploy mode */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Mode de déploiement souhaité</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {DEPLOY_MODES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, plan: p.id }))}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      form.plan === p.id ? "border-primary bg-primary/5" : "border-border/50 bg-background/40 hover:border-border"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: p.color + "18" }}>
                      <p.icon className="h-4 w-4" style={{ color: p.color }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Message (optionnel)</label>
              <textarea
                value={form.message}
                onChange={set("message")}
                placeholder="Décrivez vos besoins, contraintes ou questions particulières..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button type="submit" size="lg" className="rounded-full px-8 h-12 w-full sm:w-auto">
                Envoyer ma demande <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vos données sont traitées conformément à notre{" "}
                <Link href="/legal/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                Réponse garantie sous 24h ouvrées.
              </p>
            </div>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
