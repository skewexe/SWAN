import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompany } from "@/context/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, MapPin, Image, CheckCircle2, ChevronRight,
  ChevronLeft, Sparkles, Globe, Phone, Briefcase, X,
} from "lucide-react";
import swanLogo from "@assets/ChatGPT Image 30 avr. 2026, 11_42_07.png";

// ─── Data ────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Pétrole & Gaz", "Sidérurgie", "Agroalimentaire", "Ciment & Matériaux",
  "Production d'énergie", "Eau & Assainissement", "Chimie & Pétrochimie",
  "Textile & Confection", "Mines & Carrières", "Transport & Logistique",
  "Pharmaceutique", "Électronique & Électrique", "Mécanique Générale", "Autre",
];

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi",
  "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla",
  "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane",
];

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, icon: Sparkles, label: "Bienvenue" },
  { id: 1, icon: Building2, label: "Entreprise" },
  { id: 2, icon: MapPin, label: "Localisation" },
  { id: 3, icon: Image, label: "Identité" },
  { id: 4, icon: CheckCircle2, label: "Prêt !" },
];

// ─── Slide variants ───────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 w-full px-8 pt-8 pb-2">
      {Array.from({ length: total }).map((_, i) => {
        const StepIcon = STEPS[i]?.icon || CheckCircle2;
        const isCompleted = i < step;
        const isCurrent = i === step;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <motion.div
              animate={{
                scale: isCurrent ? 1.1 : 1,
                backgroundColor: isCompleted ? "#0A6DFF" : isCurrent ? "#0A6DFF" : "rgba(255,255,255,0.06)",
                borderColor: isCompleted || isCurrent ? "#0A6DFF" : "rgba(255,255,255,0.1)",
              }}
              transition={{ duration: 0.3 }}
              className="h-9 w-9 rounded-full border-2 flex items-center justify-center shrink-0"
            >
              {isCompleted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <StepIcon className={`h-4 w-4 ${isCurrent ? "text-white" : "text-muted-foreground"}`} strokeWidth={1.5} />
              )}
            </motion.div>
            {i < total - 1 && (
              <div className="flex-1 h-px mx-1.5 relative overflow-hidden bg-border/30">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual steps ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4 px-6 gap-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
        <img src={swanLogo} alt="SWAN" className="h-24 w-auto relative drop-shadow-2xl" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenue sur <span className="text-primary">SWAN</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          Configurez votre espace de travail en quelques étapes pour une expérience sur mesure.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-3 w-full max-w-xs"
      >
        <div className="w-full grid grid-cols-3 gap-2 text-xs">
          {["🏭 Multi-sites", "🔧 GMAO complète", "📱 Telegram"].map(f => (
            <div key={f} className="bg-muted/40 border border-border/40 rounded-xl py-2.5 px-2 text-center text-muted-foreground font-medium">
              {f}
            </div>
          ))}
        </div>
        <Button onClick={onNext} className="w-full gap-2 rounded-full mt-2 h-11 text-sm font-semibold">
          Commencer la configuration
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function StepCompany({
  data, onChange, onNext, onBack,
}: { data: any; onChange: (k: string, v: string) => void; onNext: () => void; onBack: () => void }) {
  const valid = data.name?.trim().length >= 2 && data.industry?.trim();

  return (
    <div className="flex flex-col gap-5 px-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Votre entreprise</h2>
        <p className="text-sm text-muted-foreground mt-1">Parlez-nous de votre organisation</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Nom de l'entreprise *
          </label>
          <Input
            placeholder="Ex : Groupe SONELGAZ SPA"
            value={data.name}
            onChange={e => onChange("name", e.target.value)}
            className="h-11 bg-background/60 border-border/50 focus:border-primary/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Secteur d'activité *
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => onChange("industry", ind)}
                className={`text-xs font-medium px-3 py-2.5 rounded-xl border text-left transition-all ${
                  data.industry === ind
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background/40 border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            Téléphone <span className="text-muted-foreground/50 normal-case font-normal">(optionnel)</span>
          </label>
          <Input
            placeholder="+213 21 ..."
            value={data.phone}
            onChange={e => onChange("phone", e.target.value)}
            className="h-11 bg-background/60 border-border/50 focus:border-primary/60"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNext} disabled={!valid} className="flex-1 gap-2 rounded-full h-11 font-semibold">
          Continuer
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepLocation({
  data, onChange, onNext, onBack,
}: { data: any; onChange: (k: string, v: string) => void; onNext: () => void; onBack: () => void }) {
  const valid = data.city?.trim().length >= 2;

  return (
    <div className="flex flex-col gap-5 px-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Localisation</h2>
        <p className="text-sm text-muted-foreground mt-1">Où se trouve votre siège opérationnel ?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Pays
          </label>
          <div className="flex gap-2">
            {["Algérie", "Maroc", "Tunisie", "Autre"].map(c => (
              <button
                key={c}
                onClick={() => onChange("country", c)}
                className={`flex-1 text-xs font-medium px-3 py-2.5 rounded-xl border transition-all ${
                  data.country === c
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background/40 border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Wilaya / Région *
          </label>
          <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {WILAYAS.map(w => (
              <button
                key={w}
                onClick={() => onChange("wilaya", w)}
                className={`text-[11px] font-medium px-2 py-2 rounded-lg border text-left transition-all ${
                  data.wilaya === w
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background/40 border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Ville *
          </label>
          <Input
            placeholder="Ex : Oran, Alger, Annaba..."
            value={data.city}
            onChange={e => onChange("city", e.target.value)}
            className="h-11 bg-background/60 border-border/50 focus:border-primary/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Adresse <span className="text-muted-foreground/50 normal-case font-normal">(optionnel)</span>
          </label>
          <Input
            placeholder="Zone industrielle, Rue..."
            value={data.address}
            onChange={e => onChange("address", e.target.value)}
            className="h-11 bg-background/60 border-border/50 focus:border-primary/60"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNext} disabled={!valid} className="flex-1 gap-2 rounded-full h-11 font-semibold">
          Continuer
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const ACCENT_COLORS = [
  { label: "Swan Blue", value: "#0A6DFF" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Emerald", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F43F5E" },
];

function StepBranding({
  data, onChange, onNext, onBack,
}: { data: any; onChange: (k: string, v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-5 px-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Identité visuelle</h2>
        <p className="text-sm text-muted-foreground mt-1">Personnalisez l'apparence de votre espace</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5" />
            URL du logo <span className="text-muted-foreground/50 normal-case font-normal">(optionnel)</span>
          </label>
          <Input
            placeholder="https://votre-site.com/logo.png"
            value={data.logoUrl}
            onChange={e => onChange("logoUrl", e.target.value)}
            className="h-11 bg-background/60 border-border/50 focus:border-primary/60"
          />
          {data.logoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-3 bg-background/50 border border-border/40 rounded-xl p-3"
            >
              <img
                src={data.logoUrl}
                alt="Logo preview"
                className="h-10 w-auto max-w-[80px] object-contain rounded"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="text-xs text-muted-foreground">Aperçu du logo</span>
            </motion.div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Couleur d'accentuation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => onChange("accentColor", c.value)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  data.accentColor === c.value
                    ? "border-white/30 bg-white/10"
                    : "border-border/40 bg-background/40 text-muted-foreground hover:border-border"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card transition-all"
                  style={{
                    backgroundColor: c.value,
                    outlineColor: data.accentColor === c.value ? c.value : "transparent",
                    boxShadow: data.accentColor === c.value ? `0 0 0 2px ${c.value}` : undefined,
                  }}
                />
                <span className={data.accentColor === c.value ? "text-foreground" : ""}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div
          className="rounded-2xl border p-4 space-y-2"
          style={{ borderColor: `${data.accentColor}30`, background: `${data.accentColor}08` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: data.accentColor }}>
            Aperçu — Votre espace
          </p>
          <p className="text-sm font-bold text-foreground">{data.name || "Nom de l'entreprise"}</p>
          <p className="text-xs text-muted-foreground">{data.city || "Ville"} · {data.industry || "Secteur"}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button onClick={onNext} className="flex-1 gap-2 rounded-full h-11 font-semibold">
          Finaliser
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepDone({ data, onComplete }: { data: any; onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4 px-6 gap-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}
        className="relative"
      >
        <div
          className="absolute inset-0 rounded-full blur-2xl scale-150 opacity-50"
          style={{ backgroundColor: data.accentColor }}
        />
        <div
          className="relative h-24 w-24 rounded-full flex items-center justify-center"
          style={{ background: `${data.accentColor}20`, border: `2px solid ${data.accentColor}40` }}
        >
          <CheckCircle2 className="h-12 w-12" style={{ color: data.accentColor }} strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-foreground">Tout est prêt !</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Votre espace <span className="font-semibold text-foreground">{data.name}</span> est configuré. Commencez dès maintenant.
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-sm grid grid-cols-2 gap-2 text-xs"
      >
        {[
          { label: "Entreprise", value: data.name },
          { label: "Secteur", value: data.industry },
          { label: "Localisation", value: [data.city, data.wilaya].filter(Boolean).join(", ") || "—" },
          { label: "Pays", value: data.country },
        ].map(item => (
          <div key={item.label} className="bg-muted/30 border border-border/30 rounded-xl px-3 py-2.5 text-left">
            <p className="text-muted-foreground mb-0.5">{item.label}</p>
            <p className="font-semibold text-foreground truncate">{item.value || "—"}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button
          onClick={onComplete}
          className="w-full h-12 gap-2 rounded-full text-sm font-bold"
          style={{ backgroundColor: data.accentColor }}
        >
          <Sparkles className="h-4 w-4" />
          Accéder à mon tableau de bord
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main onboarding overlay ──────────────────────────────────────────────────
export function OnboardingFlow() {
  const { profile, saveProfile, completeOnboarding } = useCompany();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    name: profile.name || "",
    industry: profile.industry || "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || "",
    wilaya: profile.wilaya || "",
    country: profile.country || "Algérie",
    logoUrl: profile.logoUrl || "",
    accentColor: profile.accentColor || "#0A6DFF",
  });

  const update = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    saveProfile(formData);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  };

  const handleComplete = () => {
    saveProfile({ ...formData, onboardingDone: true });
    completeOnboarding();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11, 19, 43, 0.88)", backdropFilter: "blur(16px)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: formData.accentColor }}
      />

      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="relative w-full max-w-md bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden"
        style={{ boxShadow: `0 0 80px ${formData.accentColor}20, 0 24px 48px rgba(0,0,0,0.4)` }}
      >
        {/* Gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${formData.accentColor}, transparent)` }}
        />

        {/* Skip button (steps 1-3 only) */}
        {step > 0 && step < 4 && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Progress */}
        {step > 0 && step < 4 && (
          <StepProgress step={step} total={STEPS.length} />
        )}

        {/* Step content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="pb-6 pt-4"
            >
              {step === 0 && <StepWelcome onNext={goNext} />}
              {step === 1 && <StepCompany data={formData} onChange={update} onNext={goNext} onBack={goBack} />}
              {step === 2 && <StepLocation data={formData} onChange={update} onNext={goNext} onBack={goBack} />}
              {step === 3 && <StepBranding data={formData} onChange={update} onNext={goNext} onBack={goBack} />}
              {step === 4 && <StepDone data={formData} onComplete={handleComplete} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
