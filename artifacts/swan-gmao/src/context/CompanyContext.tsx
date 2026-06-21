import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CompanyProfile {
  name: string;
  industry: string;
  phone: string;
  address: string;
  city: string;
  wilaya: string;
  country: string;
  logoUrl: string;
  accentColor: string;
  onboardingDone: boolean;
}

const STORAGE_KEY = "swan_company_profile";

const DEFAULT_PROFILE: CompanyProfile = {
  name: "",
  industry: "",
  phone: "",
  address: "",
  city: "",
  wilaya: "",
  country: "Algérie",
  logoUrl: "",
  accentColor: "#0A6DFF",
  onboardingDone: false,
};

function load(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PROFILE;
}

interface CompanyContextValue {
  profile: CompanyProfile;
  saveProfile: (data: Partial<CompanyProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CompanyProfile>(load);

  const saveProfile = useCallback((data: Partial<CompanyProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    saveProfile({ onboardingDone: true });
  }, [saveProfile]);

  const resetOnboarding = useCallback(() => {
    saveProfile({ onboardingDone: false });
  }, [saveProfile]);

  return (
    <CompanyContext.Provider value={{ profile, saveProfile, completeOnboarding, resetOnboarding }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
