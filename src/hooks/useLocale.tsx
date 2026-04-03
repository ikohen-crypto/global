import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "es" | "en";

interface LocaleContextValue {
  language: AppLanguage;
  setLanguage(nextLanguage: AppLanguage): void;
  toggleLanguage(): void;
}

const STORAGE_KEY = "travel-budget-language";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "es";
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (storedLanguage === "es" || storedLanguage === "en") {
    return storedLanguage;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith("es") ? "es" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(resolveInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage() {
        setLanguage((currentLanguage) => (currentLanguage === "es" ? "en" : "es"));
      }
    }),
    [language]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
